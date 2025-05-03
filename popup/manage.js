/**
 * 网页金句收藏 - 管理页面主脚本
 * 整合各个模块，实现金句管理功能
 */

// 导入模块
import { StorageUtils, DOMUtils, DateUtils } from './js/utils.js';
import DataManager from './js/dataManager.js';
import UIManager from './js/uiManager.js';
import ImportExportManager from './js/importExport.js';
import ModalManager from './js/modalManager.js';

// 主应用类
class QuoteManager {
  constructor() {
    // 初始化各个管理器
    this.dataManager = new DataManager();
    this.uiManager = new UIManager(this.dataManager);
    this.modalManager = new ModalManager();
    this.importExportManager = new ImportExportManager();
    
    // DOM元素引用
    this.searchInput = document.getElementById('search-input');
    this.searchBtn = document.getElementById('search-btn');
    this.sortSelect = document.getElementById('sort-select');
    this.prevPageBtn = document.getElementById('prev-page');
    this.nextPageBtn = document.getElementById('next-page');
    this.addQuoteBtn = document.getElementById('add-quote-btn');
    this.exportBtn = document.getElementById('export-btn');
    this.importBtn = document.getElementById('import-btn');
    this.backBtn = document.getElementById('back-btn');
    this.saveQuoteBtn = document.getElementById('save-quote-btn');
    
    // 当前编辑的金句ID
    this.editingQuoteId = null;
    
    // 初始化事件监听
    this.initEventListeners();
  }

  /**
   * 初始化应用
   */
  async initialize() {
    // 初始化数据管理器
    await this.dataManager.initialize();
    
    // 初始化UI管理器
    this.uiManager.onEditQuote = this.handleEditQuote.bind(this);
    this.uiManager.renderQuotes(this.dataManager.getPaginatedData());
    await this.uiManager.renderTagsFilter();
    
    // 初始化导入导出管理器
    this.importExportManager.initialize(this.handleDataImported.bind(this));
  }

  /**
   * 初始化事件监听
   */
  initEventListeners() {
    // 搜索功能
    this.searchBtn.addEventListener('click', () => this.handleSearch());
    this.searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch();
      }
    });
    
    // 排序功能
    this.sortSelect.addEventListener('change', () => this.handleSort());
    
    // 分页功能
    this.prevPageBtn.addEventListener('click', () => this.handlePrevPage());
    this.nextPageBtn.addEventListener('click', () => this.handleNextPage());
    
    // 添加金句按钮
    this.addQuoteBtn.addEventListener('click', () => this.handleAddQuote());
    
    // 导出按钮
    this.exportBtn.addEventListener('click', () => this.handleExport());
    
    // 导入按钮
    this.importBtn.addEventListener('click', () => this.handleImport());
    
    // 返回按钮
    this.backBtn.addEventListener('click', () => this.handleBack());
    
    // 保存金句按钮
    this.saveQuoteBtn.addEventListener('click', () => this.handleSaveQuote());
    
    // 主题切换
    const themeSwitch = document.getElementById('theme-switch');
    themeSwitch.addEventListener('change', () => this.toggleTheme());
    
    // 初始化主题
    this.initTheme();
  }

  /**
   * 处理搜索
   */
  handleSearch() {
    const searchQuery = this.searchInput.value;
    const paginatedData = this.dataManager.setSearchQuery(searchQuery);
    this.uiManager.renderQuotes(paginatedData);
  }

  /**
   * 处理排序
   */
  handleSort() {
    const sortOption = this.sortSelect.value;
    const paginatedData = this.dataManager.setSortOption(sortOption);
    this.uiManager.renderQuotes(paginatedData);
  }

  /**
   * 处理上一页
   */
  handlePrevPage() {
    const paginatedData = this.dataManager.prevPage();
    this.uiManager.renderQuotes(paginatedData);
  }

  /**
   * 处理下一页
   */
  handleNextPage() {
    const paginatedData = this.dataManager.nextPage();
    this.uiManager.renderQuotes(paginatedData);
  }

  /**
   * 处理添加金句
   */
  handleAddQuote() {
    this.editingQuoteId = this.modalManager.openAddQuoteModal();
  }

  /**
   * 处理编辑金句
   * @param {Object} quote 要编辑的金句
   */
  handleEditQuote(quote) {
    this.editingQuoteId = this.modalManager.openEditQuoteModal(quote);
  }

  /**
   * 处理保存金句
   */
  async handleSaveQuote() {
    const quoteData = this.modalManager.getQuoteFormData();
    if (!quoteData) return;
    
    let paginatedData;
    
    if (this.editingQuoteId) {
      // 更新现有金句
      quoteData.id = this.editingQuoteId;
      paginatedData = await this.dataManager.updateQuote(quoteData);
    } else {
      // 添加新金句
      quoteData.id = Date.now().toString();
      quoteData.date = new Date().toISOString();
      paginatedData = await this.dataManager.addQuote(quoteData);
    }
    
    // 更新UI
    this.uiManager.renderQuotes(paginatedData);
    await this.uiManager.renderTagsFilter();
    
    // 关闭模态框
    this.modalManager.hideModal('quote-modal');
  }

  /**
   * 处理导出
   */
  handleExport() {
    this.modalManager.openExportModal();
    this.importExportManager.showExportOptions();
  }

  /**
   * 处理导入
   */
  handleImport() {
    this.modalManager.openImportModal();
    this.importExportManager.showImportOptions();
  }

  /**
   * 处理数据导入后的回调
   */
  async handleDataImported() {
    // 重新初始化数据
    await this.dataManager.initialize();
    this.uiManager.renderQuotes(this.dataManager.getPaginatedData());
    await this.uiManager.renderTagsFilter();
    
    // 关闭模态框
    this.modalManager.hideModal('data-modal');
  }

  /**
   * 处理返回按钮
   */
  handleBack() {
    window.location.href = 'popup.html';
  }

  /**
   * 初始化主题
   */
  initTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-theme', darkMode);
    document.getElementById('theme-switch').checked = darkMode;
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    const darkMode = document.getElementById('theme-switch').checked;
    document.body.classList.toggle('dark-theme', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new QuoteManager();
  app.initialize();
});