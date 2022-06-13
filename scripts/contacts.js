const { remote } = require('electron');
const path = require('path')
const url = require('url')

function loadContactsPage(){
	fillCustomersDataList()
	remote.ipc.on('name-chosen', (event,args)=>{
		document.getElementById('txtCustomerNames').value = args
	})
}

function onlyUnique(value, index, self) { 
         return self.indexOf(value) === index;
 }

 
function fillCustomersDataList(){
    let listCustomers = document.getElementById('lstCustomers')
	listCustomers.style.display="block";	
	
	listCustomers.innerHTML=""
	customerList = remote.ipc.sendSync('get-customer-names')
	
	
	var uniqueNames = customerList.sort(function (a, b) {
	 	return a.toLowerCase().localeCompare(b.toLowerCase());
	 	}).filter(onlyUnique);
	
	
	for(i=0;i<customerList.length;i++){
		
		var newOption=document.createElement("OPTION");
		newOption.setAttribute("value",uniqueNames[i]);
		listCustomers.appendChild(newOption);		
		
    }
}