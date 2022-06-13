/*****************************
 * WORKFLOW APP written by Sean Davidson 
 * For use at Frame & Spring in tracking daily movements
 * of vehicles/jobs using Node.js, Electron, and SQLite database.
 * Front end styled using CSS, javascript, and HTML5
******************************/



/***************
 * global variables
 ***************/
//import errLog from 'electron-log';

const electron = require('electron')


const ipc = electron.ipcRenderer
const date = new Date();
const arrPenultimateRow = ['wfw10','wfw22','wfw34','wfw46','wfw58']
const arrLastRow = ['wfw11','wfw23','wfw35','wfw47','wfw59']
const arrBottomHalf = ['wfw7','wfw8','wfw9','wfw10','wfw11',
						'wfw19','wfw20','wfw21','wfw22','wfw23',
						'wfw31','wfw32','wfw33','wfw34','wfw35',
						'wfw43','wfw44','wfw45','wfw46','wfw47',
						'wfw55','wfw56','wfw57','wfw58','wfw59']

const arrShopLocations = ['wip0','wip1','wip2','wip3','wip4','wip5','wip6','wip7','wip8','wip9','wip10','wip11']
let popupDate
let loggedIn = false
let admin = false
let totalCount = 0
let lotCount = 0
let scheduledCount = 0
let completedCount = 0
let openContent = createOpenContent();
let accessGrantedContent
let allJobs
let currentUser
let scheduledSpots
let wpuSpots
var ns = "";
var frameCount = 0;
var springCount = 0;
var alignmentCount = 0;
var kingpinCount = 0;
var largestBucket = 0;





 
/*************
 * page load functions and event listeners
 ************/

window.onload = () =>{
	 try{
	allJobs = ipc.sendSync('pull_jobs')		
	accessGrantedContent = document.getElementById('contentArea').innerHTML	
	document.getElementById('contentArea').innerHTML = openContent;	
	 }catch(e){
		 logError(e)
	 }
	
} 


$('body').on('focus',".popup", function(){
    $(this).datepicker();
});


$('body').on('blur',".whiteBoardContent", function(){
	saveWhiteBoard($(this))    
});

$(function()
{
    $('#datepickerScheduled').datepicker();
});



/*****************
 * handlers for communication from main process
 ****************/



// communication for setting page on window load
// ipc.on('message', (event, args)=>{
// 	logError('from index.js')		
// 	accessGrantedContent = document.getElementById('contentArea').innerHTML
// 	for (var member in args){ 
// 		placeElement(args[member]);		
// 	}	
// 	document.getElementById('contentArea').innerHTML = openContent;   	
	
//  })

ipc.on('update', (event, args)=>{
	
	allJobs = ipc.sendSync('pull_jobs')
	countStatuses()
	clearPage()
	loadJobs(allJobs)	
});


ipc.on('count', (event,args)=>{
	countStatuses()
})





ipc.on('reload',(event,args)=>{	
   loadJobs(args)
   countStatuses()	 
})

ipc.on('placeNewJob', (event, args)=>{
   placeElement(args)
   countStatuses()
})

//show admin elements for admin user
ipc.on('show-admin-elements', (event, args)=>{
	currentUser = args	
	admin = true;
	document.getElementById('contentArea').innerHTML = accessGrantedContent;
	document.getElementById("btnLogin").innerHTML='Log Out'
	document.getElementById('login-message').innerHTML=`<b> ${args.user_name.charAt(0).toUpperCase() + args.user_name.slice(1)}</b>`
	document.getElementById('topCounts').style.display = 'block';	
	document.getElementById('btnContacts').style.display = 'inline-block';	
	document.getElementById("addNewJob").style.display = "block";
	countStatuses()	
	toggleAdminElements(admin)
	loadJobs(allJobs)
	document.getElementById('whiteBoardContent').innerHTML = ipc.sendSync('get-whiteboard','read')	
})

ipc.on('show-user-elements', (event, args)=>{
	admin = false
	currentUser = args
	document.getElementById('contentArea').innerHTML = accessGrantedContent	
	
	document.getElementById('topCounts').style.display = 'block';
	document.getElementById('btnContacts').style.display = 'inline-block';
	document.getElementById("btnLogin").innerHTML='Log Out'
	document.getElementById('login-message').innerHTML=`Welcome ${args.user_name}!`	
	document.getElementById("addNewJob").style.display = "block";
	countStatuses()
	toggleAdminElements(admin)
	loadJobs(allJobs)
	document.getElementById('whiteBoardContent').innerHTML = ipc.sendSync('get-whiteboard','read')
})

ipc.on('whiteboard-updated', (event,args)=>{
	
	document.getElementById('whiteBoardContent').innerText = ipc.sendSync('get-whiteboard','read')
})

/******************
 * functions for opening modal windows
 ******************/

 function openLoginWindow(){	
	if(!loggedIn){		
		loggedIn = true
		ipc.send('open-login-window')
	 }else{
		loggedIn= false
		document.getElementById("btnLogin").innerHTML='Log In'
	 	document.getElementById("btnAdmin").style.display = "none";
		document.getElementById("t").style.display = "none";
		document.getElementById('btnContacts').style.display = 'none';
		document.getElementById('addNewJob').style.display="none";
		document.getElementById('login-message').innerHTML="&nbsp;"
		document.getElementById('contentArea').innerHTML = openContent		
	 }
}

function openContacts(){
	console.log(currentUser)	 
	 ipc.send('open-contacts', 'main page',null,null,null,null,null,null,currentUser)
 }

function openCalendar(){	 
	 ipc.send('open-calendar',currentUser)	 	
 }

 function openCreateUser(){
	ipc.send('open-create-user')
}
function openRestore(){
	ipc.send('open-restore')
}

function openReports(){	
	attachDatePicker()
	$('#datepickerReport').focus()
	$("#datepickerReport").value = todayIs()
	ipc.send('open-report-window')	   
} 

function openAddJob() {
	ipc.send('open-add-job', currentUser)
	
}

//function to convert date to 3 digit day of year i.e. 365
function jDate(ds){    

    var ds = ds;    
    var dayScheduled = new Date(ds);
    var julian= Math.ceil((dayScheduled - new Date(dayScheduled.getFullYear(),0,0)) / 86400000);
    
    return julian;
} 


