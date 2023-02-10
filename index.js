const { exec,spawn } = require('node:child_process')
axios = require('axios')
fs = require('fs')
kill = require('tree-kill')
setTimeoutp  = require('timers/promises').setTimeout;
pidusage = require('pidusage')
try{fs.readdirSync("./servers")}catch{fs.mkdirSync("./servers")}
process.title = "Dolphin Gill"
const settings = require('./settings.json')
ngrok = require('ngrok');
io = require('socket.io-client')
socket = io("ws://"+settings.serverurl,{auth:{token: settings.servertoken,type:"gills",version:settings.version}});
var pids = [],ngroks = [],totaldisksize = 0

async function createserver(id,os,ports,disks,ram,cpu,ngrok,tryl){try{
 var controllered,start=settings.runbackground+" -smp "+cpu+" -m "+ram+" ";
await setserver(id,"delete",true)
try {await fs.mkdirSync("./servers/"+id)} catch{}
var controller = new AbortController(),downloadeddisks = 0;
  await disks.map(async (x)=>{
   if(x.type === "create") {
    downloadeddisks++;
     if(x.forcetype) { start += "-drive file="+x.name+",format="+x.forcetype+" " } else {start += "-hda "+x.name+" "}
     await new Promise((resolve) => exec("qemu-img create "+x.name+" "+x.size+"M",{cwd:'./servers/'+id},()=>resolve()))
   }
   if(x.type === "download") {
     if(x.forcetype) {start += "-drive file="+x.name+",format="+x.forcetype+" "}
     else if(x.name.split(".")[1] === "iso") {start += "-cdrom "+x.name+" "} 
     else { start += "-hda "+x.name+" "}
     var timeprocess = 0,lastprocess = -1;
      function fa(yuzde) {var i = 0,output,text ="[";
      while ( i < yuzde/2) {text += "-";i += 1}
      text += "]"
      output = {text:text,process:yuzde,time:Math.floor(((100-yuzde)*(Date.now()-timeprocess))/1000)}
      timeprocess = Date.now(),lastprocess = yuzde
      return output
      }
    await axios({url: x.url,signal: controller.signal,responseType: "stream", onDownloadProgress: (progressEvent) => {
      if(x.main) {
      var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      if(lastprocess != percentCompleted) { 
        lastprocess === percentCompleted
        socket.emit("servers",{machine:id,code:fa(percentCompleted),installing:true})
      }}}}).then((response)=>{
     var file = fs.createWriteStream("./servers/"+id+"/"+x.name)
     response.data.pipe(file)
     file.on("finish", async () => {
      downloadeddisks++;
         if(x.resize) { 
         await new Promise((resolve) => exec("qemu-img resize "+x.name+" "+x.resize+"M",{cwd:'./servers/'+id},()=>resolve()))
        }
         if(downloadeddisks === disks.length) {await setserver(id,"start")}
         file.close();
     })}).catch(()=>{
      controller.abort()
    if(!controllered) {if(tryl < settings.overdownloadtry) {controllered = true;setTimeout(()=>createserver(id,os,ports,disks,ram,cpu,ngrok,tryl+1),5000)
    } else { controllered = true;socket.emit("servers",{machine:id,err:true,code:"The disc could not be downloaded"}) }
   }})
  }
  })
 if(ports.vnc) start += "-vnc :"+ports.vnc+" "
 if(os === "windows") start += settings["windowsgraphic"]+" "+settings["network-adapter"]+" "
 var port ="";
 if(ports.mainport && ports.mainport.split(":").length > 1) ports.mainport = ports.mainport.split(":")[0]
 if(os === "windows") port += settings.network+" user,hostfwd=tcp::"+ports.mainport+"-:3389"
 if(os === "linux") port += settings.network+" user,hostfwd=tcp::"+ports.mainport+"-:22"
 if(!os && ports.port) port += settings.network+" user"
if(ports.port){ports.port.map((x)=> port += ",hostfwd=tcp::"+x.panelport+"-:"+x.port)}
 start += port
 await fs.writeFileSync("./servers/"+id+"/start.txt",start)
 if(ngrok){
  if(!ports.mainport && ports.vnc) {
    await fs.writeFileSync("./servers/"+id+"/ngrok.txt",ngrok+" "+(5900+Number(ports.vnc)))
  }if(ports.mainport) {
    await fs.writeFileSync("./servers/"+id+"/ngrok.txt",ngrok+" "+(5900+Number(ports.mainport)))
  }
 }
}catch (e){console.log(e);socket.emit("servers",{machine:id,err:true,code:"ERORR"});}}

