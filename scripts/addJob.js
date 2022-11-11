
// const electron = require('electron')
// const ipc = electron.ipcRenderer
let companyList
var d = new Date();
var month_name=['January','February','March','April','May','June','July','August','September','October','November','December'];
var monthIndex = d.getMonth();// 0-11
var thisYear = d.getFullYear();// xxxx
var today = d.getDate();
var thisMonth = month_name[monthIndex];
let chosenCompany=""
let chosenCompanyID
let newCompanyContact=""
let chosenFirstname="firstname"
let chosenLastname = "lastname"
let con_ID
let newContactID
let conMeth
let currentUser
//let phoneNumberCount
let launcher
let launcherData
let txtCust
let originList = ['On the Lot','Scheduled']

window.onload = ()=>{
	// document.addEventListener('select', function() {console.log(document.activeElement)})
	//console.log(!document.getElementById('customerComboBoxContainer'));
	createComponent(document.getElementById('originWrapper'),'comboBox',originList,'Designation','add')
	createComponent(document.getElementById('dateSchWrapper'),'date sched',null,'DateSched','add')
	if(!document.getElementById('customerNames')){
		createComponent(document.getElementById('customerComboBoxContainer'),'comboBox',ipc.sendSync('get-customer-names'),'Customer','add')
	}
	createComponent(document.getElementById('sbContacts'),'split select', null, 'Contacts','add')
	createComponent(document.getElementById('unitWrapper'),'textBox',null,'Unit','add')
	createComponent(document.getElementById('unitTypeWrapper'),'textBox',null,'UnitType','add')
	createComponent(document.getElementById('jobTypeWrapper'),'comboBox',['Spring','Check All','Alignment','King Pin','Frame'],'JobType','add')
	currentUser = ipc.sendSync('get-logged-in-user')
	$('#Designation-choice').focus()
	
	$('#Customer-choice').on({
		keyup: (event)=>{
			
		},
		blur: (event)=>{
				
		}	
	})

}
setTimeout(() => {
	
}, 100);
document.addEventListener('keydown', (event)=>{
	if(event.key == 'Enter'){
		console.log(document.activeElement)
	}
})
document.addEventListener('click',(event)=>{
	
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

setTimeout(()=>{
	
	//initialize datepickers
	 
		
			$("#datepicker").datepicker({
				dateFormat : "mm/dd/yy"
				
			});
			$("#datepickerOTL").datepicker({
				dateFormat : "mm/dd/yy"
				
			});
			
			//$('#Designation-input').click()
			
			$("#DateSched-choice").datepicker({
				dateFormat : "mm/dd/yy",
				beforeShowDay: $.datepicker.noWeekends,
				onSelect: function(dateText, inst) {
					if($(`#Date-MessageContainer`)){
						$(`#Date-MessageContainer`).remove()
					}
					
					this.setAttribute('data-state','closed');
                	document.getElementById('btn-DateSched').firstElementChild.classList.remove('up');
					document.getElementById('btn-DateSched').firstElementChild.classList.add('down');
					navigateTabs('down',Number(this.getAttribute('tabindex')))
					//$('#Customer-choice').focus()
				}
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
							
							if(event.key != '0' && Number(event.target.value.substring(6,7)) >= 2){
								let year = event.target.value.substring(7)
								let pre = event.target.value.substring(0,6)
								
								year = year.padStart(4,'20')
								
								event.target.value = pre+year
							}
						}
					}								
				}
			})
			
	
},200)
// setTimeout(() => {
// 	document.getElementById('Designation-input').click()
// }, 700);
ipc.on('user-data',(event,args, args2)=>{
	console.log(currentUser)
	//currentUser = args
	if(args2){
		launcherData = args2
		console.log(args2)
		launcher = args2.launcher
		setData(launcherData)
	}
	
	
})
ipc.on('refresh',(event,args,args2,args3)=>{
	console.log('refresh page called')
	console.log(args,args2,args3)
	clearContacts()
	if(args = "go"){
		let props = {}
		props.contacts = pullContacts(args2)
		props.customer_ID = args2
		props.launcher = 'add job page'
		//console.log(args2)
		
		
		//console.log('after pullcontacts called')
		//fillContactsNew(props)
		setTimeout(() => {
			document.querySelector(`[method-id = '${args3}']`).click()
		}, 00);
		
		//document.getElementById("txtContacts").selectedIndex =document.getElementById("txtContacts").options.length
		
		//var values = Array.from(document.getElementById("txtContacts").options).map(e => e.id);
		//document.getElementById("txtContacts").options.namedItem(args3).selected=true;
		
	
	}else{
	
	
	pullContacts(chosenCompany)
	
	
	//document.getElementById("txtContacts").options[args.position].selected = true
	}
	$('#Contacts-choice').focus()
	// showLabel()
	// newContactID = args
	
	// window.focus()
	
	// $('#txtUnit').click()
	// $("#txtUnit").focus()
	
})

