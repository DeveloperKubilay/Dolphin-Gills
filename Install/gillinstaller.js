const version = require("../package.json").version
const fs = require('fs');
var Readline = require('readline')
var json = {
"version":version,
"starttimeout":4000,
"overdownloadtry":5,
"network-adapter":"-net nic,model=e1000",
"qemu":"qemu-system-x86_64",
"runbackground":"-nographic",
"ip":"",
"windowsgraphic":"-vga vmware",
"network":"-nic",
"overstatustry":1,
}
process.title = "Dolphin Gill Installer"

async function question(q,s){var temp = "",qn = false;
readline = Readline.createInterface({input: process.stdin,output: process.stdout});
await new Promise((r)=>{ readline.question(q, async c => {
        if(s === true && !c) qn = true
        else if(typeof s === "number" && isNaN(c)) temp = s
        else if(!c) {temp = s}
        else {temp = c}
        readline.close();
        r()
    });})
if(qn) return install()
return temp
}

install();async function install(){
console.clear()
json.serverurl = await question("Enter the server url example localhost:8080:","localhost:8080")
json.servertoken = await question("Enter server token:",true)
json.statusupdate = await question("How long will the reflection time on the panel be recommended(7000):",7000)
json.diskupdate = await question("How much will it be to update the disk in the panel recommended(30000):",30000)
console.log("If you want to the questions now, write directly otherwise enter and pass")
var network = await question("Do you want to change the command to connect to the network:",false)
if(network) json["network-adapter"] = network
var networkp = await question("Do you want to change the network command used to open the port:",false)
if(networkp) json.network = networkp
var qemu = await question("Do you want to change the qemu startup command:",false)
if(qemu) json.qemu = qemu
var background = await question("Do you want to change the command to run in the background:",false)
if(background) json.runbackground = background
var graphic = await question("Do you want to change the graphic command of Windows:",false)
if(graphic) json.windowsgraphic = graphic
var ip = await question("Do you want to change the ip adress:",false)
if(ip) json.ip = ip
fs.writeFileSync("../settings.json",JSON.stringify(json, undefined, 2))
}