function saveWhiteBoard(wb){
	ipc.send('get-whiteboard', 'write',document.getElementById('whiteBoardContent').innerText)
	
	setTimeout(() => {
		if(window){
			document.getElementById('whiteBoardContent').innerHTML = ipc.sendSync('get-whiteboard', 'read')
		}
	}, 50);
	 
}
	 
 
 function loadJobs(args){
	fillScheduleGlimpse(args)
	createCompleted(args)
	for (var member in args){ 
		placeElement(args[member]);			
	}
 }

 function createCompleted(args){
	 let arrCompleted = new Array()
	 let wpuJobContainer = document.getElementById('wpuJobContainer')
	 let spotsNeeded 
	
	//empty array of completed jobs
	if(arrCompleted.length>0){
		arrCompleted=[]
	}
	//fill array of completed jobs
	for(member in args){
		(args[member].status == 'wpu')? arrCompleted.push(args[member]):'';
	}
	//determine how many spots to create in container. Creating an extra two rows for flexibility
	spotsNeeded = Math.ceil((arrCompleted.length/2)+2)*2
	wpuSpots = spotsNeeded
	//remove any elements that are already in the wpu container
	if(wpuJobContainer.hasChildNodes()){
		
		while(wpuJobContainer.hasChildNodes()){
			wpuJobContainer.childNodes[0].remove()
		}
	}

	//create elements and put them in wpu container
	for(i=0;i<spotsNeeded;i++){
		let div = document.createElement('div')
		div.setAttribute('id', 'wpu'+i)
		div.setAttribute('class', 'job')
		div.addEventListener('drop', (event)=>{
			drop(event);
		})
		div.addEventListener('dragover', (event)=>{
			allowDrop(event);
		})
		wpuJobContainer.appendChild(div)
	}
 }

 //function to group same date schedulled items for glimpse
 function groupByKey(array, key) {
	return array
	  .reduce((hash, obj) => {
		if(obj[key] === undefined) return hash; 
		return Object.assign(hash, { [obj[key]]:( hash[obj[key]] || [] ).concat(obj)})
	  }, {})
 }

 //function to fill the scheduled glimpse section with scheduled jobs
function fillScheduleGlimpse(args){	
	arrScheduledStatus = new Array()
	let wrapper = document.getElementById('ucWrapper')
	let schJobContainer = document.getElementById('schJobContainer')
	let objCustomerNames = ipc.sendSync('get-customer-names')
	if(wrapper.hasChildNodes()){
		for(i=2;i<wrapper.childNodes.length;i++){
			wrapper.childNodes[i].remove()
		}
	}

	if(arrScheduledStatus.length>0){
		arrScheduledStatus=[]
	}
	wrapper.innerHTML=''
	for(member in args){
		(args[member].status == 'sch')? arrScheduledStatus.push(args[member]):'';
	}

	/**
	 * create job containers for view all
	 */
	
	let spotsNeeded = Math.ceil((arrScheduledStatus.length/5)+2)*5
	scheduledSpots = spotsNeeded
	if(schJobContainer.hasChildNodes()){
		
		while(schJobContainer.hasChildNodes()){
			schJobContainer.childNodes[0].remove()
		}
	}
	for(i=0;i<spotsNeeded;i++){
		let div = document.createElement('div')
		div.setAttribute('id', 'sch'+i)
		div.setAttribute('class', 'job')
		div.addEventListener('drop', (event)=>{
			drop(event);
		})
		div.addEventListener('dragover', (event)=>{
			allowDrop(event);
		})
		schJobContainer.appendChild(div)
	}


	
	/**
	 * set variable for sort function below
	 * direction: (1 ascending() (-1 descending)
	 * 
	 */
	let sortBy = [{
		prop:'date_scheduled',
		direction: 1
	  },{
		prop:'time_of_day',
		direction: 1
	  }];
	let x = arrScheduledStatus.sort(function(a,b){
		let i = 0, result = 0;
		while(i < sortBy.length && result === 0) {
		  result = sortBy[i].direction*(a[ sortBy[i].prop ].toString() < b[ sortBy[i].prop ].toString() ? -1 : (a[ sortBy[i].prop ].toString() > b[ sortBy[i].prop ].toString() ? 1 : 0));
		  i++;
		}
		return result;
	  })
	let arrSD = groupByKey(x,'date_scheduled')
	
	
	let k = Object.keys(arrSD)
	let v = Object.values(arrSD)
	
	
	let glimpse
	let head
	let tDate
	let data
	let glimpseID
	let glimpseContext
	
	for(j=0;j<k.length;j++){
		glimpse = document.createElement('div')
		glimpse.setAttribute('class', 'upcomingBox')
		
		
		head = document.createElement('div')
		let date = new Date(k[j])
		let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
		let day = days[date.getDay()]
		hText = document.createTextNode(day + ' '+k[j])
		head.setAttribute('class', 'glimpseHead')	
		head.appendChild(hText)
		glimpse.appendChild(head)
		for(i=0;i<v[j].length;i++){
			
			data = document.createElement('div')
			data.setAttribute('class', 'glimpseData')
			glimpseContext = document.createElement('div')
			glimpseContext.setAttribute('class', 'glimpse-context-menu')
			glimpseContext.setAttribute('id',`gc${v[j][i].job_ID}`)
			data.setAttribute('id', `gli${v[j][i].job_ID}`)
			let idj = v[j][i].job_ID
			data.addEventListener('contextmenu',(event)=>{
				event.stopPropagation()
				event.preventDefault()				
				createGlimpsePopUp(event)
			})
			let schedItem = document.createElement('div')
			schedItem.setAttribute('class', 'glimpseItem')
			let jobType = document.createElement('div')
			let color
			jobType.setAttribute('class', 'colorBlock')
			switch(v[j][i].job_type){
				case 'Spring':
					color = '#5e81ad';
					break;
				case 'Check All':
					color = '#ff9e0c';
					break;
				case 'Alignment':
					color = '#ad5ea8';
					break;
				case 'King Pin':
					color = '#5ead63';
					break;
				case 'Frame':
					color = '#ff2d00';
					break;
				default:
					break;
			}

			jobType.setAttribute('style','background-color:'+color)
			let n 
			let name = document.createElement('div')
			name.setAttribute('class','glimpseCustomer')
			
			let tJT = document.createTextNode(v[j][i].time_of_day);
			for(member in objCustomerNames){
				if(objCustomerNames[member].customer_ID == v[j][i].customer_ID){
					n=objCustomerNames[member].customer_name
					
				}
			}
			let tName = document.createTextNode(n.toUpperCase())
			
			jobType.appendChild(tJT)			
			schedItem.appendChild(jobType)
			name.appendChild(tName)
			schedItem.appendChild(name)
			data.appendChild(schedItem)
			glimpse.appendChild(data)
			glimpse.appendChild(glimpseContext)

			
			
			
			
		}
		
		wrapper.appendChild(glimpse)
		
	}
}


