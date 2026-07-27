@echo off
cd /d "C:\Users\13730\Desktop\my-blog"
echo ================================
echo    📚 璨泯小记 - 一键上传
echo ================================
echo.
echo 正在检查更新...
git add .
git commit -m "📝 更新内容 %date% %time%"
echo.
echo 正在上传到网站...
git push
echo.
echo ================================
echo    ✅ 上传完成！1-2分钟后网站更新
echo    https://wu666640.github.io/my-blog/
echo ================================
pause
