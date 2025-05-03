/**
 * 网页金句收藏 - 弹出窗口脚本
 * 实现弹出窗口的交互功能，包括金句展示、搜索、添加和管理等
 */

// 存储相关常量
const STORAGE_KEY = 'web_quotes';
const THEME_KEY = 'theme_preference';

// DOM 元素
const elements = {
  themeSwitch: document.getElementById('theme-switch'),
  searchInput: document.getElementById('search-input'),
  searchBtn: document.getElementById('search-btn'),
  deepseekBtn: document.getElementById('deepseek-btn'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  recentQuotes: document.getElementById('recent-quotes'),
  allQuotes: document.getElementById('all-quotes'),
  tagsList: document.getElementById('tags-list'),
  addQuoteBtn: document.getElementById('add-quote-btn'),
  manageBtn: document.getElementById('manage-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  addQuoteModal: document.getElementById('add-quote-modal'),
  closeModalBtn: document.querySelector('.close-btn'),
  quoteText: document.getElementById('quote-text'),
  quoteSource: document.getElementById('quote-source'),
  quoteTags: document.getElementById('quote-tags'),
  quoteNotes: document.getElementById('quote-notes'),
  saveQuoteBtn: document.getElementById('save-quote-btn')
};

// 数据存储对象
const storage = {
  /**
   * 获取所有金句数据
   * @returns {Promise<Array>} 金句数组
   */
  getAllQuotes: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const quotes = result[STORAGE_KEY] || [];
        resolve(quotes);
      });
    });
  },
  
  /**
   * 保存金句数据
   * @param {Array} quotes - 金句数组
   * @returns {Promise<void>}
   */
  saveQuotes: async function(quotes) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: quotes }, resolve);
    });
  },
  
  /**
   * 添加新金句
   * @param {Object} quote - 金句对象
   * @returns {Promise<void>}
   */
  addQuote: async function(quote) {
    const quotes = await this.getAllQuotes();
    quotes.unshift(quote); // 添加到数组开头
    await this.saveQuotes(quotes);
  },
  
  /**
   * 删除金句
   * @param {string} id - 金句ID
   * @returns {Promise<void>}
   */
  deleteQuote: async function(id) {
    const quotes = await this.getAllQuotes();
    const updatedQuotes = quotes.filter(quote => quote.id !== id);
    await this.saveQuotes(updatedQuotes);
  },
  
  /**
   * 更新金句
   * @param {Object} updatedQuote - 更新后的金句对象
   * @returns {Promise<void>}
   */
  updateQuote: async function(updatedQuote) {
    const quotes = await this.getAllQuotes();
    const index = quotes.findIndex(quote => quote.id === updatedQuote.id);
    if (index !== -1) {
      quotes[index] = updatedQuote;
      await this.saveQuotes(quotes);
    }
  },
  
  /**
   * 获取主题偏好设置
   * @returns {Promise<string>} 主题名称 ('light' 或 'dark')
   */
  getThemePreference: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get([THEME_KEY], (result) => {
        resolve(result[THEME_KEY] || 'light');
      });
    });
  },
  
  /**
   * 保存主题偏好设置
   * @param {string} theme - 主题名称 ('light' 或 'dark')
   * @returns {Promise<void>}
   */
  saveThemePreference: async function(theme) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [THEME_KEY]: theme }, resolve);
    });
  }
};

// 初始化事件监听器
function initEventListeners() {
  // 绑定DeepSeek总结按钮点击事件
  elements.deepseekBtn.addEventListener('click', () => ui.handleDeepseekSummary());
}