function createGlimpsePopUp(element){
	let e = element.currentTarget
	let rect = e.getBoundingClientRect()
	let jobID = e.id.substring(3)
	let objJobData = pullJob(jobID)
	let thisMenu = document.getElementById(`gc${e.id}`)
	
	
	for(member in allJobs){
		if(document.getElementById('gc'+allJobs[member].job_ID)){
			document.getElementById('gc'+allJobs[member].job_ID).style.display = 'none'
		}
		
	}
	
	

	let menuBox = document.getElementById('gc'+e.id.substring(3))
		
		
		let item1Box = document.createElement('span')
		let item2Box = document.createElement('span')
		let item3Box = document.createElement('span')
		let item4Box = document.createElement('span')
		let item1Text 
		let item2Text 
		let item3Text 
		let item4Text

		
		menuBox.style.display ='block'
		menuBox.style.top = rect.top;
		menuBox.innerHTML=""

		item1Text = document.createTextNode('EDIT')
			item1Box.appendChild(item1Text)
			item1Box.setAttribute('class','item')
			item1Box.setAttribute('id','edit'+e.id.substr(4))
			item1Box.addEventListener('click',(event)=>{
				menuBox.style.display = 'none'
				ipc.send('open-edit', objJobData, 'context-menu',currentUser)
			})

			item2Text = document.createTextNode('NO-SHOW')
			item2Box.appendChild(item2Text)
			item2Box.setAttribute('class','item')
			item2Box.setAttribute('id','noshow'+e.id.substr(4))
			item2Box.addEventListener('click',(event)=>{
				menuBox.style.display = 'none'
				objNoshow = new Object()
				objNoshow.job_ID = objJobData.job_ID
				objNoshow.no_show = 1
				objNoshow.active = 0
				ipc.send('update-job',objNoshow, 'context-menu', currentUser, ipc.sendSync('db-get-customer-name',objJobData.customer_ID))
				e.remove()
			})

			item3Text = document.createTextNode('SEND TO LOT')			
			item3Box.appendChild(item3Text)
			item3Box.setAttribute('class','item')
			item3Box.setAttribute('id','send'+e.id.substr(4))
			item3Box.addEventListener('click',(event)=>{
				menuBox.style.display = 'none'
				objLot = new Object()
				objLot.job_ID = objJobData.job_ID
				objLot.shop_location = ''
				objLot.status = 'wfw'
				objLot.designation = 'On the Lot'
				objLot.date_in = todayIs()
				ipc.send('update-job',objLot, 'context-menu', currentUser, ipc.sendSync('db-get-customer-name',objJobData.customer_ID))
				e.remove()
			})
			item4Text = document.createTextNode('CANCEL APPT')			
			item4Box.appendChild(item4Text)
			item4Box.setAttribute('class','item')
			item4Box.setAttribute('id','send'+e.id.substr(4))
			item4Box.addEventListener('click',(event)=>{
				menuBox.style.display = 'none'
				objCancel = new Object()
				objCancel.job_ID = objJobData.job_ID
				objCancel.cancelled = 1
				objCancel.active = 0
				ipc.send('update-job',objCancel, "context-menu",currentUser, ipc.sendSync('db-get-customer-name',objJobData.customer_ID))				
				e.remove()
			})
			menuBox.appendChild(item1Box)
			menuBox.appendChild(item2Box)
			menuBox.appendChild(item3Box)
			menuBox.appendChild(item4Box)

			$('.glimpse-context-menu').on('mouseleave',function() {
				$(this).fadeOut(250);
			});
			
			setTimeout(() => {
				
				if($(`.glimpse-context-menu:hover`).length == 0){
					$(`.glimpse-context-menu`).fadeOut(250);
				}
			}, 7000);
			document.onclick = function (ev){
				
				if(ev.target.id !== `gc${e.id}`){
					$(`.glimpse-context-menu`).fadeOut(250);
				}
			}
			
}

function countStatuses(){
	totalCount = 0
	scheduledCount = 0
	lotCount = 0
	completedCount = 0
	let shopCount = 0	
	
	for (let job in allJobs){ 
		if(allJobs[job].status != 'sch'){totalCount+=1} 		  
		if(allJobs[job].status == "wfw"){lotCount+=1}
		if(allJobs[job].status == "wip"){shopCount+=1}
		if(allJobs[job].status == "sch"){scheduledCount+=1}
		if(allJobs[job].status == "wpu"){completedCount+=1}
				
	}
	fillCountBoxes(lotCount, shopCount, scheduledCount, totalCount, completedCount)
}

function fillCountBoxes(lot,shop, scheduled, total, completed){
	
	document.getElementById('totCount').innerHTML = total
	document.getElementById('lotCount').innerHTML = lot
	document.getElementById('schCount').innerHTML = scheduled
	document.getElementById('shopCount').innerHTML = shop
	document.getElementById('completedCount').innerHTML = completed
	
}

function toggleAdminMenu() {
	let menuBox = document.getElementById('adminMenu')
	
	
	//destroy menu items
	if(menuBox.hasChildNodes()){
		while(menuBox.hasChildNodes()){
			menuBox.childNodes[0].remove()
		}
	}

	//create menu items
	
	let objMenuItems =
	[{
		'text': 'Users'
		// 'submenu': [{
		// 	text : 'Create User'
		// },
		// {
		// 	text : 'Delete User'
		// },
		// {
		// 	text : 'Change Passowrd'
		// }]
	},
	{
		'text': 'Reports'
		// 'submenu': [{
		// 	text : 'EOD'
		// },
		// {
		// 	text : 'No-Shows'
		// }]
	},{
		'text': 'Restore DB'
	}];
	let menuItem
	let menuText
	let subMenu
	let subMenuItem
	let subMenuItemText
	for(item in objMenuItems){
		menuItem = document.createElement('div')
		menuText = document.createTextNode(objMenuItems[item].text)
		menuItem.setAttribute('class','adminMenuItem')
		menuItem.setAttribute('id', 'adminMenuItem'+item)
		menuItem.appendChild(menuText)		
		
		if(objMenuItems[item].hasOwnProperty('submenu')){
			subMenu = document.createElement('div')
			subMenu.setAttribute('class',"adminMenu adminSubMenu")
			subMenu.setAttribute('id', 'adminMenuItem'+item+'subMenu')
			
			for(i in objMenuItems[item].submenu){
				subMenuItem = document.createElement('div')
				subMenuItemText = document.createTextNode(objMenuItems[item].submenu[i].text)
				subMenuItem.setAttribute('class', 'adminMenuItem')
				subMenuItem.setAttribute('id', 'adminMenuItem'+item+'subItem'+i)
				subMenuItem.appendChild(subMenuItemText)				
				subMenu.appendChild(subMenuItem)			
				
			}
			menuItem.appendChild(subMenu)
			
		}
		
		menuBox.appendChild(menuItem)


		document.onmouseover = function(ev){	
			ev.stopPropagation()		
			displaySubMenu(ev.target, ev.relatedTarget)
			
		}

		document.onclick = function(event){
			dosomething(event.target)
		}
	
		
	}
	
	menuBox.style.display = 'block'
	

	
}


