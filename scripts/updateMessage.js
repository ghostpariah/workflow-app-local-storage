const electron = require('electron')
const ipcUpdate = electron.ipcRenderer

//updater doesnt work in dev environment so starting app by default just for dev.
ipcUpdate.send('start-app')


ipcUpdate.on('updater', (event , args)=>{
    
   
    document.getElementById('message').innerHTML = args    
    
    if(args == 'Update not available.'|| args.includes('error')){
        ipcUpdate.send('no-updates')
    }

    
})
ipcUpdate.on('new-database',(event,args)=>{
    console.log('new-database triggered')
    let createDatabase = confirm('Database not found. Is this a new installation?')
    if(createDatabase){
        console.log('creating database')
        ipcUpdate.send('create-new-database')
        ipcUpdate.send('start-app')
    }else{
        let restoreDatabase = confirm('Would you like to restore from last backup file?')
        if(restoreDatabase){
            console.log('restoring databse')
            ipcUpdate.send('restore-database')
            ipcUpdate.send('start-app')
        }else{
            //ipcUpdate.send()
        }
    }
})
