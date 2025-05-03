/**
 * 网页金句收藏 - 模态框管理模块
 * 处理各种模态框的显示和隐藏
 */

class ModalManager {
  constructor() {
    // 金句模态框元素
    this.quoteModal = document.getElementById('quote-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.quoteText = document.getElementById('quote-text');
    this.quoteSource = document.getElementById('quote-source');
    this.quoteTags = document.getElementById('quote-tags');
    this.quoteNotes = document.getElementById('quote-notes');
    this.saveQuoteBtn = document.getElementById('save-quote-btn');
    
    // 数据模态框元素
    this.dataModal = document.getElementById('data-modal');
    this.dataModalTitle = document.getElementById('data-modal-title');
    this.exportOptions = document.getElementById('export-options');
    this.importOptions = document.getElementById('import-options');
    
    // 初始化关闭按钮事件
    this.initCloseButtons();
  }

  /**
   * 初始化关闭按钮事件
   */
  initCloseButtons() {
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        this.hideModal(modal.id);
      });
    });
  }

  /**
   * 显示模态框
   * @param {string} modalId 模态框ID
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
  }

  /**
   * 隐藏模态框
   * @param {string} modalId 模态框ID
   */
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
  }

  /**
   * 打开添加金句模态框
   */
  openAddQuoteModal() {
    this.modalTitle.textContent = '添加金句';
    this.quoteText.value = '';
    this.quoteSource.value = '';
    this.quoteTags.value = '';
    this.quoteNotes.value = '';
    
    this.showModal('quote-modal');
    return null; // 返回null表示是新增
  }

  /**
   * 打开编辑金句模态框
   * @param {Object} quote 要编辑的金句
   */
  openEditQuoteModal(quote) {
    this.modalTitle.textContent = '编辑金句';
    this.quoteText.value = quote.text || '';
    this.quoteSource.value = quote.source || '';
    this.quoteTags.value = quote.tags ? quote.tags.join(', ') : '';
    this.quoteNotes.value = quote.notes || '';
    
    this.showModal('quote-modal');
    return quote.id; // 返回要编辑的金句ID
  }

  /**
   * 获取金句表单数据
   * @returns {Object} 金句数据
   */
  getQuoteFormData() {
    const text = this.quoteText.value.trim();
    if (!text) {
      alert('请输入金句内容');
      return null;
    }
    
    const tags = this.quoteTags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
    
    return {
      text,
      source: this.quoteSource.value.trim(),
      tags,
      notes: this.quoteNotes.value.trim()
    };
  }

  /**
   * 打开导出数据模态框
   */
  openExportModal() {
    this.dataModalTitle.textContent = '导出数据';
    this.exportOptions.style.display = 'block';
    this.importOptions.style.display = 'none';
    this.showModal('data-modal');
  }

  /**
   * 打开导入数据模态框
   */
  openImportModal() {
    this.dataModalTitle.textContent = '导入数据';
    this.exportOptions.style.display = 'none';
    this.importOptions.style.display = 'block';
    this.showModal('data-modal');
  }
}

export default ModalManager;