function dosomething(e){
	
	let adminMenu = document.getElementById('adminMenu')
	let caller = document.getElementById(e.id)
	//alert(e.id)
	//is it an admin menu item
	if(adminMenu.contains(caller)){
		//does it have a submenu
		if(e.childNodes.length<2){
			
			adminMenu.style.display = 'none'

			//which menu item was clicked
			switch(e.innerHTML){
				case 'EOD':					
					openReports()
					break;
				case 'Restore DB':
					openRestore()
					break;
				case 'Users':					
					openCreateUser()
					break;
				case 'Reports':
					openReports()
				default:
					break;
			}
		}else{
			
		}
		
	}
	
}
function displaySubMenu(objCaller, pc){
	try{
	
	//variables
	
	let menuOpen =true
	let subMenuOpen = false
	let cID = objCaller.id
	let isParent
	let menuType
	let adminMenu = document.getElementById('adminMenu')
	let caller = (typeof(objCaller) === 'object')?document.getElementById(objCaller.id):null;
		
	let isMenu = adminMenu.contains(caller)
	if(isMenu){
		
		menuType = (typeof(caller.id)!= undefined)
			? (caller.id.includes('sub'))
				? 'sub'
				: 'top'
			:''

		 isParent = caller.childNodes.length>=2;
		
	
		//methods
		let showSubMenu = function() {	
				
			document.getElementById(cID+'subMenu').style.display = 'block'
			subMenuOpen = true
			
		}
		let closeSubMenu = function(){
			document.getElementById(cID+'subMenu').style.display = 'none'
			subMenuOpen = false
		}
		let closeMenu = function(){
			adminMenu.style.display = 'none'
			menuOpen = false
		}
		let setTimer = function(){

		}
		let menuHasHover = function(){
			let x = 0
			let hover

			if(menuType == 'sub'){
				//check submenu for hover
				for(i=0;i<caller.parentNode.childNodes.length; i++){
					x+= $(`#${caller.parentNode.childNodes[i].id}:hover`).length				
				}
				//check top menu for hover
				for(i=0;i<adminMenu.childNodes.length; i++){
					x+= $(`#${adminMenu.childNodes[i].id}:hover`).length
				}
			}else if(menuType =='top'){
				//check top menu for cover
				for(i=0;i<adminMenu.childNodes.length; i++){
					x+= $(`#${adminMenu.childNodes[i].id}:hover`).length
				}
			}

			
			hover = (x>0)?true: false;
			return hover;
		}


		//main process
		if(caller && isMenu){
			if(menuType == 'top'){
				if(isParent){
					showSubMenu()
					
				}
					setTimeout(() => {
						if(!menuHasHover()){
							closeMenu()
							
						}
					}, 50);
					$(`#${caller.id}`).mouseleave(function (){
						setTimeout(() => {
							if(!menuHasHover()){
							closeMenu()
							}else{
								if(subMenuOpen){
								closeSubMenu()
								}
							}
						},50);
					})
				
			}else if(menuType == 'sub'){
				setTimeout(() => {
					if(!menuHasHover()){
						if(subMenuOpen){
						closeSubMenu()
						}
						closeMenu()
						
					}
				}, 50);
				$(`#${caller.id}`).mouseleave(function (){
					setTimeout(() => {
						if(!menuHasHover()){
							if(subMenuOpen){
								closeSubMenu()
							}
						}
					},50);
				})
			}
		}//end main process
	}	
}catch(e){
	logError(e)
}
}



function allowDrop(ev) {
	ev.preventDefault();
	ev.stopPropagation();
	
}

function drag(ev) {
	try{
	//console.log(ev.target.id)
	//ev.currentTarget.firstChild.style.display = 'none';
	let img = new Image()
	img.src="../images/semi3.png"
	ev.dataTransfer.setData("Text", ev.target.id);
	ev.dataTransfer.setDragImage(img, 0, 0);
	
	document.getElementById(ev.currentTarget.childNodes[1].id).style.display = "none";
	document.getElementById('context-Menu-'+ev.currentTarget.id.substr(4))
	}catch(e){
		logError(e);
	}
}


function drop(ev) {
	try{
		ns = ev.target.id;
		let newStatus;
		
		let data = ev.dataTransfer.getData("Text");
		let id = data.substr(4)
		
		let oldStatus = document.getElementById(data).parentNode.id.substr(0, 3).toLowerCase(); 
		
		let newLocation 
		
		
		
		let cellOccupied = (document.getElementById(ev.target.id))?document.getElementById(ev.target.id).hasChildNodes():true;	
		
		ev.stopPropagation();
		ev.preventDefault();

		let thisJob
		
		
		let objMoving = new Object()
		
		if(cellOccupied){
			
			newStatus = ns.substring(0, 3).toLowerCase(); 
			
			if(newStatus == "wpu" || newStatus == "sch" || newStatus =="SCH"){
				
				objMoving.status = newStatus;
				
				if(newStatus=='sch' || newStatus=='SCH'){
					objMoving.designation = "Scheduled"
				}	
				
				for(member in allJobs){
					if(id == allJobs[member].job_ID){
						let getSpot = new Object()
						getSpot.job_type = allJobs[member].job_type
						getSpot.status = newStatus
						newLocation = findSpot(getSpot)
						objMoving.shop_location = newLocation
						objMoving.date_in = allJobs[member].date_in					
						objMoving.job_ID = id
						objMoving.customer_ID = allJobs[member].customer_ID
						

						
					}else{
						objMoving.date_in = null
						objMoving.job_ID = id
					}
				
				}
				
			}
		}
		else{
			newStatus = ns.substring(0, 3).toLowerCase();
			newLocation = ev.target.id
			objMoving.status = newStatus;
			objMoving.shop_location = newLocation
			objMoving.designation = 'On the Lot'
			
			document.getElementById(newLocation).appendChild(document.getElementById(data))
			

			// determine whether the job is being dragged from scheduled to on the lot
			// and set date_in accordingly. 
			if(oldStatus == 'sch' && newStatus != 'sch'){
				objMoving.date_in = todayIs()
			}else{
				for(member in allJobs){
					if(id == allJobs[member].job_ID){
						objMoving.date_in = allJobs[member].date_in
					}
				}
			}		
		
			
			
			objMoving.job_ID = id
			let custID
			for(member in allJobs){
				if(id == allJobs[member].job_ID){
					
					custID = allJobs[member].customer_ID
					
				}
			}
			document.getElementById(data).remove()
			let cn = ipc.sendSync('db-get-customer-name',custID)
			let editedJob = ipc.sendSync('edit-location-drop', objMoving, currentUser,cn)
			


			//determine whether new location is at bottom of page and reset
			//tooltip class accordingly		
			let t = document.getElementById(newLocation)
			
			let tt = t.firstChild?.childNodes[1]			
			let tooltip = (arrBottomHalf.includes(newLocation))?'tooltipLast': (arrShopLocations.includes(newLocation))?'tooltipRight':'tooltip'
			if(tt) tt.className = tooltip	
			
		//jquery function to bind the hover event to the created element
		$('.vehicle').on('mouseenter',function() {
			$(this).find('.tooltip').fadeIn(50);
		});
		
		$('.vehicle').on('mouseleave',function() {
			$(this).find('.tooltip').fadeOut(50);
		});
		$('.vehicle').on('mouseenter',function() {
			$(this).find('.toolTipBottom').fadeIn(50);
		});
		
		$('.vehicle').on('mouseleave',function() {
			$(this).find('.toolTipBottom').fadeOut(50);
		});
		$('.vehicle').on('mouseenter',function() {
			$(this).find('.tooltipLast').fadeIn(50);		
		});
		
		$('.vehicle').on('mouseleave',function() {
			$(this).find('.tooltipLast').fadeOut(50);
		});
		$('.vehicle').on('mouseenter',function() {
			$(this).find('.tooltipRight').fadeIn(50);
		});
		
		$('.vehicle').on('mouseleave',function() {
			$(this).find('.tooltipRight').fadeOut(50);
		});

		countStatuses();
		
		}
	}catch(e){
		logError(e)
	}
}





