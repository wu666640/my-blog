/**
 * 渲染模块
 * 负责将数据渲染为 DOM，插入到 #app 容器
 */
const Render = {
  app: null,

  /** 获取 #app 容器 */
  getApp() {
    if (!this.app) {
      this.app = document.getElementById('app');
    }
    return this.app;
  },

  /** 清空并渲染内容 */
  mount(html) {
    const el = this.getApp();
    el.innerHTML = html;
  },

  /* ========== 首页 ========== */
  home(posts, activeTag, titleOverride) {
    const tags = getAllTags();

    const postsHTML = posts.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">📭</div>
           <p>暂无文章</p>
         </div>`
      : posts.map(p => this._postCard(p)).join('');

    const title = titleOverride
      || (activeTag ? `标签：${activeTag}（${posts.length} 篇）` : '最新文章');

    return `
      <div class="home-layout">
        <section class="posts-section">
          <h2 class="section-title">${title}</h2>
          <div class="posts-list">${postsHTML}</div>
        </section>
        <aside class="sidebar">
          <div class="sidebar-widget">
            <h3>🔍 搜索</h3>
            <input type="text" class="search-box" id="search-input" placeholder="搜索文章..." autocomplete="off">
          </div>
          <div class="sidebar-widget">
            <h3>🏷️ 标签</h3>
            <div class="tag-cloud">
              <a href="#/" class="tag ${!activeTag ? 'active' : ''}">全部</a>
              ${tags.map(t => `<a href="#/tag/${encodeURIComponent(t.name)}" class="tag ${activeTag === t.name ? 'active' : ''}">${t.name} (${t.count})</a>`).join('')}
            </div>
          </div>
        </aside>
      </div>`;
  },

  /** 文章卡片 HTML */
  _postCard(post) {
    const tagLinks = post.tags.map(t =>
      `<a href="#/tag/${encodeURIComponent(t)}" class="tag" onclick="event.stopPropagation()">${t}</a>`
    ).join('');

    return `
      <article class="post-card" onclick="Router.navigate('#/post/${post.id}')">
        <h3 class="post-card-title">${post.title}</h3>
        <div class="post-card-meta">
          <span class="post-card-date">${post.date}</span>
        </div>
        <p class="post-card-excerpt">${post.excerpt}</p>
        <div class="post-card-tags">${tagLinks}</div>
      </article>`;
  },

  /* ========== 文章详情 ========== */
  post(post, prevPost, nextPost) {
    const tagsHTML = post.tags.map(t =>
      `<a href="#/tag/${encodeURIComponent(t)}" class="tag">${t}</a>`
    ).join('');

    return `
      <article class="post-detail">
        <a href="#/" class="back-link">← 返回首页</a>
        <header class="post-detail-header">
          <h1>${post.title}</h1>
          <div class="post-detail-meta">
            <span>📅 ${post.date}</span>
          </div>
          <div class="post-detail-tags">${tagsHTML}</div>
        </header>
        <div class="post-detail-body">${post.content}</div>
        <nav class="post-nav">
          <span>${prevPost ? `<a href="#/post/${prevPost.id}">← ${prevPost.title}</a>` : ''}</span>
          <span>${nextPost ? `<a href="#/post/${nextPost.id}">${nextPost.title} →</a>` : ''}</span>
        </nav>
      </article>`;
  },

  /* ========== 关于我 ========== */
  about() {
    return `
      <div class="about-page">
        <div class="about-avatar">✍️</div>
        <h1>关于我</h1>
        <p class="about-tagline">一个喜欢写字、写代码、冲咖啡的人</p>
        <div class="about-bio">
          <p>你好，欢迎来到我的博客。</p>
          <p>我叫静轩，是一名全栈开发者，也是一个文字爱好者。工作之余，我喜欢写博客、阅读、冲手冲咖啡，偶尔散步拍照。</p>
          <p>这个博客是我的一方小天地——记录技术心得、生活感悟，还有一些乱七八糟的随笔。不求多少人看，只求自己写得开心。</p>
          <p>如果你偶然路过，觉得某篇文章有点意思，那便是缘分了。</p>
        </div>
        <div class="skills-section">
          <h2>技术栈</h2>
          <div class="skill-item">
            <div class="skill-label"><span>JavaScript / TypeScript</span><span>90%</span></div>
            <div class="skill-bar"><div class="skill-bar-fill" style="width:90%"></div></div>
          </div>
          <div class="skill-item">
            <div class="skill-label"><span>React / Vue</span><span>85%</span></div>
            <div class="skill-bar"><div class="skill-bar-fill" style="width:85%"></div></div>
          </div>
          <div class="skill-item">
            <div class="skill-label"><span>Node.js / Express</span><span>80%</span></div>
            <div class="skill-bar"><div class="skill-bar-fill" style="width:80%"></div></div>
          </div>
          <div class="skill-item">
            <div class="skill-label"><span>CSS / 设计</span><span>75%</span></div>
            <div class="skill-bar"><div class="skill-bar-fill" style="width:75%"></div></div>
          </div>
        </div>
        <div class="social-links">
          <a href="https://github.com" target="_blank" class="social-link">🐙 GitHub</a>
          <a href="mailto:hello@example.com" class="social-link">📧 Email</a>
          <a href="#" class="social-link">🐦 Twitter</a>
        </div>
      </div>`;
  },

  /* ========== 404 ========== */
  notFound() {
    return `
      <div class="not-found">
        <h2>404</h2>
        <p>哎呀，这个页面不存在呢~</p>
        <a href="#/" class="back-home">返回首页</a>
      </div>`;
  }
};
