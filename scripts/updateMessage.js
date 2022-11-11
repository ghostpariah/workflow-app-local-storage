//const electron = require('electron')
//const ipc = electron.ipcRenderer
const mb = document.querySelector('#message')

//updater doesnt work in dev environment so starting app by default just for dev.
//ipc.send('start-app')


ipc.on('updater', (event , args, args2)=>{
    if(!args2){
        mb.innerHTML = args
    }else{
        createProgressIndicator()
        document.querySelector('.circle-progress').setAttribute('data-percentage', `${args2}%`)
        document.querySelector('.circle-progress').style.background = `conic-gradient(
            #5e81ad ${args2*3.6}deg,
            white ${args2*3.6}deg
        )`;
    }
    
    if(args.includes('error')){

    } 
   
    if(args == 'Update not available.'){
      
        setTimeout(() => {
            ipc.send('start-app')
           
        }, 3000);
    }
    if(args == 'Update available.'){
       
    }
    if(args == 'Update downloaded'){
        
        setTimeout(() => {
            ipc.send('install-updates')
           
        }, 3000);
    }

    
})

ipc.on('no-mapped-drive', (event,args)=>{
    document.querySelector("#message").innerHTML ="v: drive must be mapped to continue"
    let btn = document.createElement('button')
    btn.setAttribute('value','OK')
    btn.setAttribute('type','button')
    let text = document.createTextNode('OK')
    btn.appendChild(text)
    btn.addEventListener('click', ()=>{
        ipc.send('quit')
    })
    document.querySelector("#message").appendChild(btn)
    
})
ipc.on('new-database',(event,args)=>{
    console.log('new-database triggered')
    let createDatabase = confirm('Database not found. Is this a new installation?')
    if(createDatabase){
        console.log('creating database')
        ipc.send('create-new-database')
        ipc.send('start-app')
    }else{
        let restoreDatabase = confirm('Would you like to restore from last backup file?')
        if(restoreDatabase){
            console.log('restoring databse')
            ipc.send('restore-database')
            ipc.send('start-app')
        }else{
            //ipc.send()
        }
    }
})

function createProgressIndicator(){
    mb.innerHTML=""
    let circleProg = document.createElement('div')
    circleProg.setAttribute('class','circle-progress')
    circleProg.setAttribute('data-percentage', '0%')

    let circleVal = document.createElement('div')
    circleVal.setAttribute('class','circle-value')

    circleProg.appendChild(circleVal)
    mb.appendChild(circleProg)
}