function deleteCompletedJobs(){
	try{
		let cc = document.getElementById('wpuJobContainer').childNodes.length
		for(i=0;i<cc;i++){
			if(document.getElementById('wpu'+i).hasChildNodes()){
				let id = document.getElementById('wpu'+i).childNodes[0].id.substr(4)			
				ipc.send('deactivate', id, currentUser)			
			}
			
		}
	}catch(e){
		logError(e)
	}
	
}

function deleteDrop(ev) {
	let deactivate = ev.dataTransfer.getData("Text").substr(4)
	let data = ev.dataTransfer.getData("Text");
	ipc.send('deactivate', deactivate, currentUser)	
}






function openBox(e,event) {
	
	var event = event;
	
	
		if (e.hasChildNodes)
			var count = 0;
		
		switch(e.id) {
			case "compBox":
				$(document).on('click', function(event) {
					if (!$(event.target).closest('#wpuBox').length && !$(event.target).closest('#compBox').length) {
					  document.getElementById('wpuBox').style.display = 'none'
					}
				  });
					
				switch(document.getElementById("wpuBox").style.display) {
					case "none":
					case "":
						document.getElementById("wpuBox").style.display = "block";

						break;
					case "block":
						if (!e.hasChildNodes()) {
							document.getElementById("wpuBox").style.display = "none";
						}
						break;
				}
				break;
			
			case "SCH":
				
				switch(document.getElementById("schBox").style.display) {
					case "none":
					case "":						
						break;
					case "block":						
						document.getElementById("calendar-container").style.display = "block";						
						break;
				}
				break;
			
			
				case "viewCal":

					

						switch(document.getElementById("calendar-container").style.display) {
							case "none":
							case "":							
								document.getElementById("calendar-container").style.display="block";	
								
								resetCalendar();
								setCalendarMonth();					
								break;
							case "block":
								document.getElementById("calendar-container").style.display = "none";
								break;
						}
						break;
				case "viewAll":

					$(document).on('click', function(event) {
						
						if (!$(event.target).closest('#schBox').length && event.target.id != 'viewAll') {
						  document.getElementById('schBox').style.display = 'none'
						}
					  });
						switch(document.getElementById("schBox").style.display) {
							case "none":
							case "":								
															
								document.getElementById("schBox").style.display="block";								
								break;
							case "block":
								document.getElementById("schBox").style.display = "none";
								break;
						}
						break;
				
			default:
				break;
		}
		
	

}

function closeBox(ev, e) {
	switch(e.parentNode.id) {
		case "wpuBoxHeader":
			document.getElementById("wpuBox").style.display = "none";
			break;
		case "wfpBoxHeader":
			document.getElementById("wfpBox").style.display = "none";
			break;
		case "schBoxHeader":
			document.getElementById("schBox").style.display = "none";
			break;
		case "posBoxHeader":
			document.getElementById("posBox").style.display = "none";
			break;
		case "npuBoxHeader":
			document.getElementById("npuBox").style.display = "none";
			break;
		case "reportFormWrapper":
			document.getElementById("reportFormWrapper").style.display = "none";
			document.getElementById("reportPrint").style.display = "none";
			document.body.style.opacity = "1";
		default:
			break;
	}


	ev.cancelBubble = true;
}







//function to place jobs in correct page locations
function placeElement(args){
	try{
		let placement = (args.shop_location != null && args.shop_location != '') ? makeJobDiv2(args) : findOpenSpace(args) 
		
		if(placement !=null) {
			try{
			document.getElementById(args.shop_location).innerHTML = placement
			}catch(e){
				console.log(e)
			}
		}
		if(args.cash_customer==1){document.getElementById('jica'+args.job_ID).style.display = 'inline-block'};
		if(args.waiting_customer===1){document.getElementById('jiw'+args.job_ID).style.display = 'inline-block'};
		if(args.parts_needed==1){document.getElementById('jip'+args.job_ID).style.display = 'inline-block'};
		if(args.approval_needed==1){document.getElementById('jia'+args.job_ID).style.display = 'inline-block'};
		if(args.comeback_customer==1){document.getElementById('jico'+args.job_ID).style.display = 'inline-block'};
		if(args.checked==1){document.getElementById('jich'+args.job_ID).style.display = 'inline-block'};
	}catch(e){
		logError(e)
	}
}

