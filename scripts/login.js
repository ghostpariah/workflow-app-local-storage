//const electronLogin = require('electron')
//const { remote } = require('remote')
//const ipc = remote.ipcRenderer
//const pathLogin = require('path')
//const urlLogin = require('url')
let userID

setTimeout(()=>{
    $('#user').trigger('click')
   },2000)

setTimeout(()=>{
   $('#user').keypress(function(e){
    if((e.keyCode ? e.keyCode : e.which) == 13){
        $("#password").focus()
      
    }
    });
},2000);

setTimeout(()=>{
    $('#password').keypress(function(e){
     if((e.keyCode ? e.keyCode : e.which) == 13){
         $("#loginSubmit").click()
        
     }
     });
 },2000);
        let matchedUsername = false
        let matchedPassword = false
        function focusUsername(){
           setTimeout(()=>{
            $('#user').trigger('click')
           },2000) 
        }
    function login(){
        let unEl = document.getElementById('user').value;
        let pwEl = document.getElementById('password').value;
        let ma = document.getElementById('-message-area')
        
       
        if (unEl == ""){
            ma.innerHTML = ma.innerHTML.concat ("\n Please enter username!<br/>")
        }else{
            verifyUsername(unEl)
        }
        
}
        function verifyUsername(args1){
            const electron1  = require('electron')
            const ipc = electron1.ipcRenderer
            
            let unSucc = false
            let ma = document.getElementById('-message-area')
            ma.innerHTML=""
            
            let users = ipc.sendSync('get-users', 'login')
            
            userID =''          
                
                for(let member in users){
                    
                    if(users[member].user_name == args1){ 
                        userID = users[member].user_id 
                                        
                        matchedUsername = true
                        if(!matchedPassword) {verifyPassword(users[member])}
                        break;   
                                        
                    }else{
                        matchedUsername = false
                    }
                }
               if (matchedUsername == false) {ma.innerHTML= ma.innerHTML.concat("Invalid username!</br>")}
            
                
               
            if(matchedUsername && matchedPassword){ma.innerHTML=""}
        } 
        function verifyPassword(args){
            const electron1  = require('electron')
            const ipc = electron1.ipcRenderer
            let enteredPW =document.getElementById('password').value
            let unSucc = false
            let ma = document.getElementById('-message-area')
            ma.innerHTML=""
            
            let users = ipc.sendSync('get-users', 'login')
               
                
            if(matchedUsername){               
                    
                    if(args.password == enteredPW){                   
                        matchedPassword = true
                        
                        
                        ipc.send('login-success', args) 
                       

                    }
                
            }
                
                if (!matchedPassword) {ma.innerHTML=ma.innerHTML+ "Invalid password!<br/>"} 
            
            if(matchedUsername && matchedPassword){ma.innerHTML=""}
        }        
    