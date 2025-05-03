/**
 * 网页金句收藏 - UI管理模块
 * 处理视图切换、标签显示和金句渲染等界面相关功能
 */

import { DOMUtils, DateUtils } from './utils.js';

class UIManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.currentView = 'list'; // 默认列表视图
    
    // DOM元素引用
    this.quotesList = document.getElementById('quotes-list');
    this.filterTagsList = document.getElementById('filter-tags-list');
    this.pageInfo = document.getElementById('page-info');
    this.prevPageBtn = document.getElementById('prev-page');
    this.nextPageBtn = document.getElementById('next-page');
    
    // 初始化视图切换按钮事件
    this.initViewToggle();
  }

  /**
   * 初始化视图切换按钮
   */
  initViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.setView(view);
        
        // 更新按钮状态
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  /**
   * 设置当前视图
   * @param {string} view 视图类型 ('list' 或 'card')
   */
  setView(view) {
    this.currentView = view;
    this.renderQuotes(this.dataManager.getPaginatedData());
  }

  /**
   * 渲染标签过滤器
   * @param {Array} tagsWithCount 带计数的标签数组
   */
  async renderTagsFilter() {
    const tagsWithCount = await this.dataManager.getTagsWithCount();
    DOMUtils.clearElement(this.filterTagsList);
    
    if (tagsWithCount.length === 0) {
      this.filterTagsList.innerHTML = '<div class="empty-state">暂无标签</div>';
      return;
    }
    
    tagsWithCount.forEach(({ tag, count }) => {
      const isActive = this.dataManager.activeTags.includes(tag);
      const tagElement = DOMUtils.createElement('div', {
        class: `tag-item ${isActive ? 'active' : ''}`,
        'data-tag': tag
      });
      
      const tagText = DOMUtils.createElement('span', { class: 'tag' }, tag);
      const tagCount = DOMUtils.createElement('span', { class: 'tag-count' }, count.toString());
      
      tagElement.appendChild(tagText);
      tagElement.appendChild(tagCount);
      
      tagElement.addEventListener('click', () => {
        const updatedData = this.dataManager.toggleTag(tag);
        this.renderQuotes(updatedData);
        this.renderTagsFilter(); // 重新渲染标签以更新活动状态
      });
      
      this.filterTagsList.appendChild(tagElement);
    });
  }

  /**
   * 渲染金句列表
   * @param {Object} paginatedData 分页数据对象
   */
  renderQuotes(paginatedData) {
    const { quotes, totalQuotes, currentPage, totalPages } = paginatedData;
    
    // 清空列表
    DOMUtils.clearElement(this.quotesList);
    
    // 设置列表视图类
    this.quotesList.className = `quotes-container quotes-${this.currentView}-view`;
    
    // 检查是否有金句
    if (quotes.length === 0) {
      this.quotesList.innerHTML = '<div class="empty-state">暂无符合条件的金句</div>';
      this.updatePagination(currentPage, totalPages);
      return;
    }
    
    // 渲染金句
    quotes.forEach(quote => {
      const quoteItem = this.createQuoteElement(quote);
      this.quotesList.appendChild(quoteItem);
    });
    
    // 更新分页信息
    this.updatePagination(currentPage, totalPages);
  }

  /**
   * 创建金句元素
   * @param {Object} quote 金句对象
   * @returns {HTMLElement} 金句元素
   */
  createQuoteElement(quote) {
    const quoteItem = DOMUtils.createElement('div', {
      class: 'quote-item',
      'data-id': quote.id
    });
    
    // 金句文本
    const quoteText = DOMUtils.createElement('div', { class: 'quote-text' }, quote.text);
    quoteItem.appendChild(quoteText);
    
    // 金句元数据
    const quoteMeta = DOMUtils.createElement('div', { class: 'quote-meta' });
    
    // 来源和日期
    const sourceDate = DOMUtils.createElement('div', { class: 'source-date' });
    if (quote.source) {
      sourceDate.textContent = `来源: ${quote.source} · `;
    }
    sourceDate.textContent += DateUtils.formatDate(quote.date);
    quoteMeta.appendChild(sourceDate);
    
    // 标签
    if (quote.tags && quote.tags.length > 0) {
      const tagsElement = DOMUtils.createElement('div', { class: 'tags' });
      tagsElement.textContent = quote.tags.map(tag => `#${tag}`).join(' ');
      quoteMeta.appendChild(tagsElement);
    }
    
    quoteItem.appendChild(quoteMeta);
    
    // 操作按钮
    const actions = DOMUtils.createElement('div', { class: 'item-actions' });
    
    // 编辑按钮
    const editBtn = DOMUtils.createElement('button', { class: 'edit-btn' }, '编辑');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onEditQuote(quote);
    });
    actions.appendChild(editBtn);
    
    // 删除按钮
    const deleteBtn = DOMUtils.createElement('button', { class: 'delete-btn' }, '删除');
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('确定要删除这条金句吗？')) {
        const updatedData = await this.dataManager.deleteQuote(quote.id);
        this.renderQuotes(updatedData);
        this.renderTagsFilter(); // 重新渲染标签，因为可能有变化
      }
    });
    actions.appendChild(deleteBtn);
    
    quoteItem.appendChild(actions);
    
    return quoteItem;
  }

  /**
   * 更新分页控件
   * @param {number} currentPage 当前页码
   * @param {number} totalPages 总页数
   */
  updatePagination(currentPage, totalPages) {
    this.pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    this.prevPageBtn.disabled = currentPage <= 1;
    this.nextPageBtn.disabled = currentPage >= totalPages;
  }

  /**
   * 编辑金句的回调函数
   * @param {Object} quote 要编辑的金句
   */
  onEditQuote(quote) {
    // 这个方法将在主模块中被覆盖
    console.log('Edit quote:', quote);
  }
}

export default UIManager;