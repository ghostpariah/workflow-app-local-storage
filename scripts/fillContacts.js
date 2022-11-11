/**
 * 
 * function used to fill contacts drop down on edit and add job windows
 *  
 */


function fillContactsNew(props){//contacts,cust_ID,cusName,launcher
	//object for passing properties to 'open-contacts' in main
	console.log(props)
	let contacts
	let cust_ID
	let cusName
	let launcher
	if(props){
		contacts = props.contacts
		cust_ID = props.customer_ID
		cusName = props.customer_name
		launcher = props.launcher
	}
	let objContactProps = {}

	let selectBox = document.getElementById('Contacts-input')
	let arrow = document.getElementById('Contacts-button').firstChild
	let optionsBox = document.getElementById('Contacts-listBox')
	let displayedName = document.getElementById('Contacts-info')
	let choice = document.getElementById('Contacts-choice')
	let button = document.getElementById('Contacts-button')

	optionsBox.innerHTML = ''
    displayedName.innerHTML = ''
    choice.innerHTML = ''
    state = 'closed'
    

	
    
    //create optionGroup at the top and create option with "add new contact" (no header needed)
    let addNewContactOptionGroup = document.createElement('div')
    addNewContactOptionGroup.setAttribute('class', 'optionGroup')
    addNewContactOptionGroup.setAttribute('id','optionGroup0')
    let addNewContactOption = document.createElement('div')
    addNewContactOption.setAttribute('class','option addNewOption')
    addNewContactOption.setAttribute('id','addNewContact')
	addNewContactOption.setAttribute('tabindex','-1')
	addNewContactOption.setAttribute('data-cid',`${cust_ID}`)
	$(addNewContactOption).on({
		keydown: (event)=>{
			console.log('hello')
			
			switch(event.key){
				case 'ArrowDown': 
				case 'ArrowUp':
					console.log('arrowdown on add new contact')
					navigateListBox(event, optionsBox, filteredList)
					break;
				case 'Enter':
					console.log(event.target)
					if(contacts){
						objContactProps.contacts = contacts
						console.log('there are contacts')
						objContactProps.isNew = false
						objContactProps.customer_ID = contacts[0].customer_ID
						
					}else{
						if(addNewContactOption.getAttribute('data-cid') == 'undefined'){
							console.log('is new company')
							objContactProps.isNew = true
							//TODO: add new company to database
							let decoded = removeSpecialCharacters(document.getElementById('Customer-choice').innerText.trim())
							objContactProps.customer_ID = addNewCompany(decoded)
							ipc.send('pass-new-customer-to-main-window', objContactProps.customer_ID)
							document.getElementById('Customer-choice').setAttribute('data-cid',objContactProps.customer_ID)
						}else{
							objContactProps.customer_ID = props.customer_ID
						}
						
						console.log('there are not contacts')
					}
					if(launcher == 'edit page'){
						objContactProps.launcher = 'edit page'
					}else{
						objContactProps.launcher = 'add job page'
					}
					
					objContactProps.user = currentUser
					objContactProps.action = 'add'
					
		
					ipc.send('open-contacts-add',objContactProps)
					break;
				default:
					break;
			}
			
		},
		focus: (event)=>{
			console.log('add new contact focused')
		},
		mousedown: (event)=>{
			console.log(contacts)
			console.log(currentUser)
			if(contacts){
				objContactProps.contacts = contacts
				console.log('there are contacts')
				objContactProps.isNew = false
				objContactProps.customer_ID = contacts[0].customer_ID
				
			}else{
				if(addNewContactOption.getAttribute('data-cid') == 'undefined'){
					console.log('is new company')
					objContactProps.isNew = true
					//TODO: add new company to database
					let decoded = removeSpecialCharacters(document.getElementById('Customer-choice').innerText.trim())
					objContactProps.customer_ID = addNewCompany(decoded)
					ipc.send('pass-new-customer-to-main-window', objContactProps.customer_ID)
					document.getElementById('Customer-choice').setAttribute('data-cid',objContactProps.customer_ID)
				}else{
					//changed from cust_ID to pulling from data-cid attribute to protect against errors when there is an issue
					//with adding the contact that caused company to be added twice
					objContactProps.customer_ID = addNewContactOption.getAttribute('data-cid')
				}
				
				console.log('there are not contacts')
			}
			if(launcher == 'edit page'){
				objContactProps.launcher = 'edit page'
			}else{
				objContactProps.launcher = 'add job page'
			}
			objContactProps.user = currentUser
			objContactProps.action = 'add'
			

			ipc.send('open-contacts-add',objContactProps)
			//ipc.send('open-contacts','add job page',cust_ID)
			//chooseListItem(event,selectBox,choice,button,optionsBox)
		}
	})
    let ancogText = document.createTextNode('+ add new contact')
    addNewContactOption.appendChild(ancogText)
    addNewContactOptionGroup.appendChild(addNewContactOption)
    optionsBox.appendChild(addNewContactOptionGroup)

    //create optionGroup for each contact 
    //--then create header and create name and plus sign divs and fill name with contact name
    //----thencreate an option for each contact info item and fill with phone number or email
	if(contacts){ // was contacts.length>0
		
		//contacts.sort((a, b) => (a.primary_contact > b.primary_contact) ? -1 : 1)
		let first = contacts.primary_contact
        contacts.sort((x,y)=> x.contact_ID == first ? -1 : y.contact_ID == first ? 1 : 0 );
		for(i=0;i<contacts.length;i++){
					//create group
					let contactOptionGroup = document.createElement('div')
					contactOptionGroup.setAttribute('class', 'optionGroup')
					contactOptionGroup.setAttribute('id',`optionGroup${i+1}`)
					

					//create header container
					let coh = document.createElement('div')
					coh.setAttribute('class', 'optionHeader')

					//create header name container
					let cohName = document.createElement('div')
					if(contacts.primary_contact == contacts[i].contact_ID){
						cohName.setAttribute('class','name primaryContact')
					}else{
						cohName.setAttribute('class','name')
					}
					cohName.setAttribute('id', `name${contacts[i].contact_ID}`)
					let name = (contacts[i].last_name!==null)? `${contacts[i].first_name} ${contacts[i]?.last_name}`: contacts[i].first_name;
					let cohNameText = document.createTextNode(name)
					cohName.appendChild(cohNameText)

					//create header add item container
					let cohAdd = document.createElement('div')
					cohAdd.setAttribute('class','addLink plus')
					cohAdd.setAttribute('id',contacts[i].contact_ID)
					cohAdd.setAttribute('data-customer-id', cust_ID)
					cohAdd.setAttribute('data-customer-name', cusName)
					$(cohAdd).on({
						click: (event)=>{
							let props = {}
							props.action = 'edit'
							props.contacts = contacts
							props.customer_name = cusName
							props.launcher = launcher
							for(let contact in contacts){
								if(contacts[contact].contact_ID == event.target.id){
									props.contact = contacts[contact]
									break;
								}
							}
							props.customer_ID = event.target.getAttribute('data-customer-id')
							console.log(props)
							console.log('contact id = '+event.target.id)
							console.log(event.target.getAttribute('data-customer-id'))
							console.log('customer name = '+cusName)
							ipc.send('open-contacts-add',props)
						}
					})

					
					coh.appendChild(cohName)
					coh.appendChild(cohAdd)
					
					contactOptionGroup.appendChild(coh)

					//create
					for(n in contacts[i].emails){
						//create number element unless there is no number
						if(contacts[i].emails[n].email !=null){

							let contactOption = document.createElement('div')
							contactOption.setAttribute('class','option')
							contactOption.setAttribute('id',`eOption${i}`)  
							contactOption.setAttribute('tabindex','-1') 
							contactOption.setAttribute('method','email') 
							contactOption.setAttribute('method-ID',`${contacts[i].emails[n].email_ID}`)
							// contactOption.addEventListener('click',(event)=>{
							// 	let ti = Number(document.getElementById('Contacts-choice').getAttribute('tabindex'))
							// 	displayedName.innerHTML = event.target.previousSibling.childNodes[0].innerHTML
							// 	choice.innerHTML = event.target.innerHTML
							// 	optionsBox.style.animationDuration = '300ms'
							// 	optionsBox.style.transform = 'scaleY(0)'
							// 	arrow.classList.remove('up')
							// 	arrow.classList.add('down')
							// 	resetListBox('Contacts')
							// 	currentFocusedItem = event.target
							// 	chooseListItem(event,choice,choice,event.target,optionsBox)								
							// 	state= 'closed';
							// 	navigateTabs('down',ti)
							// })
							$(contactOption).on({
								click: (event)=>{
									let ti = Number(document.getElementById('Contacts-choice').getAttribute('tabindex'))
									displayedName.innerHTML = event.target.previousSibling.childNodes[0].innerHTML
									choice.innerHTML = event.target.innerHTML
									optionsBox.style.animationDuration = '300ms'
									optionsBox.style.transform = 'scaleY(0)'
									arrow.classList.remove('up')
									arrow.classList.add('down')
									resetListBox('Contacts')
									currentFocusedItem = event.target
									chooseListItem(event,choice,choice,event.target,optionsBox)								
									state= 'closed';
									navigateTabs('down',ti)
								},
								keydown: (event)=>{
									switch(event.key){
										case 'ArrowDown':
										case 'ArrowUp':
											navigateListBox(event, optionsBox, filteredList)
											break;
										case 'Enter':
										case 'Tab':
											event.preventDefault()
											let ti = Number(document.getElementById('Contacts-choice').getAttribute('tabindex'))
											displayedName.innerHTML = event.target.previousSibling.childNodes[0].innerHTML
											choice.innerHTML = event.target.innerHTML
											optionsBox.style.animationDuration = '300ms'
											optionsBox.style.transform = 'scaleY(0)'
											chooseListItem(event,choice,choice,event.target,optionsBox)
											arrow.classList.remove('up')
											arrow.classList.add('down')
											navigateTabs('down',ti)
											break;
										default:
											break;
									}
									//navigateListBox(event, optionsBox, filteredList)
								}

							})
							let contactOptionText = document.createTextNode(contacts[i].emails[n].email)
							contactOption.appendChild(contactOptionText)			 	
											
						

							
								
							contactOptionGroup.appendChild(contactOption)
							
								
							
						}
						
								
					}
					optionsBox.appendChild(contactOptionGroup)
					for(n in contacts[i].phonenumbers){
						//create number element unless there is no number
						if(contacts[i].phonenumbers[n].number !=null){

							let contactOption = document.createElement('div')
							contactOption.setAttribute('class','option')
							contactOption.setAttribute('id',`pOption${i}`)  
							contactOption.setAttribute('tabindex','-1')  
							contactOption.setAttribute('method','phone')
							contactOption.setAttribute('method-ID',`${contacts[i].phonenumbers[n].phone_ID}`)
							// contactOption.addEventListener('click',(event)=>{
							// 	let ti = Number(document.getElementById('Contacts-choice').getAttribute('tabindex'))
							// 	displayedName.innerHTML = event.target.parentNode.firstChild.firstChild.innerHTML
							// 	choice.innerHTML = event.target.innerHTML
							// 	optionsBox.style.animationDuration = '300ms'
							// 	optionsBox.style.transform = 'scaleY(0)'
								
							// 	arrow.classList.remove('up')
							// 	arrow.classList.add('down')
							// 	state= 'closed';
							// 	navigateTabs('down',ti)
							// })
							$(contactOption).on({
								click: (event)=>{
									console.log('item clicked')
									let ti = Number(document.getElementById('Contacts-choice').getAttribute('tabindex'))
									displayedName.innerHTML = event.target.parentNode.firstChild.firstChild.innerHTML
									choice.innerHTML = event.target.innerHTML
									optionsBox.style.animationDuration = '300ms'
									optionsBox.style.transform = 'scaleY(0)'
									resetListBox('Contacts')
									currentFocusedItem = event.target
									chooseListItem(event,choice,choice,event.target,optionsBox)
									arrow.classList.remove('up')
									arrow.classList.add('down')
									//state= 'closed';
									navigateTabs('down',ti)
									console.log('phone number chosen by click')
								},
								keydown: (event)=>{
									
									switch(event.key){
										case 'ArrowDown':
										case 'ArrowUp':
											navigateListBox(event, optionsBox, filteredList)
											break;
										case 'Enter':
										case 'Tab':
											event.preventDefault()
											let ti = Number(document.getElementById('Contacts-choice').getAttribute('tabindex'))
											displayedName.innerHTML = contactOption.parentNode.firstElementChild.firstElementChild.innerHTML
											choice.innerHTML = event.target.innerHTML
											optionsBox.style.animationDuration = '300ms'
											optionsBox.style.transform = 'scaleY(0)'
											chooseListItem(event,choice,choice,event.target,optionsBox)
											arrow.classList.remove('up')
											arrow.classList.add('down')
											navigateTabs('down',ti)
											break;
										default:
											break;
									}
									//navigateListBox(event, optionsBox, filteredList)
								}

							})
							let contactOptionText = document.createTextNode(contacts[i].phonenumbers[n].number)
							contactOption.appendChild(contactOptionText)			 	
											
						

						
								
								contactOptionGroup.appendChild(contactOption)
							
								
							
						}
						
								
					}
					optionsBox.appendChild(contactOptionGroup)
					
					
			}
			if(props.contacts.primary_contact){
				console.log('primary is '+props.contacts.primary_contact)
			}
	}else{
		console.log('contacts length = 0')
		let contactOptionGroup = document.createElement('div')
		contactOptionGroup.setAttribute('class', 'optionGroup')
		contactOptionGroup.setAttribute('id','optionGroup1')
		let contactOption = document.createElement('div')
		contactOption.setAttribute('class','option')
		contactOption.setAttribute('id','noContact')
		contactOption.setAttribute('tabindex','-1')
		let cogText = document.createTextNode('No Contact Info')
		contactOption.appendChild(cogText)
		$(contactOption).on({
			click: (event)=>{
				console.log('clicked')
				displayedName.innerHTML = ''
				choice.innerHTML = event.target.innerHTML
				optionsBox.style.animationDuration = '300ms'
				optionsBox.style.transform = 'scaleY(0)'			
				arrow.classList.remove('up')
				arrow.classList.add('down')
				state= 'closed';
				if($('#Contacts-MessageContainer')){
					$('#Contacts-MessageContainer').remove()
				}
			},
			keyup: (event)=>{
				
				console.log('enter hit on no contact info')
				switch(event.key){
					case 'Enter':
					
						displayedName.innerHTML = ''
						choice.innerHTML = event.target.innerHTML
						optionsBox.style.animationDuration = '300ms'
						optionsBox.style.transform = 'scaleY(0)'			
						arrow.classList.remove('up')
						arrow.classList.add('down')
						state= 'closed';
						if($('#Contacts-MessageContainer')){
							$('#Contacts-MessageContainer').remove()
						}
						break;
					default:
						break;
				}
			}
		})
		// contactOption.addEventListener('keydown',(event)=>{

		// 	displayedName.innerHTML = ''
		// 	choice.innerHTML = event.target.innerHTML
		// 	optionsBox.style.animationDuration = '300ms'
		// 	optionsBox.style.transform = 'scaleY(0)'			
		// 	arrow.classList.remove('up')
		// 	arrow.classList.add('down')
		// 	state= 'closed';
		// })
		contactOptionGroup.appendChild(contactOption)
		optionsBox.appendChild(contactOptionGroup)

	}
	let filteredList = $('#Contacts-listBox .optionGroup .option')
}
