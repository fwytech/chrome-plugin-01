/**
 * 网页金句收藏 - 导入导出模块
 * 处理金句数据的导入和导出功能
 */

import { StorageUtils } from './utils.js';

class ImportExportManager {
  constructor() {
    // 导出相关元素
    this.exportOptions = document.getElementById('export-options');
    this.exportFormatRadios = document.getElementsByName('export-format');
    this.downloadBtn = document.getElementById('download-btn');
    
    // 导入相关元素
    this.importOptions = document.getElementById('import-options');
    this.importFile = document.getElementById('import-file');
    this.importConfirmBtn = document.getElementById('import-confirm-btn');
  }

  /**
   * 初始化导入导出功能
   * @param {Function} onDataImported 数据导入后的回调函数
   */
  initialize(onDataImported) {
    this.onDataImported = onDataImported;
    
    // 设置下载按钮事件
    this.downloadBtn.addEventListener('click', () => this.exportData());
    
    // 设置导入确认按钮事件
    this.importConfirmBtn.addEventListener('click', () => this.importData());
  }

  /**
   * 显示导出选项
   */
  showExportOptions() {
    this.exportOptions.style.display = 'block';
    this.importOptions.style.display = 'none';
  }

  /**
   * 显示导入选项
   */
  showImportOptions() {
    this.exportOptions.style.display = 'none';
    this.importOptions.style.display = 'block';
  }

  /**
   * 导出数据
   */
  async exportData() {
    const quotes = await StorageUtils.getAllQuotes();
    if (quotes.length === 0) {
      alert('没有可导出的金句数据');
      return;
    }
    
    // 获取选中的格式
    let format = 'json';
    for (const radio of this.exportFormatRadios) {
      if (radio.checked) {
        format = radio.value;
        break;
      }
    }
    
    // 根据格式导出数据
    if (format === 'json') {
      this.exportAsJSON(quotes);
    } else if (format === 'csv') {
      this.exportAsCSV(quotes);
    }
  }

  /**
   * 导出为JSON格式
   * @param {Array} quotes 金句数组
   */
  exportAsJSON(quotes) {
    const jsonData = JSON.stringify(quotes, null, 2);
    this.downloadFile(jsonData, 'quotes.json', 'application/json');
  }

  /**
   * 导出为CSV格式
   * @param {Array} quotes 金句数组
   */
  exportAsCSV(quotes) {
    // CSV 表头
    const headers = ['ID', '内容', '来源', '标签', '笔记', '创建日期', '更新日期'];
    
    // 转换数据为CSV行
    const rows = quotes.map(quote => [
      quote.id,
      `"${quote.text.replace(/"/g, '""')}"`, // 处理文本中的引号
      quote.source ? `"${quote.source.replace(/"/g, '""')}"` : '',
      quote.tags ? `"${quote.tags.join(',')}"` : '', // 将标签用引号包裹
      quote.notes ? `"${quote.notes.replace(/"/g, '""')}"` : '',
      quote.createdAt ? new Date(quote.createdAt).toLocaleString() : '',
      quote.updatedAt ? new Date(quote.updatedAt).toLocaleString() : ''
    ]);
    
    // 组合CSV内容
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    this.downloadFile(csvContent, 'quotes.csv', 'text/csv;charset=utf-8');
  }

  /**
   * 下载文件
   * @param {string} content 文件内容
   * @param {string} filename 文件名
   * @param {string} contentType 内容类型
   */
  downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * 导入数据
   */
  async importData() {
    const file = this.importFile.files[0];
    if (!file) {
      alert('请选择要导入的文件');
      return;
    }

    // 验证文件格式
    const validExtensions = ['.json', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      alert('不支持的文件格式，请选择 JSON 或 CSV 文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let importedData;
        if (fileExtension === '.json') {
          importedData = this.parseJSON(e.target.result);
        } else {
          importedData = this.parseCSV(e.target.result);
        }

        // 验证导入的数据
        if (!Array.isArray(importedData)) {
          throw new Error('导入的数据格式不正确');
        }

        // 验证数据结构
        const validationErrors = this.validateImportedData(importedData);
        if (validationErrors.length > 0) {
          throw new Error(`数据验证失败：\n${validationErrors.join('\n')}`);
        }

        // 合并数据
        const result = await this.mergeQuotes(importedData);

        // 关闭导入弹窗并刷新数据
        this.importOptions.style.display = 'none';
        if (this.onDataImported) {
          this.onDataImported();
        }

        alert(`数据导入成功！\n新增：${result.added} 条\n更新：${result.updated} 条\n跳过：${result.skipped} 条`);
      } catch (error) {
        alert(`导入失败: ${error.message}`);
      }
    };

    reader.readAsText(file);
  }

