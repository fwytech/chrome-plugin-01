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
    const headers = ['ID', '内容', '来源', '标签', '笔记', '日期'];
    
    // 转换数据为CSV行
    const rows = quotes.map(quote => [
      quote.id,
      `"${quote.text.replace(/"/g, '""')}"`, // 处理文本中的引号
      quote.source ? `"${quote.source.replace(/"/g, '""')}"` : '',
      quote.tags ? quote.tags.join(',') : '',
      quote.notes ? `"${quote.notes.replace(/"/g, '""')}"` : '',
      quote.date
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
    
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'json' && fileExt !== 'csv') {
      alert('只支持导入 JSON 或 CSV 格式的文件');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        let importedQuotes = [];
        
        if (fileExt === 'json') {
          importedQuotes = this.parseJSON(e.target.result);
        } else if (fileExt === 'csv') {
          importedQuotes = this.parseCSV(e.target.result);
        }
        
        if (importedQuotes.length === 0) {
          alert('导入的文件不包含有效的金句数据');
          return;
        }
        
        // 合并数据
        await this.mergeQuotes(importedQuotes);
        
        alert(`成功导入 ${importedQuotes.length} 条金句`);
        this.importFile.value = ''; // 清空文件选择
        
        // 调用回调函数更新UI
        if (this.onDataImported) {
          this.onDataImported();
        }
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入数据失败: ' + error.message);
      }
    };
    
    reader.onerror = () => {
      alert('读取文件失败');
    };
    
    if (fileExt === 'json') {
      reader.readAsText(file);
    } else if (fileExt === 'csv') {
      reader.readAsText(file);
    }
  }

  /**
   * 解析JSON数据
   * @param {string} jsonString JSON字符串
   * @returns {Array} 金句数组
   */
  parseJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) {
        throw new Error('JSON数据格式不正确，应为数组');
      }
      
      // 验证每个金句对象
      return data.filter(quote => {
        return quote && typeof quote === 'object' && quote.text && quote.id;
      });
    } catch (error) {
      console.error('解析JSON失败:', error);
      throw new Error('解析JSON失败: ' + error.message);
    }
  }

  /**
   * 解析CSV数据
   * @param {string} csvString CSV字符串
   * @returns {Array} 金句数组
   */
  parseCSV(csvString) {
    try {
      // 简单的CSV解析
      const lines = csvString.split('\n');
      if (lines.length < 2) {
        throw new Error('CSV数据格式不正确');
      }
      
      // 解析表头
      const headers = this.parseCSVLine(lines[0]);
      const idIndex = headers.findIndex(h => h.toLowerCase() === 'id');
      const textIndex = headers.findIndex(h => ['内容', 'text', '金句', 'quote'].includes(h.toLowerCase()));
      const sourceIndex = headers.findIndex(h => ['来源', 'source'].includes(h.toLowerCase()));
      const tagsIndex = headers.findIndex(h => ['标签', 'tags'].includes(h.toLowerCase()));
      const notesIndex = headers.findIndex(h => ['笔记', 'notes'].includes(h.toLowerCase()));
      const dateIndex = headers.findIndex(h => ['日期', 'date'].includes(h.toLowerCase()));
      
      if (textIndex === -1) {
        throw new Error('CSV数据缺少必要的"内容"列');
      }
      
      // 解析数据行
      const quotes = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length < headers.length) continue;
        
        const quote = {
          id: values[idIndex] || Date.now().toString(),
          text: values[textIndex],
          source: sourceIndex !== -1 ? values[sourceIndex] : '',
          tags: tagsIndex !== -1 ? values[tagsIndex].split(/[,，]/).map(t => t.trim()).filter(t => t) : [],
          notes: notesIndex !== -1 ? values[notesIndex] : '',
          date: dateIndex !== -1 ? values[dateIndex] : new Date().toISOString()
        };
        
        quotes.push(quote);
      }
      
      return quotes;
    } catch (error) {
      console.error('解析CSV失败:', error);
      throw new Error('解析CSV失败: ' + error.message);
    }
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
   */
  async mergeQuotes(importedQuotes) {
    const existingQuotes = await StorageUtils.getAllQuotes();
    const mergedQuotes = new Map(existingQuotes.map(q => [q.id, q]));
    
    // 使用Map进行高效的数据合并
    importedQuotes.forEach(importedQuote => {
      if (!importedQuote.id) {
        importedQuote.id = Date.now().toString();
      }
      mergedQuotes.set(importedQuote.id, importedQuote);
    });
    
    await StorageUtils.saveQuotes(Array.from(mergedQuotes.values()));
  }
}