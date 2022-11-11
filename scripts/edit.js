/*********
 * global variables
 */
// const electron = require('electron')
// const ipcEdit = electron.ipcRenderer
let inpDateIn 
let inpCustomer
let selContacts
let inpUnit 
let selDesignation 
let selJobType
let inpScheduledDate
let cbOTL_scheduled
let radAM 
let radPM 
const radAM_OTL = document.getElementById('radAM_OTL')
const radPM_OTL = document.getElementById('radPM_OTL')

const cbCash = document.getElementById('cbCash')
//const inpCost = document.getElementById('txtCost')
const cbParts = document.getElementById('cbParts')
const cbApproval = document.getElementById('cbApproval')
const cbChecked = document.getElementById('cbChecked')

const cbWaiting = document.getElementById('cbWaiting')
const cbNoShow = document.getElementById('cbNoShow')
const txtNotes = document.getElementById('txtNotes')
let alreadyScheduled = false
let editData;
let launcher
let currentUser

let originList = ['On the Lot','Scheduled']
window.onload = ()=>{
	createComponent(document.getElementById('dateInWrapper'),'date in',null,'DateIn','edit')
	createComponent(document.getElementById('originWrapper'),'comboBox',originList,'Designation','edit')
	createComponent(document.getElementById('dateSchWrapper'),'date sched',null,'DateSched','edit')
	if(!document.getElementById('customerNames')){
		createComponent(document.getElementById('customerComboBoxContainer'),'comboBox',ipc.sendSync('get-customer-names'),'Customer','edit')
	}
	createComponent(document.getElementById('sbContacts'),'split select', null, 'Contacts','edit')
	createComponent(document.getElementById('unitWrapper'),'textBox',null,'Unit','edit')
	createComponent(document.getElementById('unitTypeWrapper'),'textBox',null,'UnitType','edit')
	createComponent(document.getElementById('jobTypeWrapper'),'comboBox',['Spring','Check All','Alignment','King Pin','Frame'],'JobType','edit')
	currentUser = ipc.sendSync('get-logged-in-user')
	// $('#Designation-choice').focus()
	
	inpDateIn = document.getElementById('DateIn-choice')
	inpCustomer = document.getElementById('Customer-choice')
	selContacts = document.getElementById('Contacts-choice')
	inpUnit = document.getElementById('Unit-choice')
	inpUnitType = document.getElementById('UnitType-choice')
	selDesignation = document.getElementById('Designation-choice')
	inpScheduledDate =document.getElementById('DateSched-choice')
	selJobType = document.getElementById('JobType-choice')
	cbOTL_scheduled = document.getElementById('cbOTL_scheduled')
	radAM = document.getElementById('radAM')
	radPM = document.getElementById('radPM')
}
setTimeout(()=>{		
    $("#DateIn-choice").datepicker({
		dateFormat : "mm/dd/yy",
		beforeShowDay: $.datepicker.noWeekends,
		constrainInput: false

	}); 
	$('#DateIn-choice').on({
							
		keypress: (event)=>{							
			
			const numberKey = /[0-9]+/;
			
			if (!numberKey.test(event.key)) {
			  event.preventDefault();
			}
			let num = event.target.value
			
			if(num.length == 2){									
				event.target.value += '/'
			}
			if(num.length == 5){									
				event.target.value += '/'
			}							
									
		},
		
		keyup:(event)=>{
			if(event.key != 'Backspace' && event.key != 'Enter' && event.key != 'Tab'){
				let num = event.target.value
				if(num.length == 8){
					console.log(event.key)
					if(event.key != '0' && Number(event.target.value.substring(6,7)) >= 2){
						let year = event.target.value.substring(7)
						let pre = event.target.value.substring(0,6)
						console.log(year,pre)
						year = year.padStart(4,'20')
						console.log(year)
						event.target.value = pre+year
					}
				}
			}								
		}
	})
	$("#DateSched-choice").datepicker({
		dateFormat : "mm/dd/yy",
		beforeShowDay: $.datepicker.noWeekends,
		constrainInput: false
	}); 
	$('#DateSched-choice').on({
							
		keypress: (event)=>{							
			
			const numberKey = /[0-9]+/;
			
			if (!numberKey.test(event.key)) {
			  event.preventDefault();
			}
			let num = event.target.value
			
			if(num.length == 2){									
				event.target.value += '/'
			}
			if(num.length == 5){									
				event.target.value += '/'
			}							
									
		},
		
		keyup:(event)=>{
			if(event.key != 'Backspace' && event.key != 'Enter' && event.key != 'Tab'){
				let num = event.target.value
				if(num.length == 8){
					console.log(event.key)
					if(event.key != '0' && Number(event.target.value.substring(6,7)) >= 2){
						let year = event.target.value.substring(7)
						let pre = event.target.value.substring(0,6)
						console.log(year,pre)
						year = year.padStart(4,'20')
						console.log(year)
						event.target.value = pre+year
					}
				}
			}								
		}
	})
	$("#datepickerOTL").datepicker({
		dateFormat : "mm/dd/yy",
		beforeShowDay: $.datepicker.noWeekends,
		constrainInput: false
	});
	$('#datepickerOTL').on({
							
		keypress: (event)=>{							
			
			const numberKey = /[0-9]+/;
			
			if (!numberKey.test(event.key)) {
			  event.preventDefault();
			}
			let num = event.target.value
			
			if(num.length == 2){									
				event.target.value += '/'
			}
			if(num.length == 5){									
				event.target.value += '/'
			}							
									
		},
		
		keyup:(event)=>{
			if(event.key != 'Backspace' && event.key != 'Enter' && event.key != 'Tab'){
				let num = event.target.value
				if(num.length == 8){
					console.log(event.key)
					if(event.key != '0' && Number(event.target.value.substring(6,7)) >= 2){
						let year = event.target.value.substring(7)
						let pre = event.target.value.substring(0,6)
						console.log(year,pre)
						year = year.padStart(4,'20')
						console.log(year)
						event.target.value = pre+year
					}
				}
			}								
		}
	})
	$("#DateOTL-choice").datepicker({
		dateFormat : "mm/dd/yy",
		beforeShowDay: $.datepicker.noWeekends,
		constrainInput: false
	});
	$('#DateOTL-choice').on({
							
		keypress: (event)=>{							
			
			const numberKey = /[0-9]+/;
			
			if (!numberKey.test(event.key)) {
			  event.preventDefault();
			}
			let num = event.target.value
			
			if(num.length == 2){									
				event.target.value += '/'
			}
			if(num.length == 5){									
				event.target.value += '/'
			}							
									
		},
		
		keyup:(event)=>{
			if(event.key != 'Backspace' && event.key != 'Enter' && event.key != 'Tab'){
				let num = event.target.value
				if(num.length == 8){
					console.log(event.key)
					if(event.key != '0' && Number(event.target.value.substring(6,7)) >= 2){
						let year = event.target.value.substring(7)
						let pre = event.target.value.substring(0,6)
						console.log(year,pre)
						year = year.padStart(4,'20')
						console.log(year)
						event.target.value = pre+year
					}
				}
			}								
		}
	})
},2000);


