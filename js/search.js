/**
 * 搜索模块
 * 提供防抖搜索功能
 */
const Search = {
  /** 防抖延迟（毫秒） */
  DELAY: 300,

  _timer: null,

  /**
   * 高亮搜索词
   * @param {string} text - 原始文本
   * @param {string} query - 搜索词
   * @returns {string} 带高亮标记的 HTML
   */
  highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  /**
   * 绑定搜索输入框事件
   */
  bind() {
    // 使用事件委托，因为输入框是动态渲染的
    document.addEventListener('input', (e) => {
      if (e.target.id === 'search-input') {
        this._onInput(e.target.value);
      }
    });
  },

  _onInput(value) {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      const q = value.trim();
      if (q) {
        Router.navigate(`#/search?q=${encodeURIComponent(q)}`);
      } else {
        Router.navigate('#/');
      }
    }, this.DELAY);
  }
};
