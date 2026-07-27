/**
 * Decap CMS GitHub OAuth 代理
 * 部署到 Vercel 后，将此 URL 填入 admin/config.yml 的 base_url
 */
export default async function handler(req, res) {
  const { code, state } = req.query;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  const redirectURI = process.env.OAUTH_REDIRECT_URL ||
    `https://${process.env.VERCEL_URL}/api/oauth`;

  // 第一步：GitHub 回调，用 code 换 token
  if (code) {
    try {
      const tokenRes = await fetch(
        `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${redirectURI}`,
        { method: 'POST', headers: { Accept: 'application/json' } }
      );
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        res.status(400).json({ error: tokenData.error_description || tokenData.error });
        return;
      }

      // 返回 token 给 Decap CMS（通过 postMessage）
      const html = `<!DOCTYPE html>
<html><head><script>
  window.opener.postMessage(
    { token: '${tokenData.access_token}', provider: 'github' },
    window.location.origin
  );
  window.close();
</script></head><body><p>登录成功，窗口即将关闭...</p></body></html>`;
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (err) {
      res.status(500).json({ error: 'Token exchange failed: ' + err.message });
    }
    return;
  }

  // 第二步：重定向到 GitHub 授权页面
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'repo,user',
    redirect_uri: redirectURI,
    state: state || '',
  });
  res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params}` });
  res.end();
}
