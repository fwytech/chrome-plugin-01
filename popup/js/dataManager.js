/**
 * 网页金句收藏 - 数据管理模块
 * 处理金句数据的过滤、排序和分页功能
 */

import { StorageUtils } from './utils.js';

class DataManager {
  constructor() {
    this.quotes = [];
    this.filteredQuotes = [];
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.searchQuery = '';
    this.activeTags = [];
    this.sortOption = 'newest';
  }

  /**
   * 初始化数据
   */
  async initialize() {
    this.quotes = await StorageUtils.getAllQuotes();
    this.applyFilters();
    return this.getPaginatedData();
  }

  /**
   * 设置搜索查询
   * @param {string} query 搜索关键词
   */
  setSearchQuery(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilters();
    return this.getPaginatedData();
  }

  /**
   * 设置排序选项
   * @param {string} option 排序选项
   */
  setSortOption(option) {
    this.sortOption = option;
    this.applyFilters();
    return this.getPaginatedData();
  }

  /**
   * 设置活动标签
   * @param {Array} tags 标签数组
   */
  setActiveTags(tags) {
    this.activeTags = tags;
    this.currentPage = 1;
    this.applyFilters();
    return this.getPaginatedData();
  }

  /**
   * 切换标签选择状态
   * @param {string} tag 标签
   */
  toggleTag(tag) {
    if (this.activeTags.includes(tag)) {
      this.activeTags = this.activeTags.filter(t => t !== tag);
    } else {
      this.activeTags.push(tag);
    }
    this.currentPage = 1;
    this.applyFilters();
    return this.getPaginatedData();
  }

  /**
   * 应用过滤器和排序
   */
  applyFilters() {
    // 应用搜索和标签过滤
    this.filteredQuotes = this.quotes.filter(quote => {
      // 搜索过滤
      const matchesSearch = this.searchQuery === '' || 
        quote.text.toLowerCase().includes(this.searchQuery) ||
        (quote.source && quote.source.toLowerCase().includes(this.searchQuery)) ||
        (quote.notes && quote.notes.toLowerCase().includes(this.searchQuery));
      
      // 标签过滤
      const matchesTags = this.activeTags.length === 0 || 
        (quote.tags && this.activeTags.every(tag => quote.tags.includes(tag)));
      
      return matchesSearch && matchesTags;
    });

    // 应用排序
    this.sortData();
  }

  /**
   * 排序数据
   */
  sortData() {
    this.filteredQuotes.sort((a, b) => {
      switch (this.sortOption) {
        case 'newest':
          return new Date(b.date) - new Date(a.date);
        case 'oldest':
          return new Date(a.date) - new Date(b.date);
        case 'az':
          return a.text.localeCompare(b.text, 'zh-CN');
        case 'za':
          return b.text.localeCompare(a.text, 'zh-CN');
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });
  }

  /**
   * 获取分页数据
   */
  getPaginatedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedQuotes = this.filteredQuotes.slice(startIndex, endIndex);
    
    return {
      quotes: paginatedQuotes,
      totalQuotes: this.filteredQuotes.length,
      currentPage: this.currentPage,
      totalPages: Math.ceil(this.filteredQuotes.length / this.itemsPerPage)
    };
  }

  /**
   * 下一页
   */
  nextPage() {
    const totalPages = Math.ceil(this.filteredQuotes.length / this.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
    }
    return this.getPaginatedData();
  }

  /**
   * 上一页
   */
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
    return this.getPaginatedData();
  }

  /**
   * 添加金句
   * @param {Object} quote 金句对象
   */
  async addQuote(quote) {
    // 确保有ID和日期
    if (!quote.id) {
      quote.id = Date.now().toString();
    }
    if (!quote.date) {
      quote.date = new Date().toISOString();
    }
    
    this.quotes.push(quote);
    await StorageUtils.saveQuotes(this.quotes);
    this.applyFilters();
    return this.getPaginatedData();
  }

  /**
   * 更新金句
   * @param {Object} updatedQuote 更新后的金句对象
   */
  async updateQuote(updatedQuote) {
    const index = this.quotes.findIndex(q => q.id === updatedQuote.id);
    if (index !== -1) {
      this.quotes[index] = { ...this.quotes[index], ...updatedQuote };
      await StorageUtils.saveQuotes(this.quotes);
      this.applyFilters();
    }
    return this.getPaginatedData();
  }

  /**
   * 删除金句
   * @param {string} quoteId 金句ID
   */
  async deleteQuote(quoteId) {
    this.quotes = this.quotes.filter(quote => quote.id !== quoteId);
    await StorageUtils.saveQuotes(this.quotes);
    this.applyFilters();
    return this.getPaginatedData();
  }

  /**
   * 获取标签及其计数
   * @returns {Promise<Array>} 标签及计数数组
   */
  async getTagsWithCount() {
    const tagsCount = {};
    
    this.quotes.forEach(quote => {
      if (quote.tags && Array.isArray(quote.tags)) {
        quote.tags.forEach(tag => {
          tagsCount[tag] = (tagsCount[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagsCount).map(([tag, count]) => ({ tag, count }));
  }
}

export default DataManager;