//function to find the first open space in column for newly created jobs
function findOpenSpace(args){
	try{
		let usedLocation = []
		for(member in allJobs){
			usedLocation.push(allJobs[member].shop_location)
		}
		
		let jt=args.job_type
		let js=args.status
		
		let newBucket = []
		let bucket = []
		let hasKids = true
		let springBucket = ["wfw0", "wfw1", "wfw2", "wfw3", "wfw4", "wfw5", "wfw6", "wfw7", "wfw8", "wfw9", "wfw10", "wfw11"];
		let checkallBucket = ["wfw12", "wfw13", "wfw14", "wfw15", "wfw16", "wfw17", "wfw18", "wfw19", "wfw20", "wfw21", "wfw22", "wfw23"];
		let alignmentBucket = ["wfw24", "wfw25", "wfw26", "wfw27", "wfw28", "wfw29", "wfw30", "wfw31", "wfw32", "wfw33", "wfw34", "wfw35"];
		let kingpinBucket = ["wfw36", "wfw37", "wfw38", "wfw39", "wfw40", "wfw41", "wfw42", "wfw43", "wfw44", "wfw45", "wfw46", "wfw47"];
		let frameBucket =["wfw48", "wfw49", "wfw50", "wfw51", "wfw52", "wfw53", "wfw54", "wfw55", "wfw56", "wfw57", "wfw58", "wfw59"];
		let wpuBucket = []
		let schBucket = []
		for(i=0;i<scheduledSpots;i++){
			schBucket.push(`sch${i}`)
		}
		for(i=0;i<wpuSpots;i++){
			wpuBucket.push(`wpu${i}`)
		}

		if(js != "sch" && js!= "wpu" && js != 'SCH'){
		newBucket = jt == "Spring" ? springBucket : (jt == "Alignment") ? alignmentBucket :(jt == "Frame") ? frameBucket : (jt=="King Pin") ? kingpinBucket : checkallBucket 
		}else{
			js == "sch" || js == "SCH" ? newBucket =schBucket : newBucket = wpuBucket
		}

		bucket = newBucket
		
		
		for(let i=0;i<bucket.length;i++){
			
			if(usedLocation.indexOf(bucket[i])<0){			
				args.shop_location = bucket[i]
				break;
			}		
			
		}
		
		ipc.send('edit-location',args)
		return makeJobDiv2(args)
	}catch(e){
		logError(e)
	}
}
function findSpot(args){
	try{
		let jt=args.job_type
		let js=args.status
		let spot	
		let newBucket = []
		let bucket = []
		let hasKids = true
		let springBucket = ["wfw0", "wfw1", "wfw2", "wfw3", "wfw4", "wfw5", "wfw6", "wfw7", "wfw8", "wfw9", "wfw10", "wfw11"];
		let checkallBucket = ["wfw12", "wfw13", "wfw14", "wfw15", "wfw16", "wfw17", "wfw18", "wfw19", "wfw20", "wfw21", "wfw22", "wfw23"];
		let alignmentBucket = ["wfw24", "wfw25", "wfw26", "wfw27", "wfw28", "wfw29", "wfw30", "wfw31", "wfw32", "wfw33", "wfw34", "wfw35"];
		let kingpinBucket = ["wfw36", "wfw37", "wfw38", "wfw39", "wfw40", "wfw41", "wfw42", "wfw43", "wfw44", "wfw45", "wfw46", "wfw47"];
		let frameBucket =["wfw48", "wfw49", "wfw50", "wfw51", "wfw52", "wfw53", "wfw54", "wfw55", "wfw56", "wfw57", "wfw58", "wfw59"];
		let wpuBucket =["wpu0","wpu1","wpu2","wpu3","wpu4","wpu5","wpu6","wpu7","wpu8","wpu9","wpu10","wpu11","wpu12","wpu13","wpu14","wpu15","wpu16","wpu17","wpu18","wpu19"];
		let schBucket =["sch0","sch1","sch2","sch3","sch4","sch5","sch6","sch7","sch8","sch9","sch10","sch11","sch12","sch13","sch14","sch15","sch16","sch17","sch18","sch19"];
		
		if(js != "sch" && js!= "wpu" && js != 'SCH'){
		newBucket = jt == "Spring" ? springBucket : (jt == "Alignment") ? alignmentBucket :(jt == "Frame") ? frameBucket : (jt=="King Pin") ? kingpinBucket : checkallBucket 
		}else{
			js == "sch" || js == "SCH" ? newBucket =schBucket : newBucket = wpuBucket
		}

		bucket = newBucket
		
		for(let i=0;i<bucket.length;i++){
			
			hasKids = document.getElementById(bucket[i]).hasChildNodes();
			if(!hasKids){
				
				spot = bucket[i];
				
				
				break;
				
			}

		}

		
		return spot
	}catch(e){
		logError(e)
	}
}

function makeJobDiv2(args){
	try{
		let str = args.job_type.replace(/\s+/g, '');
		let objContact
		let contactName 
		let contactItem
		let customerName

		
		
		//if contact provided
		if(args.number_ID != null && args.number_ID != '' && args.number_ID != 'null'){
			objContact = ipc.sendSync('db-get-contact-name','phone', args.number_ID )
			contactName = `${objContact?.first_name ?? ''} ${objContact?.last_name ?? ''}`
		}else if(args.email_ID != null && args.email_ID != ''){
			objContact = ipc.sendSync('db-get-contact-name','email', args.email_ID )
			contactName = `${objContact?.first_name ?? ''} ${objContact?.last_name ?? ''}`
		}else{
			contactName = 'No Contact'
		} 
								
		
		customerName = (args.customer_ID != null) ? ipc.sendSync('db-get-customer-name', args.customer_ID): 'no name'
		let cuN = '<b>'+customerName.toUpperCase()+'</b><br/>'
		let dIn =(args.date_in == null) ? '': '<b>Date In:</b>'+ args.date_in+'<br/>'
		let ec = (args.estimated_cost == undefined || args.estimated_cost =='') ? '': '<b>Est Cost:</b> $'+args.estimated_cost+'</br>'
		let u = (args.unit == null || args.unit == '')?'': '<b>Unit: </b>'+args.unit+'</br>'
		let sd = (args.date_scheduled != null) ? '<b>Sched. Date: </b>' +args.date_scheduled+' '+args.time_of_day+'<br/>': ''
		let dc = (args.date_called != null) ? `<b>Date Called: </b>` + args.date_called+'<br/>':''
		let toolTipClass = (arrBottomHalf.includes(args.shop_location))?'tooltipLast': (arrShopLocations.includes(args.shop_location))?'tooltipRight':'tooltip'
		
		let n = (args.notes != null) ? '<b>Notes: </b>'+args.notes+'</br>' : '' 
		let it = (typeof objContact != "undefined") 
			? (objContact.item.includes('@')) 
				? '<b>Email: </b>'+objContact.item + '</br>'
				: '<b>Phone: </b>'+objContact.item + '</br>'
			:'';
		
		let context = (arrShopLocations.includes(args.shop_location))?'context-Menu left':'context-Menu'
			
		const smallJobContainer = `<div class='vehicle' 
		oncontextmenu='createContextMenu(this, pullJob(${args.job_ID}));return false;' 
		id='drag${args.job_ID}' 
		draggable='true' 
		ondragstart='drag(event)'
		ondragover='allowDrop(event)'		
		ondrop='drop(event)'>
		
		<span class=${toolTipClass} 
		id='tt${args.job_ID}'>
		${cuN}
		<b>Job Type:</b> ${args.job_type}<br/>
		${dIn}
		${sd}
		${dc}
		${u}	
		<b>Contact:</b> ${contactName}</br>
		${it}
		${ec}
		${n}
		</span>
		<div id='context-Menu-${args.job_ID}' class='${context}'>
		
		</div>
		<div id = 'submenu-${args.job_ID}' class = 'context-submenu'>
		</div>
		<span class='info' 
		id='${args.job_ID}info'>
		<span class='mainJobCustomerName'>${customerName}</span><br/>
		<span class='unitNumber' id = 'jobIndicatorContainer${args.job_ID}'>
		
		<span id = 'jica${args.job_ID}' class='jobIndicator jobIndicatorCash'></span>
		<span id = 'jiw${args.job_ID}' class='jobIndicator jobIndicatorWaiting'></span>
		<span id = 'jip${args.job_ID}' class='jobIndicator jobIndicatorParts'></span>
		<span id = 'jia${args.job_ID}' class='jobIndicator jobIndicatorApproval'></span>
		<span id = 'jico${args.job_ID}' class='jobIndicator jobIndicatorComeback'></span>
		<span id = 'jich${args.job_ID}' class='jobIndicator jobIndicatorChecked'></span>
		</span></br>
		<span class='unitNumber' id = 'unitNumber'>Unit: ${args.unit}</span>
		<span class='notes'>${(args.notes!=null)?args.notes:""}</span>
		</span>
		<span class='jobCat jobCat${str}' 
		id='${args.job_ID}Cat'></span>
		</div>`;
		
		return smallJobContainer
	}catch(e){
		logError(e)
	}	

}