document.addEventListener('click',(event)=>{
	
	//console.log(event.target)
	if(event.target.classList != ''){
		if(!event.target.classList.contains('listItem') && !event.target.parentNode.classList.contains('selectBox') && !event.target.parentNode.classList.contains('comboBox')){
				
				closeDropDowns()	
			
		}else{
			if(event.target.parentNode.parentNode.parentNode.id == 'unitWrapper'){
				closeDropDowns()
			}
		}
	}else{
	closeDropDowns()
	}
	if(event.target.id != 'DateSched-choice' && event.target.id != 'btn-DateSched'){
		//console.log(document.getElementById('btn-Date').firstElementChild)
		document.getElementById('btn-DateSched').firstElementChild.classList.remove('up')
		document.getElementById('btn-DateSched').firstElementChild.classList.add('down')
		document.getElementById('DateSched-choice').setAttribute('data-state','closed')
	}
	
	// console.log(event.target.classList)
})
/**
 * 
 * @param {*} input 
 * @returns 
 * 
 * function to treat data synchronously
 * data was delayed causing errors due to asynchronous flow. 
 * used the 'async' and 'await' to stop processing until all data was received
 */

async function treatData (input) {
	try{
	  var treated = input	  
	  return treated;
	}
	catch(err){
	  console.log(err)
	}
  
  }

