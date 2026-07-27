/**
 * Decap CMS GitHub OAuth 代理
 */
export default async function handler(req, res) {
  const { code, state } = req.query;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const baseHost = 'https://my-blog-a9ja.vercel.app';
  const redirectURI = `${baseHost}/callback`;

  // GitHub 回调：用 code 换 token
  if (code) {
    try {
      const tokenRes = await fetch(
        `https://github.com/login/oauth/access_token`,
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

      res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>
  try {
    window.opener.postMessage(
      JSON.stringify({ token: '${tokenData.access_token}', provider: 'github' }),
      '*'
    );
  } catch(e) {}
  window.close();
  setTimeout(function(){ document.body.innerHTML = '<p style="font-family:sans-serif;padding:2rem;">✅ 登录成功！窗口即将关闭...</p>'; }, 500);
</script></head><body></body></html>`);
    } catch (err) {
      res.status(200).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;">
        <h2>❌ 网络错误</h2><p>${err.message}</p></body></html>`);
    }
    return;
  }

  // 发起 GitHub 授权
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'repo,user',
    redirect_uri: redirectURI,
    state: state || '',
  });
  res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params}` });
  res.end();
}
