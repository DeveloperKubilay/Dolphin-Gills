title Dolphin Gill Installer
echo off
cls
echo ------------------------------------
echo  WELCOME TO DOLPHIN GILL INSTALLER
echo ------------------------------------
set /p winlater="If you are using Windows 10 or Windows Server 2019 or Later, do you have to install nodejs and qemu automatically? Y/N: "
set /p nodejsinstall="Do you want to download normally (If you said yes, you don't need to say it again.) Y/N: "

if "%winlater%" == "y" (
winget install --id=OpenJS.NodeJS.LTS  -e
winget install --id=SoftwareFreedomConservancy.QEMU  -e
) else if "%winlater%" == "Y" (
winget install --id=OpenJS.NodeJS.LTS  -e
winget install --id=SoftwareFreedomConservancy.QEMU  -e
) else if "%winlater%" == "Yes" (
winget install --id=OpenJS.NodeJS.LTS  -e
winget install --id=SoftwareFreedomConservancy.QEMU  -e
) else if "%winlater%" == "yes" (
winget install --id=OpenJS.NodeJS.LTS  -e
winget install --id=SoftwareFreedomConservancy.QEMU  -e
) else if "%nodejsinstall%" == "y" (
start https://nodejs.org/en/download/
start https://www.qemu.org/download/#windows
echo After installing please press a button
pause
) else if "%nodejsinstall%" == "Y" (
start https://nodejs.org/en/download/
start https://www.qemu.org/download/#windows
echo After installing please press a button
pause
) else if "%nodejsinstall%" == "yes" (
start https://nodejs.org/en/download/
start https://www.qemu.org/download/#windows
echo After installing please press a button
pause
) else if "%nodejsinstall%" == "Yes" (
start https://nodejs.org/en/download/
start https://www.qemu.org/download/#windows
echo After installing please press a button
pause
)

cls
node gillinstaller.js
cd ..
npm install && cls && npm start
