/**
 * 网页金句收藏 - 内容脚本
 * 负责在网页中实现选中文本后收藏金句的功能
 */

// 当前页面信息
let pageInfo = {
  url: window.location.href,
  title: document.title
};

// 选中文本的相关变量
let selectedText = '';

/**
 * 初始化内容脚本
 */
function init() {
  // 监听文本选择事件
  document.addEventListener('mouseup', handleTextSelection);
  
  // 监听键盘快捷键
  document.addEventListener('keydown', handleKeyboardShortcut);
  
  // 监听来自后台的消息
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // 创建浮动操作按钮的样式
  createFloatingButtonStyle();
}

/**
 * 处理文本选择事件
 * @param {MouseEvent} event - 鼠标事件
 */
function handleTextSelection(event) {
  // 获取选中的文本
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  // 如果有选中文本，显示浮动按钮
  if (selectedText) {
    showFloatingButton(event.clientX, event.clientY);
  } else {
    hideFloatingButton();
  }
}

/**
 * 处理键盘快捷键
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyboardShortcut(event) {
  // 检查是否按下了Ctrl+Shift+S (Windows) 或 Command+Shift+S (Mac)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? event.metaKey : event.ctrlKey;
  
  if (modifierKey && event.shiftKey && event.key === 'S') {
    event.preventDefault();
    
    // 获取当前选中的文本
    const selection = window.getSelection();
    selectedText = selection.toString().trim();
    
    if (selectedText) {
      saveQuote(selectedText);
    }
  }
}

/**
 * 处理来自后台的消息
 * @param {Object} message - 消息对象
 * @param {Object} sender - 发送者信息
 * @param {Function} sendResponse - 回复函数
 * @returns {boolean} - 是否需要异步回复
 */
function handleMessage(message, sender, sendResponse) {
  if (message.action === 'saveSelectedText') {
    const selection = window.getSelection();
    selectedText = selection.toString().trim();
    
    if (selectedText) {
      saveQuote(selectedText);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: '没有选中文本' });
    }
  }
  
  return true; // 保持消息通道开放，用于异步回复
}

/**
 * 保存金句
 * @param {string} text - 金句文本
 */
function saveQuote(text) {
  // 准备金句数据
  const quoteData = {
    text: text,
    source: pageInfo.title,
    sourceUrl: pageInfo.url,
    createdAt: Date.now()
  };
  
  // 发送消息给后台服务
  chrome.runtime.sendMessage({
    action: 'saveQuote',
    data: quoteData
  }, response => {
    if (response && response.success) {
      // 显示保存成功的提示
      showSavedNotification();
    } else {
      console.error('保存金句失败:', response ? response.error : '未知错误');
    }
  });
}

/**
 * 创建浮动按钮的样式
 */
function createFloatingButtonStyle() {
  const style = document.createElement('style');
  style.textContent = `
    .quote-collector-floating-btn {
      position: fixed;
      background-color: #4F46E5;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 14px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    }
    
    .quote-collector-floating-btn:hover {
      background-color: #7C3AED;
      transform: translateY(-2px);
    }
    
    .quote-collector-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #10B981;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(-20px);
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    }
    
    .quote-collector-notification.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

/**
 * 显示浮动按钮
 * @param {number} x - 鼠标X坐标
 * @param {number} y - 鼠标Y坐标
 */
function showFloatingButton(x, y) {
  // 移除已有的按钮
  hideFloatingButton();
  
  // 创建新按钮
  const button = document.createElement('button');
  button.className = 'quote-collector-floating-btn';
  button.textContent = '收藏金句';
  button.id = 'quote-collector-btn';
  
  // 计算按钮位置，确保在视口内
  const buttonWidth = 80; // 估计宽度
  const buttonHeight = 32; // 估计高度
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  
  // 调整位置，避免超出视口
  let posX = x + scrollX;
  let posY = y + scrollY + 10; // 在选中文本下方10px处
  
  if (posX + buttonWidth > window.innerWidth + scrollX) {
    posX = window.innerWidth + scrollX - buttonWidth - 10;
  }
  
  button.style.left = `${posX}px`;
  button.style.top = `${posY}px`;
  
  // 添加点击事件
  button.addEventListener('click', () => {
    saveQuote(selectedText);
    hideFloatingButton();
  });
  
  // 添加到页面
  document.body.appendChild(button);
  
  // 点击页面其他区域时隐藏按钮
  setTimeout(() => {
    document.addEventListener('click', hideFloatingButtonOnClick);
  }, 10);
}

/**
 * 隐藏浮动按钮
 */
function hideFloatingButton() {
  const button = document.getElementById('quote-collector-btn');
  if (button) {
    button.remove();
  }
  document.removeEventListener('click', hideFloatingButtonOnClick);
}

/**
 * 点击页面时隐藏浮动按钮的处理函数
 * @param {MouseEvent} event - 鼠标事件
 */
function hideFloatingButtonOnClick(event) {
  const button = document.getElementById('quote-collector-btn');
  if (button && !button.contains(event.target)) {
    hideFloatingButton();
  }
}

/**
 * 显示保存成功的通知
 */
function showSavedNotification() {
  // 移除已有的通知
  const existingNotification = document.querySelector('.quote-collector-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // 创建新通知
  const notification = document.createElement('div');
  notification.className = 'quote-collector-notification';
  notification.textContent = '金句已成功收藏！';
  document.body.appendChild(notification);
  
  // 显示通知
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // 3秒后隐藏通知
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// 初始化内容脚本
init();