/**
 * handle communication from main
 */
 
  
ipc.on('edit-data', async (event,args, args2, args3)=>{
    
	editData = await treatData(args)    
	launcher = args2
	currentUser = args3    
	loadData(editData)
        
    
	//add event handler to cbOTL_scheduled(otl&sched)
	$(cbOTL_scheduled).on({
		change:function(){
			if(cbOTL_scheduled.checked){
				document.getElementById('dateWrapper_OTL_SCHEDULED').style.display = 'block';
				document.getElementById('DateOTL-choice').focus()
			}else{
				
				document.getElementById('dateWrapper_OTL_SCHEDULED').style.display = 'none';
			}
		}
	})

	$(selDesignation).on({
		change: function(event){
			switch(this.options[this.selectedIndex].text){
				case 'Scheduled':
					document.getElementById('dateWrapperSch').style.display = 'block';
					document.getElementById('OTL_wrapper').style.display = 'none';
					document.getElementById('dateWrapper_OTL_SCHEDULED').style.display = 'none';
					break;
				case 'On the Lot':
					document.getElementById('dateWrapperSch').style.display = 'none';
					document.getElementById('OTL_wrapper').style.display = 'block';
					//document.getElementById('dateWrapper_OTL_SCHEDULED').style.display = 'block';
					break;
				default:
					break;
			}
		}
	})
})
ipc.on('contacts-updated', (event,args,args2)=>{
	console.log(args)
	console.log('passed item ID '+args2)
	let upProps = {}
	upProps.contacts = args
	upProps.launcher = 'edit page'
	upProps.action = 'add'
	upProps.passed_ID = args2
	fillContactsNew(upProps)
	setTimeout(() => {
        console.log(document.querySelector(`[method-id='${args2}']`).innerText)
		$(`[method-id='${args2}']`).click()
		
    }, 400);
	
})

/**
 * functions
 */
function cancelAdd(){
	ipc.send('close-window')
	window.close()
}

