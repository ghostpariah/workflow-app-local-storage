
const elect = require('electron')
const { remote } = require('electron')

const ipcUser = elect.ipcRenderer
const pathUser = require('path')
const urlUser = require('url')
let users

window.onload = () =>{
    users = ipcUser.sendSync('get-users','useradmin')
   
    fillSections(users)
}
$('selUser').on({
    change : ()=>{
        let user = ipcUser.sendSync('get-user')
    }
})

ipcUser.on('user-updated', (event,args)=>{
    
})


function fillSections(users){
    let arrChanges = new Array()
    let objEditedData = new Object()
    for(member in users){
        
        let wrapper = document.createElement('div')
        wrapper.setAttribute('class','userWrapper')
        wrapper.setAttribute('id',`userWrapper${member}`)

        let name = document.createElement('div')        
        let nameText = document.createTextNode(users[member].user_name)
        name.setAttribute('id',`name${users[member].user_ID}`)
        name.setAttribute('class','userNameDisplay')
        name.appendChild(nameText)

        let password = document.createElement('input')
        password.setAttribute('type', 'text')
        password.setAttribute('value', users[member].password)
        password.setAttribute('class','userDisplay')
        password.setAttribute('id',`pw${users[member].user_ID}`)
        password.addEventListener('change',(event)=>{
            let elementID = event.currentTarget.id
            let userID = elementID.substring(2)
            let exists = false
            let existingObjectIndex = 0
            
            if(arrChanges.length>0){
                
                for(i=0;i<arrChanges.length;i++){
                    if(arrChanges[i].id == userID){
                        //edit changeed item
                        
                        exists= true
                        existingObjectIndex = i
                        break;
                    } 
                }

            }else{
                let objChanges = new Object()
                    objChanges.id = userID
                    objChanges.password = event.currentTarget.value
                    arrChanges.push(objChanges)
                    exists = true
            }
            if(!exists){
                    
                    let objChanges = new Object()
                    objChanges.id = userID
                    objChanges.password = event.currentTarget.value
                    arrChanges.push(objChanges)
            }else{
                if(arrChanges[existingObjectIndex].password != users)
                arrChanges[existingObjectIndex].password = event.currentTarget.value
            }
                
            
            
        
        })

        let userRole = document.createElement('select')
        userRole.setAttribute('class','dropRole')
        userRole.setAttribute('id',`dr${users[member].user_ID}`)
        userRole.addEventListener('change', (event)=>{
            let elementID = event.currentTarget.id
            let userID = elementID.substring(2)
            let exists = false
            let existingObjectIndex = 0
            
            if(arrChanges.length>0){
                
                for(i=0;i<arrChanges.length;i++){
                    if(arrChanges[i].id == userID){
                        //edit changeed item
                        
                        exists= true
                        existingObjectIndex = i
                        break;
                    } 
                }

            }else{
                let objChanges = new Object()
                    objChanges.id = userID
                    objChanges.role = event.currentTarget.value
                    arrChanges.push(objChanges)
                    exists = true
            }
            if(!exists){
                    
                    let objChanges = new Object()
                    objChanges.id = userID
                    objChanges.role = event.currentTarget.value
                    arrChanges.push(objChanges)
            }else{
                arrChanges[existingObjectIndex].role = event.currentTarget.value
            }
                
               
            
           
        
        })

        let roleOption1 =document.createElement('option')
        let textOption1 = document.createTextNode('admin')
        roleOption1.appendChild(textOption1)

        let roleOption2 =document.createElement('option')
        let textOption2 = document.createTextNode('user')
        roleOption2.appendChild(textOption2)


        let activeUser = document.createElement('input')
        activeUser.setAttribute('type','checkbox')
        activeUser.setAttribute('class','checkbox');
        activeUser.setAttribute('id',`cb${users[member].user_ID}`)
        activeUser.addEventListener('change',(event)=>{
            let elementID = event.currentTarget.id
            let userID = elementID.substring(2)
            let exists = false
            let existingObjectIndex = 0
            
            if(arrChanges.length>0){
                
                for(i=0;i<arrChanges.length;i++){
                    if(arrChanges[i].id == userID){
                        
                        
                        exists= true
                        existingObjectIndex = i
                        break;
                    } 
                }

            }else{
                let objChanges = new Object()
                    objChanges.id = userID
                    objChanges.active = event.currentTarget.checked
                    arrChanges.push(objChanges)
                    exists = true
            }
            if(!exists){
                    
                    let objChanges = new Object()
                    objChanges.id = userID
                    objChanges.active = event.currentTarget.checked
                    arrChanges.push(objChanges)
            }else{
                
                arrChanges[existingObjectIndex].active = event.currentTarget.checked;
                
            }    
                
            
            
        })
       
        

        wrapper.appendChild(name)
        wrapper.appendChild(password)
        wrapper.appendChild(userRole)
        wrapper.appendChild(activeUser)

        
        document.getElementById('userWrapper').appendChild(wrapper)
        

        if(users[member].active == '1' || users[member].active == 'true') document.getElementById(`cb${users[member].user_ID}`).checked = true
        document.getElementById(`dr${users[member].user_ID}`).appendChild(roleOption1)
        document.getElementById(`dr${users[member].user_ID}`).appendChild(roleOption2)

        if(users[member].role == 'admin') {
            document.getElementById(`dr${users[member].user_ID}`).selectedIndex = 0
        }else{
            document.getElementById(`dr${users[member].user_ID}`).selectedIndex = 1
        }
        

    }
    let submitButton = document.createElement('input')
        submitButton.setAttribute('class','-user-submit-edit')
        submitButton.setAttribute('type','button')
        submitButton.setAttribute('value','submit')
        submitButton.addEventListener('click', event =>{
           
            for(i=0;i<arrChanges.length;i++){
                ipcUser.send('edit-users',arrChanges[i])
            }
        })
        document.getElementById('userWrapper').appendChild(submitButton)
}
function changeHappened(newData, changedItem){
    
    let change 
    for(member in users){
        //convert booleans
        newData.active = (newData.active == false) ? 0:1
        
            
            if(users[member].user_ID == newData.id){
                switch(changedItem){
                    case 'active':
                        
                        if(users[member].active == newData.active){
                            return 0
                        }else{
                            return 1
                        }
                        
                    break;
                    default:
                        break;
            
                }
                
            }else{
                console.log('no match')
            }
        
        
    }
    

}
function displaySection(args){
    
    let buttons = document.getElementsByClassName('buttons')
    const optionStatus = args.getAttribute('class').search('unchosen')
    

    for(i=1;i<buttons.length+1;i++){
        document.getElementById('option'+i).setAttribute('class','buttons unchosen')
        document.getElementById('wrapper'+i).style.display = 'none'
        
    }

    const chosenOption = args.id.substring(6);
    

    (optionStatus<0) ? args.setAttribute('class','buttons unchosen') : args.setAttribute('class', 'buttons chosen');
  

    if(args){
        document.getElementById(`wrapper${chosenOption}`).style.display = 'block'
    }
}
function deleteUser(args){
    let selected = $('#selDeleteUser :selected');
    let id=(selected.attr('id').substr(2))
    users = ipcUser.sendSync('delete-user', id)	
    fillSections(users)
}


