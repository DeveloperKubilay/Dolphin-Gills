clear
echo "------------------------------------"
echo " WELCOME TO DOLPHIN GILL INSTALLER "
echo "------------------------------------"
echo "Do you want to install nodejs? Y/N"
read nodejsinstall
if [ "$nodejsinstall" == "yes" ] || [ "$nodejsinstall" == "Y" ] || [ "$nodejsinstall" == "y" ] || [ "$nodejsinstall" == "Yes" ]; then
echo "Installing nodejs@16"
sudo apt update -y
curl -s https://deb.nodesource.com/setup_16.x | sudo bash
sudo apt install nodejs -y
fi
echo "Do you want to install qemu? Y/N"
read qemuinstall
if [ "$qemuinstall" == "yes" ] || [ "$qemuinstall" == "Y" ] || [ "$qemuinstall" == "y" ] || [ "$qemuinstall" == "Yes" ]; then
echo "Which one do you want to download qemu or aqemu? qemu/aqemu (recommended qemu)"
read qemutype
if [ "$qemutype" == "aqemu" ]; then
echo "Installing aqemu"
sudo apt-get update -y
sudo apt-get install aqemu  -y
else
echo "Installing qemu"
sudo apt-get update -y
sudo apt-get install qemu  -y
fi
fi
clear
node gillinstaller.js
cd ..
npm install
clear
echo ------------------------------------
echo The installation is complete, you can go to the main directory and run npm start
echo ------------------------------------
cd ..
npm start