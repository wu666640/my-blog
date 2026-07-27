/**
 * Giscus 评论系统 — 动态加载模块
 * 每个内容页面独立加载，使用 data-mapping="specific" + data-term 区分
 *
 * term 格式:
 *   post-{id}     — 文章
 *   gallery-{id}  — 画廊
 *   video-{id}    — 视频
 *   music-{id}    — 音乐
 *   novel-{novelId}-{chapterId} — 小说章节
 */
const Giscus = {
  _currentTerm: null,

  /** 配置信息 */
  _config: {
    repo: 'wu666640/my-blog',
    repoId: 'R_kgDOTkGSMw',
    category: 'General',
    categoryId: 'DIC_kwDOTkGSM84DCFeM',
  },

  /**
   * 加载指定 term 的 Giscus 评论区
   * @param {string} term — 唯一标识，如 "post-my-article"
   */
  load(term) {
    // 同一个 term 不重复加载
    if (this._currentTerm === term) return;
    this._currentTerm = term;

    const container = this._getContainer();
    if (!container) return;

    // 清空旧内容（iframe + script）
    container.innerHTML = '';

    // 插入加载占位
    container.innerHTML = '<p class="giscus-loading">💬 加载评论中…</p>';

    // 创建 script 标签
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', this._config.repo);
    script.setAttribute('data-repo-id', this._config.repoId);
    script.setAttribute('data-category', this._config.category);
    script.setAttribute('data-category-id', this._config.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', term);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    script.setAttribute('data-lang', 'zh-CN');
    script.crossOrigin = 'anonymous';

    // 加载完成后移除占位文字
    script.addEventListener('load', () => {
      const loading = container.querySelector('.giscus-loading');
      if (loading) loading.remove();

      // 添加管理链接
      this._addAdminLink(container);
    });

    // 加载失败
    script.addEventListener('error', () => {
      container.innerHTML = '<p class="giscus-error">⚠️ 评论加载失败，请刷新页面重试</p>';
    });

    container.appendChild(script);
  },

  /**
   * 添加"管理评论"链接（指向 GitHub Discussions）
   */
  _addAdminLink(container) {
    // 避免重复添加
    if (container.querySelector('.giscus-admin-link')) return;

    const link = document.createElement('a');
    link.className = 'giscus-admin-link';
    link.href = `https://github.com/${this._config.repo}/discussions/categories/general`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = '🔧 管理评论（置顶 / 删除）';
    link.title = '在 GitHub Discussions 中管理评论：可置顶、删除、锁定';
    container.appendChild(link);
  },

  /**
   * 获取或创建 giscus 容器
   */
  _getContainer() {
    let container = document.querySelector('.giscus');
    if (!container) {
      // 如果页面上没有 .giscus 容器，尝试在当前挂载内容中查找
      const app = document.getElementById('app');
      if (app) {
        container = app.querySelector('.giscus');
      }
    }
    return container;
  },

  /**
   * 移除当前 Giscus（页面切换时调用）
   */
  unload() {
    this._currentTerm = null;
    const container = this._getContainer();
    if (container) {
      container.innerHTML = '';
    }
  }
};