// DeepSeek API相关函数
const deepseekApi = {
  /**
   * 调用DeepSeek API进行文本总结
   * @param {string} text - 需要总结的文本
   * @returns {Promise<string>} 总结结果
   */
  summarizeText: async function(text) {
    try {
      const response = await fetch('http://localhost:3000/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error('API请求失败');
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API调用失败:', error);
      throw error;
    }
  }
};

// 工具函数
const utils = {
  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },
  
  /**
   * 格式化日期
   * @param {number} timestamp - 时间戳
   * @returns {string} 格式化后的日期字符串
   */
  formatDate: function(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  /**
   * 解析标签字符串
   * @param {string} tagsString - 逗号分隔的标签字符串
   * @returns {Array} 标签数组
   */
  parseTags: function(tagsString) {
    if (!tagsString) return [];
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
  }
};

// UI 相关函数
const ui = {
  /**
   * 使用DeepSeek进行文本总结
   */
  handleDeepseekSummary: async function() {
    try {
      const text = elements.searchInput.value;
      if (!text) {
        alert('请输入需要总结的文本');
        return;
      }
      
      elements.deepseekBtn.disabled = true;
      elements.deepseekBtn.textContent = '正在总结...';
      
      const summary = await deepseekApi.summarizeText(text);
      elements.searchInput.value = summary;
    } catch (error) {
      alert('总结失败: ' + error.message);
    } finally {
      elements.deepseekBtn.disabled = false;
      elements.deepseekBtn.textContent = 'DeepSeek R1总结';
    }
  },

  /**
   * 创建金句元素
   * @param {Object} quote - 金句对象
   * @returns {HTMLElement} 金句DOM元素
   */
  createQuoteElement: function(quote) {
    const quoteEl = document.createElement('div');
    quoteEl.className = 'quote-item';
    quoteEl.dataset.id = quote.id;
    
    const quoteText = document.createElement('div');
    quoteText.className = 'quote-text';
    quoteText.textContent = quote.text;
    
    const quoteSource = document.createElement('div');
    quoteSource.className = 'quote-source';
    quoteSource.textContent = quote.source ? `来源: ${quote.source}` : '';
    
    const quoteTags = document.createElement('div');
    quoteTags.className = 'quote-tags';
    quote.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = tag;
      quoteTags.appendChild(tagEl);
    });
    
    const quoteActions = document.createElement('div');
    quoteActions.className = 'quote-actions';
    
    const editBtn = document.createElement('button');
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => this.editQuote(quote));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => this.deleteQuote(quote.id));
    
    const shareBtn = document.createElement('button');
    shareBtn.textContent = '分享';
    shareBtn.addEventListener('click', () => this.shareQuote(quote));
    
    quoteActions.appendChild(editBtn);
    quoteActions.appendChild(deleteBtn);
    quoteActions.appendChild(shareBtn);
    
    quoteEl.appendChild(quoteText);
    quoteEl.appendChild(quoteSource);
    quoteEl.appendChild(quoteTags);
    quoteEl.appendChild(quoteActions);
    
    return quoteEl;
  },
  
  /**
   * 渲染金句列表
   * @param {Array} quotes - 金句数组
   * @param {HTMLElement} container - 容器元素
   */
  renderQuotes: function(quotes, container) {
    container.innerHTML = '';
    
    if (quotes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = '暂无收藏的金句';
      container.appendChild(emptyState);
      return;
    }
    
    quotes.forEach(quote => {
      const quoteEl = this.createQuoteElement(quote);
      container.appendChild(quoteEl);
    });
  },
  
  /**
   * 渲染标签列表
   * @param {Array} quotes - 金句数组
   */
  renderTags: function(quotes) {
    const tagsContainer = elements.tagsList;
    tagsContainer.innerHTML = '';
    
    // 提取所有标签并计数
    const tagsCount = {};
    quotes.forEach(quote => {
      quote.tags.forEach(tag => {
        tagsCount[tag] = (tagsCount[tag] || 0) + 1;
      });
    });
    
    // 转换为数组并排序
    const sortedTags = Object.entries(tagsCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
    
    if (sortedTags.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = '暂无标签';
      tagsContainer.appendChild(emptyState);
      return;
    }
    
    // 创建标签元素
    sortedTags.forEach(({ tag, count }) => {
      const tagEl = document.createElement('div');
      tagEl.className = 'tag-item';
      tagEl.innerHTML = `<span class="tag">${tag}</span> <span class="tag-count">${count}</span>`;
      tagEl.addEventListener('click', () => this.filterByTag(tag));
      tagsContainer.appendChild(tagEl);
    });
  },
  
  /**
   * 按标签筛选金句
   * @param {string} tag - 标签名称
   */
  filterByTag: async function(tag) {
    const quotes = await storage.getAllQuotes();
    const filtered = quotes.filter(quote => quote.tags.includes(tag));
    this.renderQuotes(filtered, elements.allQuotes);
    
    // 切换到全部金句标签页
    this.switchTab('all');
    
    // 更新搜索框
    elements.searchInput.value = `#${tag}`;
  },
  
  /**
   * 切换标签页
   * @param {string} tabId - 标签页ID
   */
  switchTab: function(tabId) {
    // 更新标签按钮状态
    elements.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // 更新标签内容显示
    elements.tabContents.forEach(content => {
      const isActive = content.id === `${tabId}-content`;
      content.classList.toggle('active', isActive);
    });
  },
  
  /**
   * 打开添加金句模态框
   * @param {Object} quote - 可选，用于编辑模式
   */
  openAddQuoteModal: function(quote = null) {
    // 清空表单
    elements.quoteText.value = quote ? quote.text : '';
    elements.quoteSource.value = quote ? quote.source : '';
    elements.quoteTags.value = quote ? quote.tags.join(', ') : '';
    elements.quoteNotes.value = quote ? quote.notes : '';
    
    // 更新按钮文本
    elements.saveQuoteBtn.textContent = quote ? '更新' : '保存';
    elements.saveQuoteBtn.dataset.mode = quote ? 'edit' : 'add';
    elements.saveQuoteBtn.dataset.id = quote ? quote.id : '';
    
    // 显示模态框
    elements.addQuoteModal.classList.add('active');
  },
  
  /**
   * 关闭添加金句模态框
   */
  closeAddQuoteModal: function() {
    elements.addQuoteModal.classList.remove('active');
  },
  
  /**
   * 编辑金句
   * @param {Object} quote - 金句对象
   */
  editQuote: function(quote) {
    this.openAddQuoteModal(quote);
  },
  
  /**
   * 删除金句
   * @param {string} id - 金句ID
   */
  deleteQuote: async function(id) {
    if (confirm('确定要删除这条金句吗？')) {
      await storage.deleteQuote(id);
      await this.refreshQuotes();
    }
  },
  
  /**
   * 分享金句
   * @param {Object} quote - 金句对象
   */
  shareQuote: function(quote) {
    // 简单实现：复制到剪贴板
    const shareText = `${quote.text}\n${quote.source ? `——${quote.source}` : ''}`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert('金句已复制到剪贴板，可以粘贴分享了！');
    }).catch(err => {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制。');
    });
  },
  
  /**
   * 刷新金句列表
   */
  refreshQuotes: async function() {
    const quotes = await storage.getAllQuotes();
    
    // 渲染最近收藏的金句（最多5条）
    this.renderQuotes(quotes.slice(0, 5), elements.recentQuotes);
    
    // 渲染所有金句
    this.renderQuotes(quotes, elements.allQuotes);
    
    // 渲染标签
    this.renderTags(quotes);
  },
  
  /**
   * 搜索金句
   * @param {string} keyword - 搜索关键词
   */
  searchQuotes: async function(keyword) {
    if (!keyword.trim()) {
      await this.refreshQuotes();
      return;
    }
    
    const quotes = await storage.getAllQuotes();
    let filtered;
    
    // 检查是否是标签搜索
    if (keyword.startsWith('#')) {
      const tag = keyword.slice(1).trim().toLowerCase();
      filtered = quotes.filter(quote => 
        quote.tags.some(t => t.toLowerCase().includes(tag))
      );
    } else {
      // 普通关键词搜索
      const lowerKeyword = keyword.toLowerCase();
      filtered = quotes.filter(quote => 
        quote.text.toLowerCase().includes(lowerKeyword) ||
        quote.source.toLowerCase().includes(lowerKeyword) ||
        quote.notes.toLowerCase().includes(lowerKeyword) ||
        quote.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
      );
    }
    
    // 渲染搜索结果
    this.renderQuotes(filtered, elements.allQuotes);
    
    // 切换到全部金句标签页
    this.switchTab('all');
  },
  
  /**
   * 应用主题
   * @param {string} theme - 主题名称 ('light' 或 'dark')
   */
  applyTheme: function(theme) {
    document.body.setAttribute('data-theme', theme);
    elements.themeSwitch.checked = theme === 'dark';
  }
};