/* function to load current job data into edit form inputs*/
function loadData(objJobToEdit){
	console.log(objJobToEdit)
	let d
	if(Array.isArray(objJobToEdit)){
		d = objJobToEdit[0]
	}else{
		d = objJobToEdit
	}
	let customerNamesList = Array.from(document.querySelectorAll('#Customer-listBox .listItem'))
	
    inpDateIn.value = d?.date_in
	try{
		
		customerNamesList.forEach((item) =>{
			//item.innerText === d.customer_name || 
			if(Number(item.id.substring(8)) === d.customer_ID){
				item.classList.add('focusedListItem')
				item.setAttribute('data-selected', true)
				inpCustomer.setAttribute('data-cid',d.customer_ID)
				inpCustomer.innerText = item.innerText//d.customer_name
				
			}
		})
		
     
	}catch(e){
		console.log(e)
	}
    selJobType.innerHTML = d.job_type;
    (d?.unit) ? inpUnit.value = d.unit : inpUnit.value = "";
	(d?.unit_type) ? inpUnitType.value = d.unit_type : inpUnitType.value = "";
	selDesignation.innerHTML = d.designation
    if(d.designation == "On the Lot" || d.desgnation == 'on the lot'){
		
		document.getElementById('dateSchWrapper').className = 'hiddenInput'
	}else{
		alreadyScheduled = true
		document.getElementById('dateSchWrapper').className = 'visibleInput'
	}
	
    (d.date_scheduled != null) ? inpScheduledDate.value = d.date_scheduled : inpScheduledDate.value = "";
    (d.time_of_day == 'am')? radAM.checked = true : radAM.checked = false;
    (d.time_of_day == 'pm')? radPM.checked = true : radPM.checked = false;
    
    
    
    if(d.cash_customer != null){
        if(d.cash_customer === 1){
            cbCash.checked = true;
           
        }else{            
            cbCash.checked = false;        
        }
    }else{
        cbCash.checked = false;
    }
    
    (d.checked != null) ? (d.checked == 1)? cbChecked.checked = true : cbChecked.checked = false : cbChecked.checked = false;
    if(d.comeback_customer != null){
		if(d.comeback_customer == 1){
			cbOTL_scheduled.checked = true;
			document.getElementById('dateWrapper_OTL_SCHEDULED').style.display = 'block';
			if(d.date_scheduled != null){
				createComponent(document.getElementById('dateWrapper_OTL_SCHEDULED'),'date OTL',null,'DateOTL','edit')
				$("#DateOTL-choice").datepicker({
					dateFormat : "mm/dd/yy",
					beforeShowDay: $.datepicker.noWeekends,
					constrainInput: false
				});
				document.getElementById('DateOTL-choice').value = d.date_scheduled;
				(d.time_of_day == 'am')? document.getElementById('radAM_OTL').checked = true : document.getElementById('radAM_OTL').checked = false;
    			(d.time_of_day == 'pm')? document.getElementById('radPM_OTL').checked = true : document.getElementById('radPM_OTL').checked = false;
			}

		}
	}
	(d.waiting_customer != null) ? (d.waiting_customer== 1)? cbWaiting.checked = true : cbWaiting.checked = false : cbWaiting.checked = false;
    
    (d.notes != null) ? txtNotes.value = d.notes : txtNotes.value = "";

    let ejProps = {}
	ejProps.contacts = ipc.sendSync('get-contacts',d.customer_ID)
	ejProps.customer_ID = d.customer_ID
	ejProps.customer_name = d.customer_name
	ejProps.launcher = 'edit page'
	
	fillContactsNew(ejProps)
    if(!ejProps.contacts){
		document.querySelector('#noContact').click()
	}
	let contactsList = Array.from(document.querySelectorAll('#Contacts-listBox .option'))
	console.log(d.number_ID)
    if(d.number_ID != null && d.number_ID != ''){

		contactsList.forEach((item)=>{
			
			if(item.getAttribute('method-id') == d.number_ID){
				selContacts.innerHTML = item.innerHTML
				selContacts.setAttribute('method','phone')
				selContacts.setAttribute('method-id',d.number_ID)
				item.classList.add('focusedListItem')
				item.setAttribute('data-selected', true)
				document.querySelector('#Contacts-info').innerHTML = item.parentNode.firstChild.innerText
			}
		})
		
	}
	if(d.email_ID != null && d.email_ID != ''){

		

		contactsList.forEach((item)=>{
			console.log(item.getAttribute('method-id'))
			console.log(d.email_ID)
			if(item.getAttribute('method-id') == d.email_ID){
				selContacts.innerHTML = item.innerHTML
				selContacts.setAttribute('method','email')
				selContacts.setAttribute('method-id',d.email_ID)
				item.classList.add('focusedListItem')
				item.setAttribute('data-selected', true)
				document.querySelector('#Contacts-info').innerHTML = item.parentNode.firstChild.innerText
			}
		})
	}
}


/*function called when contact is changed on the edit form*/
function changeContact(choice){
	var contactsInput = document.getElementById("txtContacts");
		
	
	let con_ops = contactsInput.options[contactsInput.selectedIndex].text
	con_ops = con_ops.substring(con_ops.indexOf("~") + 1);
	let contactName
	let index
	let customer = ipc.sendSync('db-get-customer-name', editData.customer_ID)
	switch(con_ops){
		
		case '+ add contact': 
			
			
			ipc.send('open-contacts','edit page',customer, false)
			break;
		case '+ add new contact': 
			
			ipc.send('open-contacts','edit page',customer, false)
			
			break;
		case '+ add number': 
			contactName = contactsInput.options[contactsInput.selectedIndex].parentElement.label.split(' ')
			index = contactsInput.options[contactsInput.selectedIndex].index
			conMeth = "phone"
			con_ID = Number(contactsInput.options[contactsInput.selectedIndex].parentElement.getAttribute('contactID'))
			ipc.send('open-contacts','edit page',customer, false, contactName[0], contactName[1], con_ID, conMeth)
			console.log('test '+con_ID)
			break;
		case '+ add email':
			contactName = contactsInput.options[contactsInput.selectedIndex].parentElement.label.split(' ')
			index = contactsInput.options[contactsInput.selectedIndex].index
			conMeth = "email"
			con_ID = Number(contactsInput.options[contactsInput.selectedIndex].parentElement.getAttribute('contactID'))
			ipc.send('open-contacts','edit page',customer, false, contactName[0], contactName[1], con_ID, conMeth)
			
			break;
		default:
			showLabel()
			
			break;
	}
	
}
function showSelected(id){
	
}
function showLabel() {
	let arrOptions = document.getElementById("txtContacts")
	let selected = $('#txtContacts :selected');	
	let item = selected.text();
	let group = selected.parent().attr('label')+" ~ ";
	
	
	/****
	* switch statement to verify what was selected and
	* process accordingly
	****/
	switch (item){

		case "no contact":
			break;
		case "+ add number":
			
			break;
		case "+ add new contact":
			break;
		default:
			//loop through select and remove name from unselected options
			for(i=0;i<arrOptions.length;i++){
				if(arrOptions.options[i].text.includes('~')){//startsWith(group)
					arrOptions.options[i].text = arrOptions.options[i].text.substring(arrOptions.options[i].text.indexOf("~")+1)
				}		
			}

			//add the name to the selected item in the text box i.e Jim Kern ~ (514)908-6666
			if(item.includes('~')){
				selected.text(item)
			}else{
				selected.text(group+item);
			}
			
	}
	
}