  /**
   * 解析JSON数据
   * @param {string} jsonStr JSON字符串
   * @returns {Array} 解析后的金句数组
   */
  parseJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) {
        throw new Error('JSON数据必须是数组格式');
      }
      return data;
    } catch (error) {
      if (error.message === 'JSON数据必须是数组格式') {
        throw error;
      }
      throw new Error('JSON格式不正确，请检查文件内容');
    }
  }

  /**
   * 解析CSV数据
   * @param {string} csvStr CSV字符串
   * @returns {Array} 解析后的金句数组
   */
  parseCSV(csvStr) {
    // 预处理CSV字符串
    const lines = csvStr.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error('CSV文件必须包含表头和至少一行数据');
    }

    // 解析表头
    const headers = this.parseCSVLine(lines[0]);
    const requiredHeaders = ['内容'];
    const missingHeaders = requiredHeaders.filter(h => !headers.map(h => h.toLowerCase()).includes(h.toLowerCase()));
    if (missingHeaders.length > 0) {
      throw new Error(`CSV文件缺少必需的列：${missingHeaders.join(', ')}`);
    }

    // 解析数据行
    const quotes = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        console.warn(`跳过第${i + 1}行：列数不匹配`);
        continue;
      }

      const quote = {};
      headers.forEach((header, index) => {
        let value = values[index].trim();
        // 如果值被引号包裹，去除引号
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/""/g, '"');
        }
        
        switch (header.toLowerCase()) {
          case '内容':
            quote.text = value || '';
            break;
          case '来源':
            quote.source = value || null;
            break;
          case '标签':
            // 处理标签，移除空标签和重复标签
            quote.tags = value
              ? [...new Set(value.split(',').map(tag => tag.trim()).filter(Boolean))]
              : [];
            break;
          case '笔记':
            quote.notes = value || null;
            break;
          case '创建日期':
            try {
              quote.createdAt = value ? new Date(value.replace(/[年月日]/g, '/')).getTime() : Date.now();
            } catch {
              quote.createdAt = Date.now();
            }
            break;
          case '更新日期':
            try {
              quote.updatedAt = value ? new Date(value.replace(/[年月日]/g, '/')).getTime() : Date.now();
            } catch {
              quote.updatedAt = Date.now();
            }
            break;
        }
      });

      if (quote.text) {
        quotes.push(quote);
      }
    }

    return quotes;
  }

  /**
   * 解析CSV行
   * @param {string} line CSV行
   * @returns {Array} 解析后的值数组
   */
  parseCSVLine(line) {
    const values = [];
    let value = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(value.trim());
        value = '';
      } else {
        value += char;
      }
    }
    
    values.push(value.trim());
    return values;
  }

  /**
   * 合并导入的金句数据
   * @param {Array} importedQuotes 导入的金句数组
   * @returns {Object} 合并结果统计
   */
  async mergeQuotes(importedQuotes) {
    const existingQuotes = await StorageUtils.getAllQuotes();
    const result = {
      added: 0,
      updated: 0,
      skipped: 0
    };

    // 为新数据生成唯一ID和时间戳
    const processedQuotes = importedQuotes.map(quote => {
      const now = Date.now();
      const uniqueId = now.toString() + Math.random().toString(36).substr(2, 5);
      return {
        ...quote,
        id: quote.id || uniqueId,
        text: (quote.text || '').trim(),
        source: quote.source ? quote.source.trim() : null,
        tags: Array.isArray(quote.tags) ? [...new Set(quote.tags.map(tag => tag.trim()).filter(Boolean))] : [],
        notes: quote.notes ? quote.notes.trim() : null,
        createdAt: quote.createdAt || now,
        updatedAt: now
      };
    });

    // 合并数据
    const mergedQuotes = [...existingQuotes];
    for (const quote of processedQuotes) {
      // 检查是否存在重复内容（忽略大小写和多余空格）
      const duplicateIndex = mergedQuotes.findIndex(q => 
        q.text.trim().toLowerCase() === quote.text.trim().toLowerCase() && 
        (!q.source && !quote.source || (q.source && quote.source && q.source.trim().toLowerCase() === quote.source.trim().toLowerCase()))
      );

      if (duplicateIndex === -1) {
        // 新增金句
        mergedQuotes.push(quote);
        result.added++;
      } else {
        // 检查是否需要更新
        const existing = mergedQuotes[duplicateIndex];
        const hasChanges = 
          JSON.stringify(existing.tags.sort()) !== JSON.stringify(quote.tags.sort()) ||
          (existing.notes || '').trim() !== (quote.notes || '').trim();

        if (hasChanges) {
          // 更新现有金句，保留原有ID
          mergedQuotes[duplicateIndex] = {
            ...existing,
            tags: quote.tags.length > 0 ? quote.tags : existing.tags,
            notes: quote.notes || existing.notes,
            updatedAt: Date.now()
          };
          result.updated++;
        } else {
          result.skipped++;
        }
      }
    }

    // 保存合并后的数据
    await StorageUtils.saveQuotes(mergedQuotes);
    return result;
  }
}