/**
 * 
 * function used to fill contacts drop down on edit and add job windows
 *  
 */
function fillContacts(cont){
	
	let t=document.createTextNode('add contact')
	let newOption=document.createElement("OPTION");
	
	const contactContent = document.getElementById('txtContacts')
	contactContent.innerHTML=""	
	
	if(typeof cont != undefined && typeof cont === 'object'){ 
		cont.sort((a, b) => (a.primary_contact > b.primary_contact) ? -1 : 1)
		newOption=document.createElement("OPTION");
		t=document.createTextNode('add contact')
		
        for(member in cont){
			let optGroup = document.createElement("optgroup")
			let optNewNumber = document.createElement("OPTION")
			let optNewEmail = document.createElement("OPTION")			
			let newNumber = document.createTextNode('+ add number')
			let txtAddEmail = document.createTextNode('+ add email')
			
			chosenFirstname = cont[member].first_name
			chosenLastname = cont[member].last_name
			let fn = (cont[member].first_name) ? cont[member].first_name : ""
			let ln = (cont[member].last_name) ? cont[member].last_name : ""

			if(cont[member].primary_contact == 1){				
				optGroup.setAttribute('label',`*${fn} ${ln}`)
			}else{
			optGroup.setAttribute('label',`${fn} ${ln}`)
			}

			if(cont[member].phonenumbers){
				optGroup.setAttribute('pncount',cont[member].phonenumbers.length)
			}

			if(cont[member].emails){
				optGroup.setAttribute('ecount', cont[member].emails.length)
			}

			optGroup.setAttribute('position', member)

			if(cont[member].contact_ID){	
				optGroup.setAttribute('contactID', Number(cont[member].contact_ID))				
			}

			 contactContent.appendChild(optGroup);
			 let dashOpt = document.createElement('option')					
			 let dash = document.createTextNode("Phone Numbers")
			 dashOpt.setAttribute("disabled","disabled")
			 dashOpt.setAttribute('class','cmHeader')
			 dashOpt.appendChild(dash)
			 optGroup.appendChild(dashOpt)
			 
			
            for(n in cont[member].phonenumbers){
				//create number element unless there is no number
				if(cont[member].phonenumbers[n].number !=null){
					let newOption=document.createElement("OPTION");				 	
					t = document.createTextNode(`${cont[member].phonenumbers[n].number}`)					
					newOption.setAttribute("position", Number(n)+1)
					newOption.setAttribute("id",`${cont[member].phonenumbers[n].phone_ID}` )
					newOption.appendChild(t)
					newOption.setAttribute("method","phone")				
					newOption.setAttribute('value', `${cont[member].phonenumbers[n].number}`)					
					optGroup.appendChild(newOption)	
				}

				if(n == cont[member].phonenumbers.length-1){
					optNewNumber.appendChild(newNumber)
					optGroup.appendChild(optNewNumber)
					optGroup.lastChild.style.color = 'blue'
					optGroup.lastChild.style.fontWeight = 'bold'
					optGroup.lastChild.style.fontSize = '.65em'
					
				}			
			}
			let eDashOpt = document.createElement('option')					
			let eDash = document.createTextNode("EMAIL")
			eDashOpt.setAttribute("disabled","disabled")
			eDashOpt.appendChild(eDash)
			optGroup.appendChild(eDashOpt)

						 
			for(n in cont[member].emails){

				//create email element unless there is no email
				if(cont[member].emails[n].email !=null){
					let newOption=document.createElement("OPTION");				 	
					t = document.createTextNode(`${cont[member].emails[n].email}`)
					newOption.appendChild(t)
					newOption.setAttribute("method","email")	
					newOption.setAttribute("id",`${cont[member].emails[n].email_ID}`)			
					newOption.setAttribute('value', `${fn} ${ln} ~ ${cont[member].emails[n].email}`)				
					optGroup.appendChild(newOption)	
				}			
		   }
			
			
			optNewEmail.appendChild(txtAddEmail)
			optGroup.appendChild(optNewEmail)
			optGroup.lastChild.style.color = 'blue'
			optGroup.lastChild.style.fontWeight = 'bold'
			optGroup.lastChild.style.fontSize = '.65em'		
              
		}
		newOption=document.createElement("OPTION");
		newOption.setAttribute("value","no contact");	
		
		let ac = document.createTextNode(`+ add new contact`)		
		newOption.appendChild(ac)
		contactContent.insertBefore(newOption,contactContent.firstChild)		
		contactContent.firstChild.style.fontWeight = 'bold'
		contactContent.firstChild.style.color = 'blue'
		
	}else{		
		//parameter passed into function was undefined or not an object so fill drop down with options 
        //when no contact exists. such as adding a contact or chosing "no contact"
		let blankOption = document.createElement('option')
		let b_o_text = document.createTextNode('--select option--')
        
		blankOption.appendChild(b_o_text)
		blankOption.disabled = true
		contactContent.appendChild(blankOption)

		let noOption = document.createElement('option')
		let n_o_text = document.createTextNode('no contact')
		noOption.appendChild(n_o_text)		
		contactContent.appendChild(noOption)
		
		let addOption = document.createElement('option')
		let a_o_text = document.createTextNode('+ add contact')
		addOption.appendChild(a_o_text)		
		contactContent.appendChild(addOption)
		

	}	
	$('#txtContacts').focus()
	
	$(contactContent).on('change',()=>{
		
		tellParent()
		
	}).off('change')
	$(contactContent).trigger('change')
}