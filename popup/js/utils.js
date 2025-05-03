/**
 * 网页金句收藏 - 工具函数模块
 * 提供通用的工具函数和辅助方法
 */

// 存储操作相关函数
const StorageUtils = {
  /**
   * 获取所有金句数据
   * @returns {Promise<Array>} 金句数组
   */
  getAllQuotes: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['quotes'], (result) => {
        resolve(result.quotes || []);
      });
    });
  },

  /**
   * 保存金句数据
   * @param {Array} quotes 金句数组
   * @returns {Promise<void>}
   */
  saveQuotes: async function(quotes) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ quotes }, resolve);
    });
  },

  /**
   * 获取所有标签
   * @returns {Promise<Array>} 标签数组
   */
  getAllTags: async function() {
    const quotes = await this.getAllQuotes();
    const tagsSet = new Set();
    
    quotes.forEach(quote => {
      if (quote.tags && Array.isArray(quote.tags)) {
        quote.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet);
  },

  /**
   * 获取标签及其计数
   * @returns {Promise<Array>} 标签及计数数组
   */
  getTagsWithCount: async function() {
    const quotes = await this.getAllQuotes();
    const tagsCount = {};
    
    quotes.forEach(quote => {
      if (quote.tags && Array.isArray(quote.tags)) {
        quote.tags.forEach(tag => {
          tagsCount[tag] = (tagsCount[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagsCount).map(([tag, count]) => ({ tag, count }));
  }
};

// DOM 操作相关函数
const DOMUtils = {
  /**
   * 创建元素并设置属性
   * @param {string} tag 标签名
   * @param {Object} attributes 属性对象
   * @param {string|Node} content 内容
   * @returns {HTMLElement} 创建的元素
   */
  createElement: function(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class' || key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    if (typeof content === 'string') {
      element.textContent = content;
    } else if (content instanceof Node) {
      element.appendChild(content);
    }
    
    return element;
  },

  /**
   * 清空元素内容
   * @param {HTMLElement} element 要清空的元素
   */
  clearElement: function(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  },

  /**
   * 显示模态框
   * @param {string} modalId 模态框ID
   */
  showModal: function(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
  },

  /**
   * 隐藏模态框
   * @param {string} modalId 模态框ID
   */
  hideModal: function(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
  }
};

// 日期格式化函数
const DateUtils = {
  /**
   * 格式化日期
   * @param {Date|string|number} date 日期对象或时间戳
   * @returns {string} 格式化后的日期字符串
   */
  formatDate: function(date) {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// 导出模块
export { StorageUtils, DOMUtils, DateUtils };