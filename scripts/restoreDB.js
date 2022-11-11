//const electron = require('electron')
//const ipc = electron.ipcRenderer

let allBackups

window.onload = ()=>{
    allBackups = ipc.sendSync('get-backups')
    console.log(allBackups)
    createButtons()
}

function restoreDB(rp){
    
    //alert(rp)
    let restorePoint = rp
    ipc.send('restore-database',restorePoint)
    
}

function createButtons(){
    let container = document.getElementById('backups')
    
    for(i in allBackups){
        console.log(allBackups[i].fileName)

        let button = document.createElement('div')
        button.setAttribute('id', allBackups[i].fileName)
        button.setAttribute('class', 'backupButton')
        button.addEventListener('click',(event)=>{
            let confirmed = confirm(`Any data added after the chosen restore point will be gone.
Are you sure you would like to roll back to the restore point?`)
            if(confirmed) restoreDB(button.id)
        })
        let buttonText = document.createTextNode(`${allBackups[i].stats.mtime} File Size: ${allBackups[i].stats.size}`)
        button.appendChild(buttonText)
        container.appendChild(button)

    }

}