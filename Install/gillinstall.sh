clear
echo "------------------------------------"
echo " WELCOME TO DOLPHIN GILL INSTALLER "
echo "------------------------------------"
echo "Installing nodejs@16"
sudo apt update -y
curl -s https://deb.nodesource.com/setup_16.x | sudo bash
sudo apt install nodejs -y
echo "Installing qemu"
sudo apt-get update -y
sudo apt-get install qemu  -y
clear
node gillinstaller.js
cd ..
npm install
clear
echo ------------------------------------
echo The installation is complete, you can go to the main directory and run npm start
echo ------------------------------------
npm start