function updateJob (){
	//alias input fields for easier programming
	let dateIn = document.getElementById('DateIn-choice')
	let dateScheduled = document.getElementById('DateSched-choice')
	let radAM = document.getElementById('radAM')
	let radPM = document.getElementById('radPM')
	let txtCN = document.getElementById('Customer-choice')
	let txtCon = document.getElementById('Contacts-choice')	
	let txtNotes = document.getElementById('txtNotes')
	let designation = document.getElementById('Designation-choice')
	let jt = document.getElementById('JobType-choice')
	let unit = document.getElementById('Unit-choice')
	let unitType = document.getElementById('UnitType-choice')
	let cbCash = document.getElementById('cbCash')
	let cbWaiting = document.getElementById('cbWaiting')
	let cbChecked = document.getElementById('cbChecked')
	let cbOTL = document.getElementById('cbOTL_scheduled')
	let datepickerOTL = document.getElementById('DateOTL-choice')
	let radAM_OTL = document.getElementById('radAM_OTL')
	let radPM_OTL = document.getElementById('radPM_OTL')


	let objNewJob = new Object()
	let objChangeLog = new Object()
	let editData2 = new Object()
	
	console.table(editData)
	if(Array.isArray(editData)){
		editData = editData[0]
	}

	/**
	 * verify that all required fields are entered.
	 * if not, quit function and display validation messages under fields
	 */
	 let verified = verifyInputs()	
	 if(!verified[0]){
		 
		 for(i=0;i<verified[1].length;i++){
			 let type = verified[1][i].getAttribute('id').split('-')
			  if(type[0] == 'Unit'){
				 if($(`#${type[0]}-MessageContainer`)){
					 $(`#${type[0]}-MessageContainer`).remove()
					 $(`#UnitType-MessageContainer`).remove()
				 }
				 verified[1][i].parentNode.parentNode.appendChild(createMessageBox(type[0],null))
				 document.querySelector('#unitTypeWrapper').appendChild(createMessageBox('UnitType',null))
			  }else{
			 if($(`#${type[0]}-MessageContainer`)){
				 $(`#${type[0]}-MessageContainer`).remove()
			 }
			 verified[1][i].parentNode.parentNode.appendChild(createMessageBox(type[0],null))
		 }
		 }
		 
		 return
	 } 
	
	//-----build job object-----set job ID
	objNewJob.job_ID = editData.job_ID

	//-----build job object-----check for changes in Date In	
	if(editData.date_in!= null && editData.date_in!= undefined){		
		(editData.date_in.localeCompare(dateIn.value)!=0)
			? objNewJob.date_in = dateIn.value
			: '';
	}else{
		if(dateIn.value.length){
			objNewJob.date_in = dateIn.value
		}        
	}

	//-----build job object-----check for changes in Designation
	if(editData.designation?.localeCompare(designation.innerText)!=0){
		objNewJob.designation = designation.innerText
		let s
		switch(designation.innerText){
			case 'On the Lot':
				s = "wfw" 
				break;
			case 'Scheduled':
				s = "sch"

				break;
			default:
				break;
		}
		
	
		if(editData.status.localeCompare(s)!=0 && launcher == 'move'){
			objNewJob.status = s
		}		
	}

	//-----build job object-----check for changes in scheduled time of day
	
	if(editData.time_of_day != null && editData.time_of_day != ''){
		
			(editData.time_of_day.localeCompare($('input[name=ampmSched]:checked').val())!=0)
				? objNewJob.time_of_day = $('input[name=ampmSched]:checked').val()
				:'no change to time_of_day';		
    }else{
		if(designation.innerText == 'Scheduled'){
			($('input[name=ampmSched]:checked').val()!= undefined)
				? objNewJob.time_of_day = $('input[name=ampmSched]:checked').val()
				: objNewJob.time_of_day = 'am';
			
		}
	}

	//-----build job object-----check for change in scheduled date
	console.log(editData.date_scheduled)
	if(editData.date_scheduled?.localeCompare(dateScheduled.value)!=0){
		if(!document.getElementById('DateOTL-wrapper') && designation.innerText == 'Scheduled'){
			objNewJob.date_scheduled = dateScheduled.value
			objNewJob.julian_date = jDate(document.getElementById('DateSched-choice').value)
		}
	}
		

	//-----build job object-----check for change in job type
	if(editData.job_type.localeCompare(jt.innerText)!=0){
		objNewJob.job_type = jt.innerText
	}

	//-----build job object-----check for change in customer
	if(txtCN.getAttribute('data-cid') != editData.customer_ID){
		objNewJob.customer_ID = txtCN.getAttribute('data-cid')
	}

	//-----build job object-----check for change in unit
	if(editData.unit!= null && editData.unit!= undefined){		
		(editData.unit.localeCompare(unit.value)!=0)
			? objNewJob.unit = unit.value
			: '';
	}else{
		if(unit.value.length){
			objNewJob.unit = unit.value
		}        
	}

	//-----build job object-----check for change in unit type
	if(editData.unit_type!= null && editData.unit_type!= undefined){
		console.log(editData.unit_type);
		(editData.unit_type.localeCompare(unitType.value)!=0)
			? objNewJob.unit_type = unitType.value
			: '';
	}else{
		if(unitType.value.length){
			objNewJob.unit_type = unitType.value
		}        
	}

	//-----build job object-----check for change in notes
	if(editData.notes == null && txtNotes.value != null && txtNotes.value != ''){
        objNewJob.notes = txtNotes.value
		objChangeLog.notes = txtNotes.value
    }
    if(editData.notes != null){
        if(editData.notes.localeCompare(txtNotes.value)!=0){
			objNewJob.notes = txtNotes.value
			objChangeLog.notes = txtNotes.value
		}       
    }

	//-----build job object-----check for change in contact
	let method = txtCon.getAttribute('method')
	let method_ID = txtCon.getAttribute('method-id')
	if(editData.number_ID != null 
		&& editData.number_ID!= 'null'
		&& editData.number_ID != ''
		&& editData.number_ID != undefined
		&& editData.email_ID != null 
		&& editData.email_ID!= 'null'
		&& editData.email_ID != ''
		&& editData.email_ID != undefined
		){
			let itemToCompare = (editData.number_ID)? editData.number_ID: editData.email_ID;
			let methodToCompare = (editData.number_ID)? 'phone':'email'
			console.log(itemToCompare)
			if(methodToCompare.localeCompare(method)!=0){
				if(method == 'phone'){
					objNewJob.number_ID = method_ID
					objNewJob.email_ID = ''
				}else{
					objNewJob.number_ID = ''
					objNewJob.email_ID = method_ID
				}
				
			}else{
				if(itemToCompare.toString().localeCompare(method_ID)!=0){
					if(method == 'phone'){
						objNewJob.number_ID = method_ID
						objNewJob.email_ID = ''
					}else{
						objNewJob.number_ID = ''
						objNewJob.email_ID = method_ID
					}
					
				}
			}
		}else{
			if(txtCon.innerText){
				if(method == 'phone'){
					objNewJob.number_ID = method_ID
					objNewJob.email_ID = null
				}else{
					objNewJob.number_ID = null
					objNewJob.email_ID = method_ID
				}
			}
		}	
	

	//-----build job object-----check for change in cash customer
	if(Boolean(cbCash.checked)!=Boolean(editData.cash_customer)){
    	(cbCash.checked == true)
			? objNewJob.cash_customer = 1
			: objNewJob.cash_customer = 0
		objChangeLog.cash_customer = cbCash.checked
	}

	//-----build job object-----check for change in waiting customer
	(Boolean(cbWaiting.checked)!=Boolean(editData.waiting_customer))
    ? (cbWaiting.checked)
		? objNewJob.waiting_customer = 1
		: objNewJob.waiting_customer = 0
    : console.log('no change to waiting');

	//-----build job object-----check for change in checked
	(Boolean(cbChecked.checked)!=Boolean(editData.checked))
    ? (cbChecked.checked)
		? objNewJob.checked = 1
		: objNewJob.checked = 0
    : console.log('no change to checked');

	//-----build job object-----check for change in OTL and Scheduled
	if(Boolean(cbOTL.checked)!=Boolean(editData.comeback_customer)){
		if(cbOTL.checked){			
			
			if(datepickerOTL.value == '' || datepickerOTL.value == undefined || datepickerOTL.value == null || $('input[name=ampmOTL]:checked').val() == undefined){
				
				document.getElementById('wrapperOTL').style.display = 'block'
				document.getElementById('OTL_message').innerHTML = 'scheduled date and time of day required'
				return
			}
			objNewJob.comeback_customer = 1
			objNewJob.date_scheduled = datepickerOTL.value
			objNewJob.time_of_day = $('input[name=ampmOTL]:checked').val()
			objNewJob.julian_date = jDate(document.getElementById('DateOTL-choice').value)
		}else{
			objNewJob.comeback_customer = 0
		}
	}

    

   
	
	console.log('object length is '+Object.keys(objNewJob).length)
	console.log(objNewJob)
    if(Object.keys(objNewJob).length>1){
		
	    ipc.send('update-job',objNewJob, launcher, currentUser, txtCN.value)
		ipc.send('close-window')
		window.close()
    }else{
		ipc.send('close-window')
		window.close()
	}

}
function jDate(ds){
	console.log(ds)

	var ds = ds;    

	var dayScheduled = new Date(ds);
	var julian= Math.ceil((dayScheduled - new Date(dayScheduled.getFullYear(),0,0)) / 86400000);

	return julian;
}
function openOTLandScheduled(event,cb,OTL_container){
	//TODO: first check to see if designation was scheduled. If it was store the data for unchecking?
	// and trigger mousedown on designation option 'On the Lot' which will close scheduled component under the designation
	/**
	 * When clicking on the OTL and Schuduled checkbox determine if you are checking or unchecking. If uncheckiing
	 * remove the date component under OTL if it exists and display the date component under designation if
	 * the job was previously scheduled when you opened the edit page. If checking the checkbox, create the date 
	 * component under the OTL, remove the date component from under designation if it exists,
	 * and change the designation to 'On the Lot'.
	 * 
	 */

	

	
	if (cb.checked == true) {
		//$('#Designation0').mousedown()
		if(alreadyScheduled || selDesignation.innerText == 'Scheduled'){
			$('#Designation0').mousedown()
			$(cb).focus()
			// document.getElementById('dateSchWrapper').className = 'hiddenInput'
			
		}
		document.getElementById(OTL_container).className = "visibleInput";
		createComponent(document.getElementById('dateWrapper_OTL_SCHEDULED'),'date OTL',null,'DateOTL','edit')
		$("#DateOTL-choice").datepicker({
			dateFormat : "mm/dd/yy",
			beforeShowDay: $.datepicker.noWeekends,
			constrainInput: false
		});

		$('#DateOTL-choice').on({
							
			keypress: (event)=>{							
				
				const numberKey = /[0-9]+/;
				
				if (!numberKey.test(event.key)) {
				  event.preventDefault();
				}
				let num = event.target.value
				
				if(num.length == 2){									
					event.target.value += '/'
				}
				if(num.length == 5){									
					event.target.value += '/'
				}							
										
			},
			
			keyup:(event)=>{
				if(event.key != 'Backspace' && event.key != 'Enter' && event.key != 'Tab'){
					let num = event.target.value
					if(num.length == 8){
						console.log(event.key)
						if(event.key != '0' && Number(event.target.value.substring(6,7)) >= 2){
							let year = event.target.value.substring(7)
							let pre = event.target.value.substring(0,6)
							console.log(year,pre)
							year = year.padStart(4,'20')
							console.log(year)
							event.target.value = pre+year
						}
					}
				}								
			}
		})
	} else {
		if(alreadyScheduled){
			$('#Designation1').mousedown()
			$(cb).focus()
			document.getElementById('dateSchWrapper').className = 'visibleInput'
		}
		
		//createComponent(document.getElementById('dateWrapper'),'date',null,'Date')
		document.getElementById(OTL_container).innerHTML = ''
		document.getElementById(OTL_container).className = "hiddenInput";			
	}
	//document.getElementById('dateWrapper_OTL_SCHEDULED').classList.remove('hiddenInput')
	//document.getElementById('dateWrapper_OTL_SCHEDULED').classList.add('visibleInput')
	
}
function openInput(e, active, inputID1, inputID2) {
	// createComponent(document.getElementById('customerComboBoxContainer'),'comboBox',ipc.sendSync('get-customer-names'),'customerNames')
	var v = active.value;	
	var next = document.getElementById(inputID1);
	
	if (active.id == "cbOTL_scheduled") {
		
		if (active.checked == true) {
			document.getElementById(inputID1).className = "visibleInput";
		} else {

			document.getElementById('dateWrapper_OTL_SCHEDULED').value = "";
			document.getElementById(inputID1).className = "hiddenInput";			
		}
	}else{
		if (!e || e.keyCode != 9) {
			if (v && v != "") {
				
				document.getElementById(inputID1).className = "visibleInput";
				//next.style.display = "block";				
			
			} else {
				
				document.getElementById(inputID1).className = "hiddenInput"
			}
		}
		if (inputID2) {
			let choice = active.options[active.selectedIndex].text
			
			switch(choice) {
				
				case "Scheduled":
					document.getElementById(inputID2).className = "visibleInput";
					document.getElementById('OTL_SCHEDULED').className = 'hiddenInput';
					document.getElementById('dateWrapper_OTL_SCHEDULED').className = 'hiddenInput';
					document.getElementById('cbOTL_scheduled').checked = false
					$('#datepicker').on({
						'blur': ()=>{
							let dp = document.getElementById('datepicker');
							let formatted = formatDate(dp.value)
							
							if(formatted[0] === true){
								dp.value = formatted[1]
							}else{
								dp.value = `please choose date`
								dp.focus()
							}

						}
					})
					break;
				case "On the Lot":
					
					document.getElementById("dateWrapper").className = "hiddenInput";
					document.getElementById('OTL_SCHEDULED').className = 'visibleInput';
					
					break;
				
				default:
					
					
					document.getElementById('cbWrapper').className = "visibleFieldset";
					document.getElementById('formButtons').className = "visibleInput";
					
					break;
			}
			if(inputID2 == "dateWrapper"){
				
									
			}else{
			document.getElementById(inputID2).className = "visibleFieldset";
			}

		}
	}
}
let verifyInputs = ()=>{
    let des = document.getElementById('Designation-choice')
    let sch = document.getElementById('DateSched-choice')
    let jt = document.getElementById('JobType-choice')
    let cus = document.getElementById('Customer-choice')    
    let con = document.getElementById('Contacts-choice')
	let unit = document.getElementById('Unit-choice')
	let ut = document.getElementById('UnitType-choice')
	let arrInvalid = []
	let invalidCount = 0
	let verified = true

	if(des.innerHTML == ''){
		arrInvalid.push(des)
		invalidCount+=1
	}
	if(des.innerHTML == 'Scheduled' && sch.value == ''){
		arrInvalid.push(sch)
		invalidCount+=1
	}
	if(jt.innerHTML == ''){
		arrInvalid.push(jt)
		invalidCount+=1
	}
	if(cus.innerHTML == ''){
		arrInvalid.push(cus)
		invalidCount+=1
	}
	if(con.innerHTML == ''){
		arrInvalid.push(con)
		invalidCount+=1
	}
	if(unit.value == '' && ut.value == ''){
		console.log(unit.value +' '+ut.value)
		arrInvalid.push(unit)
		invalidCount+=1		
	}

	if(invalidCount>0){
		verified = false
	}
    return [verified, arrInvalid]
}
//function to check if the company has a no show on record
function checkForNoShows(id){
	return ipc.sendSync('check-for-no-shows',id)
}