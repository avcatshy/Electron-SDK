cd %WORKSPACE%\Electron-SDK
dir
call npm -v
call node -v
call npm config list
del /f/q/s node_modules
call npm cache clean --force
call npm install --verbose
call npm run switch:arch -- --arch=x64
call npm run sync:lib -- --liburl_win=%RTC_SDK_URL% --arch=x64
call npm run build:electron -- --electron_version=%ELECTRON_VERSION% --msvs_version=2017 --arch=x64
call npm run build:ts
7z a electron.zip build js
