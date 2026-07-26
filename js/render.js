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
    const coverHTML = post.cover
      ? `<div class="post-card-cover"><img src="${post.cover}" alt="${post.title}" loading="lazy"></div>`
      : '';

    const tagLinks = post.tags.map(t =>
      `<a href="#/tag/${encodeURIComponent(t)}" class="tag" onclick="event.stopPropagation()">${t}</a>`
    ).join('');

    return `
      <article class="post-card" onclick="Router.navigate('#/post/${post.id}')">
        ${coverHTML}
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

  /* ========== 关于我（动态数据）========== */
  about() {
    const d = (typeof ABOUT_DATA !== 'undefined') ? ABOUT_DATA : {
      name: '静轩',
      avatar: '',
      tagline: '一个喜欢写字、写代码、冲咖啡的人',
      bio: '',
      skills: [],
      social: []
    };

    const avatarHTML = d.avatar
      ? `<img src="${d.avatar}" alt="${d.name}" class="about-avatar-img" style="width:120px;height:120px;border-radius:50%;object-fit:cover;">`
      : '<div class="about-avatar">✍️</div>';

    const skillsHTML = d.skills && d.skills.length > 0
      ? `<div class="skills-section">
           <h2>技术栈</h2>
           ${d.skills.map(s => `
             <div class="skill-item">
               <div class="skill-label"><span>${s.name}</span><span>${s.level}%</span></div>
               <div class="skill-bar"><div class="skill-bar-fill" style="width:${s.level}%"></div></div>
             </div>`).join('')}
         </div>`
      : '';

    const socialHTML = d.social && d.social.length > 0
      ? `<div class="social-links">
           ${d.social.map(s => `<a href="${s.url}" target="_blank" class="social-link">${s.icon} ${s.label}</a>`).join('')}
         </div>`
      : '';

    return `
      <div class="about-page">
        ${avatarHTML}
        <h1>${d.name}</h1>
        <p class="about-tagline">${d.tagline}</p>
        <div class="about-bio">${d.bio}</div>
        ${skillsHTML}
        ${socialHTML}
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