function setData(data){
	$('#Designation1').mousedown()
	document.getElementById('DateSched-choice').value = data.date_scheduled
	document.getElementById('rad'+data.time_of_day.toUpperCase()).checked = true
	$('#JobType-choice').focus()
	
	
	//openInput(event,document.getElementById('Designation-choice'),'customerNameWrapper','dateSchWrapper')
	
}
function pullContacts(comp){
	
    if(typeof comp != undefined){
		let pcProps = {}
    	pcProps.contacts = ipc.sendSync('get-contacts',comp)
		
		//createdropDown(cont)
		//createComponent(document.getElementById('sbContacts'),'split select', cont, 'Contacts')
		fillContactsNew(pcProps)
		
    }else{
		//send with non object to trigger else in fillcontacts
		
		//fillContacts(comp)
	}

}
ipc.on('new-contact-for-new-company', (event, args)=>{
	newCompanyContact = args
	
})
function formatDate(date){
	let pieces = date.split('/');
	if(pieces[0].length>2 || Number(pieces[0])>12) return [false,date]
	if(pieces[1].length>2) return [false,date]
	if(pieces[2].length>4 || pieces[2].length < 2 || pieces[2].length == 3) return [false,date]

	let month = (pieces[0].length <2) ? '0'+pieces[0] : pieces[0];
	let day = (pieces[1].length <2) ? '0'+pieces[1] : pieces[1];
	let year = (pieces[2].length ==2) ? '20'+pieces[2] : pieces[2];
	console.log(`${month}/${day}/${year}`)
	return [true, `${month}/${day}/${year}`]
	
}

