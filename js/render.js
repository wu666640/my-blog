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
      name: '璨泯',
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

  /* ========== 画廊 ========== */
  gallery(items, activeCategory) {
    const categories = getGalleryCategories();

    const catHTML = `
      <a href="#/gallery" class="tag ${!activeCategory ? 'active' : ''}">全部</a>
      ${categories.map(c =>
        `<a href="#/gallery/${encodeURIComponent(c.name)}"
            class="tag ${activeCategory === c.name ? 'active' : ''}">${c.name} (${c.count})</a>`
      ).join('')}`;

    const itemsHTML = items.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">🖼️</div>
           <p>暂无图片</p>
         </div>`
      : items.map(item => this._galleryCard(item)).join('');

    return `
      <div class="gallery-page">
        <h2 class="section-title">🖼️ 画廊</h2>
        <div class="gallery-categories">${catHTML}</div>
        <div class="gallery-list">${itemsHTML}</div>
      </div>`;
  },

  /** 画廊卡片 HTML */
  _galleryCard(item) {
    const imageHTML = item.image
      ? `<div class="gallery-card-image">
           <img src="${item.image}" alt="${item.title}" loading="lazy">
         </div>`
      : '<div class="gallery-card-image gallery-card-placeholder">🖼️</div>';

    return `
      <article class="gallery-card">
        ${imageHTML}
        <div class="gallery-card-body">
          <h3 class="gallery-card-title">${item.title}</h3>
          <div class="gallery-card-meta">${item.date} · ${item.category}</div>
          <div class="gallery-card-desc">${item.description}</div>
        </div>
      </article>`;
  },

  /* ========== 音乐 ========== */
  music(tracks, activeCategory) {
    const categories = getMusicCategories();

    const catHTML = `
      <a href="#/music" class="tag ${!activeCategory ? 'active' : ''}">全部</a>
      ${categories.map(c =>
        `<a href="#/music/${encodeURIComponent(c.name)}"
            class="tag ${activeCategory === c.name ? 'active' : ''}">${c.name} (${c.count})</a>`
      ).join('')}`;

    const tracksHTML = tracks.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">🎵</div>
           <p>暂无歌曲</p>
         </div>`
      : tracks.map(track => this._musicCard(track)).join('');

    return `
      <div class="music-page">
        <h2 class="section-title">🎵 音乐推荐</h2>
        <div class="music-categories">${catHTML}</div>
        <div class="music-list">${tracksHTML}</div>
      </div>`;
  },

  /** 音乐卡片 HTML */
  _musicCard(track) {
    const playUrl = track.neteaseUrl || (track.neteaseId ? `https://music.163.com/song?id=${track.neteaseId}` : '#');
    const hasLocalFile = track.file && track.file.trim() !== '';

    let playerHTML;
    if (hasLocalFile) {
      // 本地上传 MP3 → 完整播放
      playerHTML = `<div class="music-card-player music-local">
           <div class="music-audio-cover">🎵</div>
           <audio controls preload="metadata" src="${track.file}"></audio>
         </div>`;
    } else if (track.neteaseId) {
      // 网易云官方 iframe 播放器
      playerHTML = `<div class="music-card-player">
           <iframe frameborder="no" border="0" marginwidth="0" marginheight="0"
                   width="330" height="86"
                   src="//music.163.com/outchain/player?type=2&id=${track.neteaseId}&auto=0&height=66">
           </iframe>
         </div>`;
    } else {
      playerHTML = '<div class="music-card-player music-card-placeholder">🎵</div>';
    }

    return `
      <article class="music-card">
        ${playerHTML}
        <div class="music-card-body">
          <h3 class="music-card-title">${track.title}</h3>
          <div class="music-card-artist">🎤 ${track.artist}</div>
          <div class="music-card-meta">${track.date} · ${track.category}</div>
          <div class="music-card-desc">${track.description}</div>
          <a href="${playUrl}" target="_blank" class="music-netease-btn">
            🎧 在网易云音乐中打开
          </a>
        </div>
      </article>`;
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