async function startngrok(id) {try{
 var ngrokdata = fs.readFileSync("./servers/"+id+"/ngrok.txt").toString().split(" ")
 url = await ngrok.connect({proto: 'tcp', addr: ngrokdata[1],authtoken:ngrokdata[0]});
 ngroks.push({machine:id,url:url.replace("tcp://","")})
}catch {}}

function statusupdate(id){
  let stoped = 0,ngrok = "";if(pids.filter(z=>z.machine === id).length) {
  setInterval(function(){try{
    if(stoped === settings.overstatustry) {setserver(id,"shutdown")}
    if(stoped > settings.overstatustry) return;
    if(!pids.filter(z=>z.machine === id).length ||
    !require('is-running')(pids.filter(z=>z.machine === id)[0].pid)) return stoped++;
    var running = require('is-running')(pids.filter(z=>z.machine === id)[0].pid)
    var storage = []
    fs.readdirSync("./servers/"+id).map((c)=>{if(c === "start.txt") return;
    if(c === "ngrok.txt" && ngroks.filter(z=>z.machine === id).length) {
     return ngrok = ngroks.filter(z=>z.machine === id)[0].url
    } else {try {storage.push({name:c,size:(fs.statSync("./servers/"+id+"/"+c).size)/1024})}catch{}}
  })
    pidusage(pids.filter(z=>z.machine === id)[0].pid, function (e, status) {
    socket.emit("servers",{ 
      machine: id,
      status:status,info:{
      storage:storage,
      running:running,
      ngrok: ngrok
    }})
  })
  }catch (e){console.error(e);}},settings.statusupdate)
}}

async function setserver(id,type,code){
  if(type === "start") {
    if(pids.filter(z=>z.machine === id).length) return;
   await setTimeoutp(settings.starttimeout);try{
   let start = JSON.parse('["'+fs.readFileSync("./servers/"+id+"/start.txt").toString().split(' ').join('","')+'"]').filter(z=>String(z))
   let machine = spawn(settings.qemu,start,{cwd:'./servers/'+id})
   socket.emit("servers",{machine:id,running:true,pid:machine.pid})
   pids.push({machine:id,pid:machine.pid})
   statusupdate(id)
   startngrok(id)
   }catch (e){console.log(e);socket.emit("servers",{machine:id,err:true,code:"ERORR"});}
  }if (type === "reset") {
    await setserver(id,"shutdown")
    await setserver(id,"start")
  }if(type === "shutdown") {if(pids.filter(z=>z.machine === id).length) {
      await kill(pids.filter(z=>z.machine === id)[0].pid,'SIGKILL')
      socket.emit("servers",{machine:id,notrunning:true})
      pids = pids.filter(z=>z.machine != id)
      if(ngroks.filter(z=>z.machine === id).length) {
        await ngrok.disconnect("tcp://"+ngroks.filter(z=>z.machine === id)[0].url)
        ngroks = ngroks.filter(z=>z.machine != id)
      }
      await setTimeoutp(settings.starttimeout)
  }}if(type === "delete") {
    try {fs.readdirSync("./servers/"+id)}catch{ return;}
    await setserver(id,"shutdown")
    try { await fs.readdirSync("./servers/" + id).map(async (z) => await fs.unlinkSync("./servers/" + id + "/" + z))}  catch { }
    try { await fs.rmdirSync("./servers/" + id)}  catch { }
    if(!code) socket.emit("servers",{machine:id,deletedserver:true})
    await setTimeoutp(settings.starttimeout)
  }
}