// 事件处理
const events = {
  /**
   * 初始化事件监听
   */
  init: function() {
    // 主题切换
    elements.themeSwitch.addEventListener('change', async (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      ui.applyTheme(theme);
      await storage.saveThemePreference(theme);
    });
    
    // 标签页切换
    elements.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ui.switchTab(btn.dataset.tab);
      });
    });
    
    // 搜索
    elements.searchBtn.addEventListener('click', () => {
      ui.searchQuotes(elements.searchInput.value);
    });
    
    elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        ui.searchQuotes(elements.searchInput.value);
      }
    });
    
    // 添加金句按钮
    elements.addQuoteBtn.addEventListener('click', () => {
      ui.openAddQuoteModal();
    });
    
    // 关闭模态框
    elements.closeModalBtn.addEventListener('click', () => {
      ui.closeAddQuoteModal();
    });
    
    // 点击模态框外部关闭
    elements.addQuoteModal.addEventListener('click', (e) => {
      if (e.target === elements.addQuoteModal) {
        ui.closeAddQuoteModal();
      }
    });
    
    // 保存金句
    elements.saveQuoteBtn.addEventListener('click', async () => {
      const text = elements.quoteText.value.trim();
      if (!text) {
        alert('请输入金句内容');
        return;
      }
      
      const source = elements.quoteSource.value.trim();
      const tags = utils.parseTags(elements.quoteTags.value);
      const notes = elements.quoteNotes.value.trim();
      
      const mode = elements.saveQuoteBtn.dataset.mode;
      
      if (mode === 'edit') {
        // 编辑模式
        const id = elements.saveQuoteBtn.dataset.id;
        const updatedQuote = {
          id,
          text,
          source,
          tags,
          notes,
          updatedAt: Date.now()
        };
        
        await storage.updateQuote(updatedQuote);
      } else {
        // 添加模式
        const newQuote = {
          id: utils.generateId(),
          text,
          source,
          tags,
          notes,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        await storage.addQuote(newQuote);
      }
      
      await ui.refreshQuotes();
      ui.closeAddQuoteModal();
    });
    
    // 管理按钮 - 暂时简单实现为切换到全部金句标签页
    elements.manageBtn.addEventListener('click', () => {
      ui.switchTab('all');
    });
    
    // 设置按钮 - 暂未实现完整功能
    elements.settingsBtn.addEventListener('click', () => {
      alert('设置功能将在后续版本中提供');
    });
  }
};

// 应用初始化
async function init() {
  // 加载主题偏好
  const theme = await storage.getThemePreference();
  ui.applyTheme(theme);
  
  // 加载金句数据
  await ui.refreshQuotes();
  
  // 初始化事件监听
  events.init();
  
  // 默认显示最近标签页
  ui.switchTab('recent');
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);