/**
 * 主题切换模块
 * 管理亮色/暗色模式，偏好存储到 localStorage
 */
const Theme = {
  KEY: 'blog-theme',

  /** 获取当前主题 */
  get() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },

  /** 设置主题 */
  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.KEY, theme);
  },

  /** 切换主题 */
  toggle() {
    const next = this.get() === 'light' ? 'dark' : 'light';
    this.set(next);
    return next;
  },

  /** 从 localStorage 恢复主题偏好 */
  init() {
    const saved = localStorage.getItem(this.KEY);
    if (saved) {
      this.set(saved);
    } else {
      // 跟随系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.set(prefersDark ? 'dark' : 'light');
    }
  }
};