async function editserver(id,code,disks){
await setserver(id,"shutdown")
try{
 if(id != code.id){//renameFolder
  await setserver(code.id,"delete")
  await new Promise((resolve) => fs.rename('./servers/'+id, './servers/'+code.id, () => resolve()))
  id = code.id
 }
 try{fs.readdirSync("./servers/"+id)}catch{return;}
 var start = settings.runbackground+" -smp "+code.cpu+" -m "+code.ram+" ";

 async function downloadnewdisk(id,x,tryl){
  var controller = new AbortController(),controllered = false
await axios({url: x.url,signal: controller.signal,responseType: "stream"}).then((response)=>{
 var file = fs.createWriteStream("./servers/"+id+"/"+x.name)
 response.data.pipe(file)
 file.on("finish", async () => {if(x.resize) {
 await new Promise((resolve) => exec("qemu-img resize "+x.name+" "+x.resize+"M",{cwd:'./servers/'+id},()=>resolve()))}})})
 .catch(()=>{
  controller.abort()
  if(!controllered) {if(tryl < settings.overdownloadtry) {controllered = true;setTimeout(()=>downloadnewdisk(id,x,tryl+1),5000)
  } else { controllered = true;socket.emit("servers",{machine:id,err:true,code:"The disc could not be downloaded"})}}
 })
}
 if(disks){await disks.map(async (x)=>{
  if(x.deletedisk) {try{await fs.unlinkSync('./servers/'+id+"/"+x.deletedisk)}catch{}}
  if(x.newdisk && x.code.type === "create") 
   await new Promise((resolve) => exec("qemu-img create "+x.code.name+" "+x.code.size+"M",{cwd:'./servers/'+id},()=>resolve()))
  if(x.newdisk && x.code.type === "download") await downloadnewdisk(id,x.code,0)
  if(x.editdisk){
    if(x.code.oldname){try{await fs.renameSync('./servers/'+id+"/"+x.code.oldname, './servers/'+id+"/"+x.editdisk)}catch{}} 
    if(x.code.type === "create")
     await new Promise((resolve) => exec("qemu-img create "+x.editdisk+" "+x.code.size+"M",{cwd:'./servers/'+id},()=>resolve()))
    if(x.code.type === "download") await downloadnewdisk(id,x.code,0)
    else if(x.code.resize && x.code.resize != "deleted"){
     await new Promise((resolve) => exec("qemu-img resize "+x.editdiske+" "+x.code.resize+"M",{cwd:'./servers/'+id},()=>resolve()))}
  }
 })}
 code.disks.map((x)=>{
    if(x.forcetype) {start += "-drive file="+x.name+",format="+x.forcetype+" "}
    else if(x.name && x.name.split(".")[1] === "iso") {start += "-cdrom "+x.name+" "} 
    else { start += "-hda "+x.name+" "}
 })
 if(code.ports.vnc) start += "-vnc :"+code.ports.vnc+" "
 if(code.os === "windows") start += settings["windowsgraphic"]+" "+settings["network-adapter"]+" "
 var port ="";
 if(code.ports.mainport && code.ports.mainport.split(":").length > 1) code.ports.mainport = code.ports.mainport.split(":")[0]
 if(code.os === "windows") port += settings.network+" user,hostfwd=tcp::"+code.ports.mainport+"-:3389"
 if(code.os === "linux") port += settings.network+" user,hostfwd=tcp::"+code.ports.mainport+"-:22"
 if(!code.os && code.ports.port) port += settings.network+" user"
 if(code.ports.port){code.ports.port.map((x)=> port += ",hostfwd=tcp::"+x.panelport+"-:"+x.port)}
 start += port
 await fs.writeFileSync("./servers/"+id+"/start.txt",start)
 if(code.ngrok){//Ngrok
  if(!code.ports.mainport && code.ports.vnc) {
   await fs.writeFileSync("./servers/"+id+"/ngrok.txt",code.ngrok+" "+(5900+Number(code.ports.vnc)))
  }if(code.ports.mainport) {
   await fs.writeFileSync("./servers/"+id+"/ngrok.txt",code.ngrok+" "+(5900+Number(code.ports.mainport)))
  }}else {try{await fs.unlinkSync("./servers/"+id+"/ngrok.txt")}catch{}}
await setserver(id,"start")
}catch (e){console.log(e);socket.emit("servers",{machine:code && code.id || id,err:true,code:"ERORR"});}
}

fs.readdirSync("./servers").map((x)=>{
  if(!x)return;
  setserver(x,"start")
})
setInterval(async ()=>{
totaldisksize = 0;
  await fs.readdirSync("./servers").map(async (y)=>{await fs.readdirSync("./servers/"+y).map(async (x)=>{
    totaldisksize = totaldisksize+fs.statSync("./servers/"+y+"/"+x).size
  })})
  if(totaldisksize){socket.emit("servers",{totaldisksize:Math.round((totaldisksize/1024)/1024)})
  }else{socket.emit("servers",{totaldisksize:"0"})}
},settings.diskupdate)

socket.on('client', function(msg){
  if(msg.type === 'create-server'){createserver(msg.code.id,msg.code.os,msg.code.ports,msg.code.disks,msg.code.ram,msg.code.cpu,msg.code.ngrok,0)}
  if(msg.type === 'set-server'){setserver(msg.code.id,msg.code.type)}
  if(msg.type === 'edit-server'){editserver(msg.id,msg.code,msg.disks)}
})
socket.on('connect',()=>console.log("Connected the panel!"))
socket.on("connect_error", (err) => console.log(`Unable to connect to server error code:${err.message}`));
