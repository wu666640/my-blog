/**
 * Decap CMS GitHub OAuth 代理
 */
module.exports = async function handler(req, res) {
  const { code, state } = req.query;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const baseHost = 'https://my-blog-a9ja.vercel.app';
  const redirectURI = `${baseHost}/callback`;

  // GitHub 回调：用 code 换 token
  if (code) {
    try {
      const tokenRes = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectURI,
          }),
        }
      );
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        res.status(200).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;">
          <h2>❌ 登录失败</h2>
          <p>${tokenData.error}: ${tokenData.error_description || ''}</p>
          <p>请截图并联系管理员</p>
          </body></html>`);
        return;
      }

      // Decap CMS 3.x 期望的消息格式: "authorization:<provider>:success:<json>"
      // 且要求 r.origin === base_url，postMessage 时 origin 匹配才会处理
      const authMessage = 'authorization:github:success:' + JSON.stringify({
        token: tokenData.access_token,
        provider: 'github',
      });
      res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>
  try {
    window.opener.postMessage('${authMessage.replace(/'/g, "\\'")}', '*');
  } catch(e) {}
  window.close();
  setTimeout(function(){ document.body.innerHTML = '<p style="font-family:sans-serif;padding:2rem;">✅ 登录成功！窗口即将关闭...<br><small>如未自动跳转请刷新页面</small></p>'; }, 800);
</script></head><body></body></html>`);
    } catch (err) {
      res.status(200).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;">
        <h2>❌ 网络错误</h2><p>${err.message}</p></body></html>`);
    }
    return;
  }

  // ============================================================
  // 第一步：握手 — 发送 "authorizing:github" 给 CMS
  // Decap CMS 的 handshakeCallback 收到后才会注册 authorizeCallback
  // 之前用服务端 302 重定向，JavaScript 没机会执行，握手从未发生！
  // ============================================================
  const authURL = `https://github.com/login/oauth/authorize?${new URLSearchParams({
    client_id: clientId,
    scope: 'repo,user',
    redirect_uri: redirectURI,
  })}`;
  res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>
  // ① 发送握手消息，触发 CMS 注册 authorizeCallback
  try {
    window.opener.postMessage('authorizing:github', '*');
  } catch(e) {}
  // ② 稍等片刻确保 CMS 收到握手，然后跳转 GitHub 授权
  setTimeout(function() {
    window.location.href = '${authURL}';
  }, 200);
</script></head><body></body></html>`);
};
