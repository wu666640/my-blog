/**
 * 应用入口
 * 初始化主题、路由，注册各页面的渲染逻辑
 */
(function () {
  'use strict';

  // ===== 初始化主题 =====
  Theme.init();

  // ===== 主题切换按钮 =====
  document.getElementById('theme-toggle').addEventListener('click', () => {
    Theme.toggle();
  });

  // ===== 注册路由处理 =====
  Router
    .on('home', () => {
      const posts = getAllPosts();
      Render.mount(Render.home(posts, null));
    })
    .on('tag', (params) => {
      const posts = getPostsByTag(params.tag);
      const title = posts.length > 0 ? params.tag : '标签';
      Render.mount(Render.home(posts, params.tag));
    })
    .on('post', (params) => {
      const post = getPostById(params.id);
      if (!post) {
        Render.mount(Render.notFound());
        return;
      }
      const allPosts = getAllPosts();
      const idx = allPosts.findIndex(p => p.id === post.id);
      const prevPost = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;
      const nextPost = idx > 0 ? allPosts[idx - 1] : null;
      Render.mount(Render.post(post, prevPost, nextPost));
    })
    .on('search', (params) => {
      const posts = searchPosts(params.q);
      Render.mount(Render.home(posts, null, `🔍 搜索结果："${params.q}"（${posts.length} 篇）`));

      // 高亮搜索结果
      if (params.q) {
        setTimeout(() => {
          document.querySelectorAll('.post-card-title, .post-card-excerpt').forEach(el => {
            el.innerHTML = Search.highlight(el.textContent, params.q);
          });
        }, 0);
      }
    })
    .on('about', () => {
      Render.mount(Render.about());
    })
    .on('gallery', (params) => {
      const items = params.category
        ? getGalleryByCategory(params.category)
        : getAllGalleryItems();
      Render.mount(Render.gallery(items, params.category || null));
    })
    .on('music', (params) => {
      const tracks = params.category
        ? getMusicByCategory(params.category)
        : getAllMusicTracks();
      Render.mount(Render.music(tracks, params.category || null));
      // 初始化自定义音频播放器
      setTimeout(() => Render.setupMusicPlayers(), 0);
    })
    .on('video', (params) => {
      const items = params.category
        ? getVideosByCategory(params.category)
        : getAllVideos();
      Render.mount(Render.video(items, params.category || null));
      // 初始化视频播放器
      setTimeout(() => Render.setupVideoPlayers(), 0);
    })
    .on('novel-list', () => {
      const novels = getAllNovels();
      Render.mount(Render.novelList(novels));
    })
    .on('novel', (params) => {
      const novel = getNovelById(params.id);
      if (!novel) { Render.mount(Render.notFound()); return; }
      Render.mount(Render.novelDetail(novel));
      setTimeout(() => Render.setupNovelPage(), 0);
    })
    .on('novel-chapter', (params) => {
      const result = getNovelChapter(params.id, params.chapterId);
      if (!result) { Render.mount(Render.notFound()); return; }
      Render.mount(Render.novelChapter(
        result.novel, result.chapter, result.prev, result.next, result.allChapters
      ));
      setTimeout(() => Render.setupNovelPage(), 0);
    })
    .on('404', () => {
      Render.mount(Render.notFound());
    });

  // ===== 绑定搜索 =====
  Search.bind();

  // ===== 启动路由 =====
  Router.init();

  // ===== 点击页面标题回到顶部（点击 logo 刷新首页）=====
  document.querySelector('.site-logo').addEventListener('click', (e) => {
    if (location.hash === '#/' || location.hash === '' || location.hash === '#') {
      e.preventDefault();
      Router.init(); // 重新渲染首页
    }
  });

})();