// function to clear jobs from On the Lot
function clearWFW() {	
	for ( i = 0; i < 60; i++) {
		document.getElementById('wfw' + i).innerHTML = "";
	}
}

//function to clear jobs from In the Shop
function clearWIP() {
	for ( i = 0; i < 12; i++) {
		document.getElementById('wip' + i).innerHTML = "";
	}
	
}

//function to clear jobs from Completed
function clearWPU() {
	let c = document.getElementById('wpuJobContainer').childNodes.length
	for ( i = 0; i < c; i++) {
		document.getElementById('wpu' + i).innerHTML = "";
	}
	
}

//function to clear jobs from scheduled section
function clearSCH() {
	let c = document.getElementById('schJobContainer').childNodes.length
	
	for ( i = 0; i < c; i++) {
		document.getElementById('sch' + i).innerHTML = "";
	}
}







function clearPage() {
	clearWFW();
	clearWIP();	
	clearWPU();	
	clearSCH();	
}

function refresh() {
	clearPage();
	ipc.send('reloadPage')
}



function toggleAdminElements(admin){
	if(admin){
		document.getElementById("btnAdmin").style.display = "inline-block";
		document.getElementById('t').style.display = 'inline-block';
		
	}else{
		document.getElementById("btnAdmin").style.display = "none";
		document.getElementById('t').style.display = 'none';		
	}
}



function todayIs() {
	const objDate = new Date();
	const day = objDate.getDate();
	const month = objDate.getMonth() + 1;
	const year = objDate.getFullYear();
	const today = month + "/" + day + "/" + year;
	return today;
}

//pull object with all individual job data from database by using job ID
function pullJob(id){
	let objJob = ipc.sendSync('pull-job',id)
	return objJob
}


