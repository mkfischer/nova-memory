@echo off
echo Pushing Nova Memory to GitHub...
echo.

REM Remove any existing remote
git remote remove origin 2>nul

REM Add the GitHub remote
git remote add origin https://github.com/jagdeepsinghdev/nova-memory.git

REM Push with force to override history
echo Please enter your GitHub username when prompted
echo Use your Personal Access Token as the password
echo.
git push -u origin main --force

echo.
echo Done! Check https://github.com/jagdeepsinghdev/nova-memory
pause