/**
 * 网页金句收藏 - 后台服务
 * 实现右键菜单、消息处理和数据存储等功能
 */

// 存储相关常量
const STORAGE_KEY = 'web_quotes';

/**
 * 初始化扩展
 */
function init() {
  // 创建右键菜单
  createContextMenu();
  
  // 监听消息
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // 监听快捷键
  chrome.commands.onCommand.addListener(handleCommand);
  
  console.log('网页金句收藏扩展已初始化');
}

/**
 * 创建右键菜单
 */
function createContextMenu() {
  chrome.contextMenus.create({
    id: 'save-quote',
    title: '收藏金句',
    contexts: ['selection'], // 只在选中文本时显示
  });
  
  // 监听右键菜单点击事件
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'save-quote' && info.selectionText) {
      // 获取选中的文本
      const selectedText = info.selectionText.trim();
      
      if (selectedText) {
        // 获取页面信息
        const pageInfo = {
          title: tab.title,
          url: tab.url
        };
        
        // 保存金句
        saveQuote({
          text: selectedText,
          source: pageInfo.title,
          sourceUrl: pageInfo.url,
          createdAt: Date.now()
        });
      }
    }
  });
}

/**
 * 处理命令（快捷键）
 * @param {string} command - 命令名称
 */
function handleCommand(command) {
  if (command === 'save-quote') {
    // 获取当前活动标签页
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        // 向内容脚本发送消息，请求保存选中的文本
        chrome.tabs.sendMessage(tabs[0].id, { action: 'saveSelectedText' });
      }
    });
  }
}

/**
 * 处理来自内容脚本或弹出窗口的消息
 * @param {Object} message - 消息对象
 * @param {Object} sender - 发送者信息
 * @param {Function} sendResponse - 回复函数
 * @returns {boolean} - 是否需要异步回复
 */
function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'saveQuote':
      // 保存金句
      saveQuote(message.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 保持消息通道开放，用于异步回复
      
    case 'getQuotes':
      // 获取所有金句
      getAllQuotes()
        .then(quotes => sendResponse({ success: true, data: quotes }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'deleteQuote':
      // 删除金句
      deleteQuote(message.id)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'updateQuote':
      // 更新金句
      updateQuote(message.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
  
  return false;
}

/**
 * 保存金句
 * @param {Object} quoteData - 金句数据
 * @returns {Promise<Object>} - 操作结果
 */
async function saveQuote(quoteData) {
  try {
    // 获取现有金句
    const quotes = await getAllQuotes();
    
    // 创建新金句对象
    const newQuote = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      text: quoteData.text,
      source: quoteData.source || '',
      sourceUrl: quoteData.sourceUrl || '',
      tags: quoteData.tags || [],
      notes: quoteData.notes || '',
      createdAt: quoteData.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    
    // 添加到数组开头（最新的在前面）
    quotes.unshift(newQuote);
    
    // 保存到存储
    await chrome.storage.local.set({ [STORAGE_KEY]: quotes });
    
    // 发送通知
    showNotification('金句已收藏', newQuote.text.substring(0, 50) + (newQuote.text.length > 50 ? '...' : ''));
    
    return { success: true, data: newQuote };
  } catch (error) {
    console.error('保存金句失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 获取所有金句
 * @returns {Promise<Array>} - 金句数组
 */
async function getAllQuotes() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

/**
 * 删除金句
 * @param {string} id - 金句ID
 * @returns {Promise<Object>} - 操作结果
 */
async function deleteQuote(id) {
  try {
    // 获取现有金句
    const quotes = await getAllQuotes();
    
    // 过滤掉要删除的金句
    const updatedQuotes = quotes.filter(quote => quote.id !== id);
    
    // 保存到存储
    await chrome.storage.local.set({ [STORAGE_KEY]: updatedQuotes });
    
    return { success: true };
  } catch (error) {
    console.error('删除金句失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 更新金句
 * @param {Object} updatedQuote - 更新后的金句对象
 * @returns {Promise<Object>} - 操作结果
 */
async function updateQuote(updatedQuote) {
  try {
    // 获取现有金句
    const quotes = await getAllQuotes();
    
    // 查找要更新的金句索引
    const index = quotes.findIndex(quote => quote.id === updatedQuote.id);
    
    if (index === -1) {
      throw new Error('找不到要更新的金句');
    }
    
    // 更新金句
    quotes[index] = {
      ...quotes[index],
      ...updatedQuote,
      updatedAt: Date.now()
    };
    
    // 保存到存储
    await chrome.storage.local.set({ [STORAGE_KEY]: quotes });
    
    return { success: true, data: quotes[index] };
  } catch (error) {
    console.error('更新金句失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 显示通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 */
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title: title,
    message: message
  });
}

// 初始化扩展
init();