@echo off
cd /d "C:\Users\JAMES\OneDrive\Desktop\live artifact 1"
if exist ".git\index.lock" (
  echo --- removing stale lock ---
  del /f /q ".git\index.lock"
)
echo --- git add ---
git add .
echo --- git commit ---
git commit -m "update"
echo --- git push ---
git push
echo.
echo === DONE. Press any key to close ===
pause