function jDate(ds){
	

	var ds = ds;    

	var dayScheduled = new Date(ds);
	var julian= Math.ceil((dayScheduled - new Date(dayScheduled.getFullYear(),0,0)) / 86400000);

	return julian;
}
function fillCustomerDataList(){
	let element = document.getElementById('lstCustomer');
	let arrCL = new Array()

	
	document.getElementById('lstCustomer').style.display="block";
		
	companyList ='';
	element.innerHTML=""
	customerList = ipc.sendSync('get-customer-names')
	
	
	for(member in customerList){
		arrCL[member]=customerList[member].customer_name
	}
	
	companyList = Object.values(customerList)
	 
	
	customerList.sort((a, b) => (a.customer_name > b.customer_name) ? 1 : -1)
	
	for(i=0;i<customerList.length;i++){
		
		var newOption=document.createElement("OPTION");
		
		newOption.setAttribute("value",customerList[i].customer_name.toUpperCase());
		newOption.setAttribute("id", customerList[i].customer_ID)		
		element.appendChild(newOption);		
		
	}
	var val
	for (let option of element.options) {
		// console.log(option)
		option.style.display = 'block'
		option.onclick = function () {
		  this.value = option.value;
		//   element.style.display = 'none';
		  this.style.borderRadius = "5px";
		}
	}
	$("#Customer-choice").on({//#txtCustomerName
		
		'keydown': function (event) {
			console.log('yo mamma')
		 },
		'keyup': function(){
			//reset contacts if backspacing to empty field
			val = this.value;		
			
			if(val == "") {						
					clearContacts()						
			}
		},
		'input' : function(){
			
			val = this.value;
			
			//sort datalist to display entries that match what is typed
			//  if($('#lstCustomer option').filter(function(){
			//  	return this.value.toUpperCase() === val.toUpperCase();        
			//  }).length) {
			
				
			// }
		},
		"change": function(){
			console.log('change fired on customer name field')
			//console.log(checkForNoShows(chosenCompanyID))
		},
		"blur": function(){	
			document.getElementById('no_show').innerHTML =''		
			clearContacts()
			chosenCompanyID =null
			val = this.value;
			chosenCompany = val.trim()
			chosenCompany = chosenCompany.replace(/  +/g, ' ');
			// $('#txtContacts').text = chosenCompany;
			
			chosenCompanyID = ipc.sendSync('get-customer-ID', chosenCompany)
			//alert(chosenCompanyID)

			// if 'get-customer-ID' returned false or null
			if(chosenCompanyID === false || chosenCompanyID === null){			
				//call fill contacts with false value
				fillContacts(this.value)
				

			}else{
				// if(checkForNoShows(chosenCompanyID)){
				// 	//create message section to alert of no shows
					
				// 	let message = document.createElement('span')
				// 	let text = document.createTextNode('CUSTOMER HAS NO-SHOW ON RECORD')
				// 	message.appendChild(text)
				// 	let link = document.createElement('span')
				// 	let linkText = document.createTextNode('view')
				// 	link.setAttribute('class','actionLink')
				// 	link.appendChild(linkText)
				// 	link.addEventListener('click',()=>{
						
				// 		ipc.send('open-report-window',currentUser.role, chosenCompanyID,"no_shows",chosenCompany)
				// 	})
					
				// 	document.getElementById('no_show').appendChild(message)
					
				// 	document.getElementById('no_show').appendChild(link)
					
					 
				// 	document.getElementById('no_show').style.display ="flex";
				// }
				//pull contacts with chosenCompanyID
				pullContacts(chosenCompanyID)
				//document.getElementById('no_show').style.display ="flex";
				//document.getElementById('selOrigin').focus()
			}
			
		},
		"focus": function(){
			//clear the input field and contacts when clicked in or tabbing to
			clearContacts()
			this.value = ""
			
			
		},
		"click": function(){
			document.getElementById('no_show').style.display ="none";
		}
		
	});
	
}
//function to check if the company has a no show on record
function checkForNoShows(id){
	return ipc.sendSync('check-for-no-shows',id)
}
// function to validate that company name only has one space inbetween words and no spaces at beginning and end
function validateCompanyName(s) {
    if (/(\w+\s?)*\s*$/.test(s)) {
        return s.replace(/\s+$/, '');
    }
    return 'NOT ALLOWED';
}

async function clearContacts(){
	
	$('#txtContacts')
    .find('option')
    .remove()
	.end()
	
	$('#txtContacts')
    .find('optgroup')
    .remove()
	.end()
	
}