function createContextMenu(e,objJobData,g) {
	try{
		let thisMenu = (g) ? document.getElementById(`gc${e.id}`) : document.getElementById('context-Menu-'+e.id.substr(4));	
		let status
		for(member in allJobs){
			if(document.getElementById('context-Menu-'+allJobs[member].job_ID)){
				document.getElementById('context-Menu-'+allJobs[member].job_ID).style.display = 'none'
			}
			if(allJobs[member].job_ID == e.id.substr(4)){			
				status = allJobs[member].status
			}
		}
		
			//create context menu
			let menuBox = document.getElementById('context-Menu-'+e.id.substr(4))
			
			
			let item1Box = document.createElement('span')
			let item2Box = document.createElement('span')
			let item3Box = document.createElement('span')
			let item4Box = document.createElement('span')
			let item1Text 
			let item2Text 
			let item3Text 
			let item4Text

			
			menuBox.style.display ='none'
			menuBox.innerHTML=""
			
			if(status=='sch'){
				item1Text = document.createTextNode('EDIT')
				item1Box.appendChild(item1Text)
				item1Box.setAttribute('class','item')
				item1Box.setAttribute('id','edit'+e.id.substr(4))
				item1Box.addEventListener('click',(event)=>{
					menuBox.style.display = 'none'
					document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
					ipc.send('open-edit', objJobData, 'context-menu',currentUser)
				})

				item2Text = document.createTextNode('NO-SHOW')
				item2Box.appendChild(item2Text)
				item2Box.setAttribute('class','item')
				item2Box.setAttribute('id','noshow'+e.id.substr(4))
				item2Box.addEventListener('click',(event)=>{
					menuBox.style.display = 'none'
					document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
					
					objNoshow = new Object()
					objNoshow.job_ID = objJobData.job_ID
					objNoshow.no_show = 1
					objNoshow.active = 0
					ipc.send('update-job',objNoshow, 'context-menu', currentUser, ipc.sendSync('db-get-customer-name',objJobData.customer_ID))
					e.remove()
				})

				item3Text = document.createTextNode('SEND TO LOT')			
				item3Box.appendChild(item3Text)
				item3Box.setAttribute('class','item')
				item3Box.setAttribute('id','send'+e.id.substr(4))
				item3Box.addEventListener('click',(event)=>{
					menuBox.style.display = 'none'
					document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
					
					objLot = new Object()
					objLot.job_ID = objJobData.job_ID
					objLot.shop_location = ''
					objLot.status = 'wfw'
					objLot.designation = 'On the Lot'
					objLot.date_in = todayIs()
					ipc.send('update-job',objLot, 'context-menu', currentUser, ipc.sendSync('db-get-customer-name',objJobData.customer_ID))
					e.remove()
				})
				item4Text = document.createTextNode('CANCEL APPT')			
				item4Box.appendChild(item4Text)
				item4Box.setAttribute('class','item')
				item4Box.setAttribute('id','send'+e.id.substr(4))
				item4Box.addEventListener('click',(event)=>{
					menuBox.style.display = 'none'
					document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
					objCancel = new Object()
					objCancel.job_ID = objJobData.job_ID
					objCancel.cancelled = 1
					objCancel.active = 0
					ipc.send('update-job',objCancel, "context-menu",currentUser, ipc.sendSync('db-get-customer-name',objJobData.customer_ID))
					e.remove()
				})
				menuBox.appendChild(item1Box)
				menuBox.appendChild(item2Box)
				menuBox.appendChild(item3Box)
				menuBox.appendChild(item4Box)

				$('.context-Menu').on('mouseleave',function() {
					$(this).fadeOut(500);
				});
				
				setTimeout(() => {
					
					if($(`.context-Menu:hover`).length == 0){
						$(`.context-Menu`).fadeOut(500);
					}
				}, 7000);
				// setTimeout(() => {
				// 	if($(`#context-Menu-${e.id.substr(4)}:hover`).length == 0){
				// 	menuBox.style.display = 'none'
				// 	document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
				// 	}
				// }, 7000);
				// $(`#context-Menu-${e.id.substr(4)}`).mouseleave(function (){
				// 	setTimeout(() => {
				// 		if($(`#context-Menu-${e.id.substr(4)}:hover`).length == 0){
				// 		menuBox.style.display = 'none'
				// 		document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
				// 		}
				// 	}, 7000);
				// })

			}else{
				item1Text = document.createTextNode('EDIT')
				item1Box.appendChild(item1Text)
				item1Box.setAttribute('class','item')
				item1Box.setAttribute('id','edit'+e.id.substr(4))
				item1Box.addEventListener('click',(event)=>{
					menuBox.style.display = 'none'
					document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
					ipc.send('open-edit', objJobData, 'context-menu',currentUser)
				})

				item2Text = document.createTextNode('CHECKED')
				item2Box.appendChild(item2Text)
				item2Box.setAttribute('class','item')
				item2Box.setAttribute('id','checked'+e.id.substr(4))
				item2Box.addEventListener('click',(event)=>{
					menuBox.style.display = 'none'
					document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
					let objChecked = new Object()
					
					objChecked.job_ID = objJobData.job_ID
					objChecked.checked = 1
					ipc.send('update-job', objChecked,'context-menu', currentUser, ipc.sendSync('db-get-customer-name',objJobData.customer_ID))
					
				})
				item3Text = document.createTextNode('SCHEDULE')
				item3Box.appendChild(item3Text)
				item3Box.setAttribute('class','item')
				item3Box.setAttribute('id','schedule'+e.id.substr(4))
				item3Box.addEventListener('click',(event)=>{
					document.getElementById(e.childNodes[1].id).style.display='none';
					event.target.parentNode.nextElementSibling.style.display = 'block'
					let sub_content = `<div class= 'popupHeader'>CONFIRM OR CHANGE SCHEDULED DATE</div><br/>
					<div class='popuprow'><label> Scheduled Date:&nbsp;&nbsp;</label>
					<input type="text" id="datepicker" class = "popup"></div>
					<br/>
					<div class='popuprow'>
						<div class= 'halfrow'>
							<label>AM</label>
							<input type='radio' id="radAM" tabindex='6'name='ampm2' value='am'>
							<label>PM</label>
							<input type='radio' id="radPM" tabindex='7' name='ampm2' value='pm'>
							
						</div>
						<div class='popupButton' onclick= 'moveToScheduled(this, ${false})' >MOVE</div><div class='popupButton' onclick='cancelScheduleAdd(this)'>CANCEL</div>
					</div>
						
						`
						event.target.parentNode.nextElementSibling.innerHTML = sub_content;
								
						for(member in allJobs){
							if (allJobs[member].job_ID == event.target.id.substr(8)){
								popupDate = (allJobs[member].date_scheduled) ? allJobs[member].date_scheduled : "";
								
								(allJobs[member].time_of_day == 'am')? document.getElementById('radAM').checked = true : document.getElementById('radAM').checked = false;
								(allJobs[member].time_of_day == 'pm')? document.getElementById('radPM').checked = true : document.getElementById('radPM').checked = false;
							}

						}	
						
						
						$('.popup').datepicker().datepicker('setDate', popupDate );
						$('#datepicker').datepicker({
							onSelect: function () {
								$('#datepicker').text(this.value);
							}
						});
						
					})
					item4Text = document.createTextNode('COMPLETED')			
					item4Box.appendChild(item4Text)
					item4Box.setAttribute('class','item')
					item4Box.setAttribute('id','send'+e.id.substr(4))
					item4Box.addEventListener('click',(event)=>{
						menuBox.style.display = 'none'
						document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
						
						let objCompleted = new Object()				
						objCompleted.job_ID = objJobData.job_ID					
						objCompleted.shop_location = ''
						objCompleted.status= 'wpu'
						console.table(objJobData)
						ipc.send('update-job', objCompleted,'context-menu',currentUser,ipc.sendSync('db-get-customer-name',objJobData.customer_ID))
						e.remove()
					})	
				
				menuBox.appendChild(item1Box)
				menuBox.appendChild(item2Box)
				menuBox.appendChild(item3Box)
				menuBox.appendChild(item4Box)
				
				$('.context-Menu').on('mouseleave',function() {
					$(this).fadeOut(250);
				});
				
				setTimeout(() => {
					
					if($(`.context-Menu:hover`).length == 0){
						$(`.context-Menu`).fadeOut(250);
					}
				}, 7000);
				// setTimeout(() => {
				// 	if($(`#context-Menu-${e.id.substr(4)}:hover`).length == 0){
				// 	menuBox.style.display = 'none'
				// 	document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
				// 	}
				// }, 7000);
				// $(`#context-Menu-${e.id.substr(4)}`).mouseleave(function (){
				// 	setTimeout(() => {
				// 		if($(`#context-Menu-${e.id.substr(4)}:hover`).length == 0){
				// 		menuBox.style.display = 'none'
				// 		document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
				// 		}
				// 	}, 7000);
				// })
			}
			
				
				
			
			
		
		
		
		
			//hide tooltip and menu
			document.getElementById(e.childNodes[1].id).style.visibility = "hidden";
			thisMenu.style.display = 'block'

			//hide if clicking outside of element
		document.onclick = function(ev){
			console.log('menuID '+thisMenu.id)
			console.log(ev.target.id)
			if(ev.target.id !== thisMenu.id && ev.target.parentNode.id !== thisMenu.id){	
				$(`.context-Menu`).fadeOut(250);
				if(document.getElementById(e.childNodes[1].id)!= null && document.getElementById(e.childNodes[1].id) != undefined){
						document.getElementById(e.childNodes[1].id).style.visibility = 'visible';
				}
			}
		};
	}catch(e){
		logError(e)
	}

}


function cancelScheduleAdd(el){
	el.parentNode.parentNode.style.display='none'
	document.getElementById('tt'+el.parentNode.parentNode.id.substr(8)).style.display='none';
	
	$(`#drag${el.parentNode.parentNode.id.substr(8)}`)
	.on('mouseenter', function(){		
		document.getElementById(`tt${this.id.substr(4)}`).style.display ='block'		
	})
	.on('mouseleave', function(){		
		document.getElementById(`tt${this.id.substr(4)}`).style.display ='none'		
	})

}
function moveToScheduled(e, drop){
	const radAM = document.getElementById('radAM')
	const radPM = document.getElementById('radPM')
	const d = new Object()
	d.job_ID = e.parentNode.parentNode.id.substr(8)
	d.status = 'sch'
	d.designation = 'Scheduled'
	if(drop == false){
		d.shop_location = ''
	}
	
	d.date_scheduled = $('.popup').datepicker().val();
	d.julian_date = jDate(d.date_scheduled);
	(radAM.checked) ? d.time_of_day = 'am' 
		: (radPM.checked) ? d.time_of_day = 'pm'
			: d.time_of_day = '';
	
	ipc.send('update-job', d, 'move')
	e.parentNode.parentNode.parentNode.remove()
}


function createOpenContent(){
	const content = new Splash(ipc.sendSync('get-version'))
	
	return content.getGreeting()

}
// function hideTT(event){
// 	event.stopPropagation()
// 	event.preventDefault()
// 	console.log(event.target.id)
// 	//event.target.firstChild.style.display ='none'
	
// }

//function to log errors to file
function logError(text){
	console.log(text)
	ipc.send('log-error',text)
}