function createUser(){
    
    let userData = new Object()
    let unEl = document.getElementById('user').value;
    let pwEl = document.getElementById('password').value;
    let urEl = document.getElementById('role')
    let ma = document.getElementById('-message-area')
    ma.innerHTML=""
    
    let userExists = false
    userExists = ipcUser.sendSync('check-for-user',unEl)
    
    
    if (unEl == ""){
        ma.innerHTML = ma.innerHTML.concat ("\n Please enter username!<br/>")
    }else{
        if(userExists){
           ma.innerHTML = ma.innerHTML.concat("\n Username already exists!<br/>")
        }else{
        userData.user_name = unEl.toLowerCase()
        }
    }
    if (pwEl == ""){
        ma.innerHTML = ma.innerHTML.concat ("\n Please enter password!<br/>")
    }else{
        userData.password = pwEl.toLowerCase()
    }
     (urEl.options[urEl.selectedIndex].text) ? (userData.role = urEl.options[urEl.selectedIndex].text) : (ma.innerHTML = ma.innerHTML.concat("\n Please select role!<br/>"))
  
    
    if(ma.innerHTML==""){
        
        document.getElementById('userWrapper').innerHTML =""
        document.getElementById('frmNewUser').reset()
        fillSections(ipcUser.sendSync('create-user', userData))
        
       
    }

    
}
