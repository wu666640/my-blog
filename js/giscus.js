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
  _observer: null,

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

    // 断开之前的 MutationObserver
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }

    // 清空旧内容并显示加载占位
    container.innerHTML = '<p class="giscus-loading">💬 加载评论中…</p>';

    // 创建 Giscus script 标签
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

    // 使用 MutationObserver 等待 Giscus 渲染完成后再添加管理链接
    // Giscus 异步加载（先拉 GitHub API 再渲染 iframe），
    // script.onload 触发时 iframe 尚未出现，直接 appendChild 的链接会被清除
    this._observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.tagName === 'IFRAME' || (node.querySelector && node.querySelector('iframe'))) {
            // Giscus iframe 已插入，移除加载占位文字
            const loading = container.querySelector('.giscus-loading');
            if (loading) loading.remove();

            // 添加管理链接
            this._addAdminLink(container);

            // 完成，断开观察器
            this._observer.disconnect();
            this._observer = null;
            return;
          }
        }
      }
    });
    this._observer.observe(container, { childList: true, subtree: true });

    // 加载失败处理
    script.addEventListener('error', () => {
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
      container.innerHTML = '<p class="giscus-error">⚠️ 评论加载失败，请刷新页面重试</p>';
    });

    container.appendChild(script);
  },

  /**
   * 同步 Giscus 主题（亮色 ↔ 暗色切换时调用）
   * @param {'light' | 'dark'} theme
   */
  updateTheme(theme) {
    // Giscus iframe 标准 class 为 .giscus-frame，回退任意 iframe
    const iframe = document.querySelector('.giscus-frame')
      || document.querySelector('.giscus iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme } } },
        'https://giscus.app'
      );
    }
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
   * 获取 giscus 容器
   */
  _getContainer() {
    return document.querySelector('.giscus');
  },

  /**
   * 移除当前 Giscus（页面切换时由 Render.mount() 调用）
   */
  unload() {
    this._currentTerm = null;
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    const container = this._getContainer();
    if (container) {
      container.innerHTML = '';
    }
  }
};