function tellParent(choice){
	$('#txtContacts').click()
	var conOps = document.getElementById("txtContacts");
	
	
	let con_ops = conOps.options[conOps.selectedIndex].text
	con_ops = con_ops.substring(con_ops.indexOf("~") + 1);
	let con_name
	let index
	switch(con_ops){
		
		case '+ add contact': 
			
			let check = ipc.sendSync('get-customer-ID',chosenCompany)
			
			if(check === false){
			chosenCompanyID = addNewCompany(chosenCompany)
			}
			ipc.send('open-contacts','add job page',chosenCompany, isNewCustomer(chosenCompany.toUpperCase()))
			break;
		case '+ add new contact': 
			console.log('add new contact')
			ipc.send('open-contacts','add job page',chosenCompany, isNewCustomer(chosenCompany.toUpperCase()))
			
			break;
		case '+ add number': 
			con_name = conOps.options[conOps.selectedIndex].parentElement.label.split(' ')
			index = conOps.options[conOps.selectedIndex].index
			conMeth = "phone"
			con_ID = Number(conOps.options[conOps.selectedIndex].parentElement.getAttribute('contactid'))
			console.log(con_ID)
			ipc.send('open-contacts','add job page',chosenCompany, isNewCustomer(chosenCompany.toUpperCase()), con_name[0], con_name[1], con_ID, conMeth,currentUser)
			
			break;
		case '+ add email':
			con_name = conOps.options[conOps.selectedIndex].parentElement.label.split(' ')
			index = conOps.options[conOps.selectedIndex].index
			conMeth = "email"
			con_ID = Number(conOps.options[conOps.selectedIndex].parentElement.getAttribute('contactid'))
			ipc.send('open-contacts','add job page',chosenCompany, isNewCustomer(chosenCompany.toUpperCase()), con_name[0], con_name[1], con_ID, conMeth,currentUser)
			
			break;
		default:
			showLabel()
			
			break;
	}
	
}
 function validate(inputText){
	
	  const phoneno = /^\d{10}$/;
	  if((inputtxt.value.match(phoneno)))
			{
		  return true;
			}
		  else
			{
			
			return false;
			}
	
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


 function onlyUnique(value, index, self) { 
 	return self.indexOf(value) === index;
 	
 }
function todayIs() {
	const objDate = new Date();
	let day = objDate.getDate().toString().padStart(2,'0');
	let month = objDate.getMonth() + 1;
	month = month.toString().padStart(2,'0')
	let year = objDate.getFullYear().toString();
	let today = month + "/" + day + "/" + year;
	return today;
}
function addJob2(){
	console.log('addjob2')
}
function addJob (){
	
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


	let txtCN = document.getElementById('Customer-choice')
	let txtCon = document.getElementById('Contacts-choice')
	let txtCost =document.getElementById('txtCost')
	let txtNotes = document.getElementById('txtNotes')
	let designation = document.getElementById('Designation-choice')
	let jt = document.getElementById('JobType-choice')
	let txtUnit = document.getElementById('Unit-choice')
	let txtUnitType = document.getElementById('UnitType-choice')

	let objNewJob = new Object()
	
	console.log(txtCN.getAttribute('data-cid'))
	let decoded = removeSpecialCharacters(txtCN.innerText)
	// var elem = document.createElement('textarea');
	// 	elem.innerHTML = txtCN.innerText.toUpperCase();
	// 	var decoded = elem.value;
		console.log(decoded)
	
	//build job object
	objNewJob.customer_ID =(txtCN.getAttribute('data-cid')!= null) ? txtCN.getAttribute('data-cid') :  addCompanyNoCantact(decoded.trim().replace(/  +/g, ' '))//addCompanyNoCantact(txtCN.innerHTML.trim().replace(/  +/g, ' '))
	// objNewJob.customer_ID =(chosenCompanyID != null && chosenCompanyID != '') ? chosenCompanyID : ipc.sendSync('add-new-customer', txtCN.value.trim().replace(/  +/g, ' '))
	console.log(txtCN.innerText.toUpperCase())
	
	objNewJob.customer_name = decoded
	// objNewJob.customer_name = ipc.sendSync('db-get-customer-name',objNewJob.customer_ID)
	if(txtCon.getAttribute("method")=="phone"){
		objNewJob.number_ID = txtCon.getAttribute('method-ID')
	}
	if(txtCon.getAttribute("method")=="email"){
		objNewJob.email_ID = txtCon.getAttribute('method-ID')
	}
	
	(txtNotes.value.trim().length) ? objNewJob.notes = txtNotes.value : '';
	// if(document.getElementById('cbComeback').checked){
	// 	objNewJob.comeback_customer = 1
	// 	objNewJob.date_scheduled = document.getElementById('datepickerOTL').value;
	// 	objNewJob.time_of_day = ($('input[type=radio]:checked').size() > 0)?$('input[name=ampmOTL]:checked').val(): 'am';
	// 	objNewJob.julian_date = jDate(document.getElementById('datepickerOTL').value)

	// }
	objNewJob.designation = designation.innerText;
	// objNewJob.designation = designation.options[designation.selectedIndex].value;
	
	if(objNewJob.designation == "On the Lot"){
		objNewJob.date_in = todayIs() 
		objNewJob.status = "wfw" 
		
	}else if (objNewJob.designation == "Scheduled"){
		objNewJob.date_scheduled = document.getElementById('DateSched-choice').value;
		objNewJob.time_of_day = ($('input[type=radio]:checked').size() > 0)?$('input[name=ampmSched]:checked').val(): 'am';
		objNewJob.status = "sch"
		objNewJob.julian_date = jDate(document.getElementById('DateSched-choice').value)
		objNewJob.date_called = todayIs()
	}
	
	(txtUnit.value.trim().length) ? objNewJob.unit = txtUnit.value : '';
	
	(txtUnitType.value.trim().length) ? objNewJob.unit_type = txtUnitType.value : null;
	
	objNewJob.active = 1
	objNewJob.cancelled = 0
	objNewJob.user_ID = currentUser.user_ID
	objNewJob.job_type = jt.innerText;
	// objNewJob.job_type = jt.options[jt.selectedIndex].value;
	(document.getElementById('cbCash').checked) ? objNewJob.cash_customer = 1 : objNewJob.cash_customer = 0;
	//(document.getElementById('cbApproval').checked) ? objNewJob.approval_needed = 1 : objNewJob.approval_needed = 0;
	//(document.getElementById('cbParts').checked) ? objNewJob.parts_needed = 1 : objNewJob.parts_needed = 0;
	//(document.getElementById('cbChecked').checked) ? objNewJob.checked = 1 : objNewJob.checked = 0;
	
	(document.getElementById('cbWaiting').checked) ? objNewJob.waiting_customer = 1 : objNewJob.waiting_customer= 0;
	
	console.log(objNewJob)
	
	ipc.send('add-job',objNewJob,currentUser,launcher)


}

function addNewJobToCustomer(args){
	let IDtoAdd = Number(ipc.sendSync('getID'))
    
    ipc.send('add-job-to-company', args, IDtoAdd)		
}
function isNewCustomer(args){
	let isNew = true
	
	for(i=0;i<companyList.length;i++){
		
		if(args.toUpperCase() == companyList[i].customer_name.toUpperCase()){
			
			isNew = false
			break;
		}
	}
	return isNew
}
/***
 * adds new company to customers.json and returns the ID of the newly created company
 */

function addNewCompany(name){
	let id = ipc.sendSync('add-new-customer', name.trim())
	document.getElementById('addNewContact').setAttribute('data-cid',id)
	return id
}

let addCompanyNoCantact = (txtName)=>{
	let id = ipc.sendSync('add-new-customer', txtName)
	ipc.send('pass-new-customer-to-main-window', id)
	return id
}
function contactIsBeingAdded(){
	let selContact = document.getElementById('txtContacts')
	
	let optSelected = selContact.options[selContact.selectedIndex].value	
	let b = (optSelected.includes('no contact')) ? false : true	
	return b
}

function cancelAdd(){
	window.close()
}
function resetForm(){
	window.location.reload()	
}

//openInput(event,document.getElementById('selOrigin'),'customerNameWrapper','dateSchWrapper')
function openInput(e, active, inputID1, inputID2) {
	// createComponent(document.getElementById('customerComboBoxContainer'),'comboBox',ipc.sendSync('get-customer-names'),'customerNames')
	var v = active.value;	
	var next = document.getElementById(inputID1);
	
	if (active.id == "cbComeback") {
		
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
					document.getElementById('cbComeback').checked = false
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