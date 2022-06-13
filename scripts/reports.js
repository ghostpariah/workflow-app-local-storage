
const electron = require('electron')
const ipcReport = electron.ipcRenderer


//page elements


let chosenJulian 
let chosenYear
let activity
let noshows
let history
let totalACH = 0


$(function(){
    $("#reportStartDate").datepicker({
        dateFormat : "m/d/yy"
    });
    $("#reportEndDate").datepicker({
        dateFormat : "m/d/yy"
    });
    $("#datepickerReport").datepicker({
        dateFormat : "m/d/yy"        
    }).datepicker("setDate", -1);
    console.log($('#datepickerReport').datepicker('getDate'))
    
})
function getYesterday(){
    const objDate = new Date();
	const day = objDate.getDate() - 1;
	const month = objDate.getMonth() + 1;
	const year = objDate.getFullYear();
	const today = month + "/" + day + "/" + year;
	return today; 
}
function todayIs() {

	const objDate = new Date();
	const day = objDate.getDate();
	const month = objDate.getMonth() + 1;
	const year = objDate.getFullYear();
	const today = month + "/" + day + "/" + year;
	return today;
}

const formatToCurrency = amount => {
    console.log(amount.replace(/[^0-9.\-]/g, ''))
    return "$" + Number(amount.replace(/[^0-9.\-]/g, '')).toFixed(2);//.replace(/\d(?=(\d{3})+\.)/g, "$&,");
  };
 

function loadModal(){
    //document.getElementById('datepickerReport').focus()
    const printPDFBtn = document.getElementById('btnReport')

printPDFBtn.addEventListener('click', function (event) {
    //clean page for printing
    document.getElementById('mainMenu').style.display = "none"
    document.getElementById('ribbon4').setAttribute('class', 'ribbon hidden')
    document.getElementById('searchResult').style.border = "none"

    //create monthly accumulative total line
    let box = document.getElementById("searchResult")
    let div = document.createElement('div')
    div.setAttribute('class', 'EODprintItem')
    let label = document.createElement('div')
    let labelText = document.createTextNode('Total:')
    label.appendChild(labelText)
    label.setAttribute('class','labelBox')
    let result = document.createElement('div')
    result.setAttribute('class','resultBox')

    

    
    //add city and director for total
    let c = document.getElementById('inpCity').value
    let d = document.getElementById('inpDirector').value

    let tot = Number(c.replace(/[^0-9.\-]/g, '')) + Number(d.replace(/[^0-9.\-]/g, ''))
        
    let t = document.createTextNode(`$${tot.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`)
    result.appendChild(t)
    div.appendChild(label)
    div.appendChild(result)
    div.style.fontWeight = 'bolder'
    box.appendChild(div)
       // console.log(t)
    ipcReport.send('print-to-pdf')
})
    $('#searchCriteria').on({
        keyup: function(event){
            search('activity')
           // console.log(this.value)
        }
    })
    $('#searchCriteriaNS').on({
        keyup: function(event){
            search('noshow')
           // console.log(this.value)
        }
    })
    $('#searchCriteriaHS').on({
        keyup: function(event){
            search('history')
           // console.log(this.value)
        }
    })
    $("#reportStartDate").click()    
    $("#reportStartDate").value = todayIs()
    $("#reportStartDate").text = todayIs();

    $("#reportEndDate").click()    
    $("#reportEndDate").value = todayIs()
    $("#reportEndDate").text = todayIs();

    $('#reportStartDate').on({
        'change': function (event) {
            let reportStartDate = document.getElementById('reportStartDate').value
            let reportResultBox = document.getElementById('reportResult')
            let chosenDate = setJulianDate(reportStartDate)
            let today = todayIs()
            if(chosenDate == today){
                activity = pullLog(today)
            }else{
                activity = pullLog(chosenDate)
            }  
            search('activity')          
            reportResultBox.innerHTML = (activity.length >0) ? activity.toString().replace(/\n/g, '<br/><br/>') : `No Activity On ${reportStartDate}`
            document.getElementById('activitySearch').style.display = 'block'            
        }
    });

    $('#datepickerReport').on({
        'change': function(event){
            createEODitem(this,'date')
            console.log("calendar changed")
        }
    });
}
function setJulianDate(ds){
       
    let dayScheduled = new Date(ds);
    let date = new Object()
    let today = new Date();
    date.today = false;
    today.setHours(0, 0, 0, 0);
    
    if(today.toString() === dayScheduled.toString()) date.today = true
    
    date.julian= Math.ceil((dayScheduled - new Date(dayScheduled.getFullYear(),0,0)) / 86400000);
    date.year = dayScheduled.getFullYear()
    return date;
}
function pullLog(date){
    return ipcReport.sendSync('pull-activity-log',date.year,date.julian, date.today)    
            
}
ipcReport.on('close-window', (event)=>{
    setTimeout(() => {
       // window.close()
    }, 500);
    
})
    



// function formatReport(a){
//     //fill array with chunks of report
//     let arr = a.split('\n')

//     console.log(arr[0])
//     console.log(filterItems(arr, ))
//     //reportResult.innerHTML = (activity.length >0) ? activity.toString().replace(/\n/g, '<br/><br/>') : `No Activity On ${reportStartDate}`
// }

function filterItems(a, query) {
    let arr = a.split('\n')
    return arr.filter(function(el) {
        //console.log("inside filter "+el.toLowerCase().indexOf(query.toLowerCase()))
      return el.toLowerCase().indexOf(query.toLowerCase()) !== -1
    })
  }


function makeVisible(block){
    document.getElementById('ribbon').setAttribute('class','ribbon visible')
    //console.log(block.getAttribute('class'))
}
function toggleVisibility(el){
    //reset elements
    document.getElementById('reportResult').innerHTML = ""
    document.getElementById('searchResult').innerHTML = ""

    let mainOpts = document.getElementsByClassName('mainOption')
    for(i=1;i<mainOpts.length+1;i++){
        if(mainOpts.id != 'ribbon5'){
        document.getElementById('option'+i).setAttribute('class','mainOption unchosen')
        document.getElementById('ribbon'+i).setAttribute('class','ribbon hidden')
        }else{

        }
    }

    const chosenOption = el.getAttribute('id').substring(6)
    const optionStatus = el.getAttribute('class').search('unchosen')
   
    let ribbon = document.getElementById('ribbon'+chosenOption)
    let ribClass = ribbon.getAttribute('class')
    let ribVisibility = ribClass.search('hidden');

    
    console.log("option status is "+optionStatus);
    (optionStatus<0) ? el.setAttribute('class','mainOption unchosen') : el.setAttribute('class', 'mainOption chosen');
    
    
    if(chosenOption==4){
        createEODitem($('#datepickerReport'),'date')
        $('#inpACH').focus()
    }
    if(chosenOption ==3){
        displayNoShows()
    }
    if(chosenOption == 5){
        (ribVisibility<0) ? ribbon.setAttribute('class','ribbon hidden') : ribbon.setAttribute('class','ribbon visible historyRibbon');
    }else{
    (ribVisibility<0) ? ribbon.setAttribute('class','ribbon hidden') : ribbon.setAttribute('class','ribbon visible');
    }
}
function search(searchType){
    
    let searchCriteria 
    let objSearch
    let searchData 
    let searchResultBox = document.getElementById('searchResult')

    document.getElementById('searchResult').innerHTML = ""
    
    if(searchType == 'activity'){        
        objSearch = activity
        searchCriteria = document.getElementById('searchCriteria')
    }
    if(searchType == 'noshow'){
        objSearch = noshows
        searchCriteria = document.getElementById('searchCriteriaNS')
        console.log("searchType is noshow")
    }
    if(searchType == 'history'){
        objSearch = history
        searchCriteria = document.getElementById('searchCriteriaHS')
        console.log("searchType is history")
        console.log(history)
    }
        searchData = (searchCriteria.value !== "") ? filterItems(objSearch,searchCriteria.value) : ""
        for (member in searchData) {
            searchResultBox.innerHTML += `${searchData[member]} </br><br/>`
        }
}

function createEODitem(el, item, count){
    console.log('beginning of createEODitem..item= '+item+"count= "+count)
    switch(item){
        case 'achWrapper1':

        break;
        default:
            break;
    }
    let alreadyExists = document.getElementById(item)
    if(item == "ach"){
        alreadyExists = document.getElementById(item+count)
    }
    console.log(alreadyExists)
    if(alreadyExists) {
         if(item != 'date' && item != 'from'){ 
             if(item=='ach'){
             $(`#${item+count} :nth-child(2)`).html(resetText(el,item+count, count)[0]) //resetText(el,item)
             $(`#${item+count} :nth-child(1)`).html(resetText(el,item+count,count)[1])
             }else{
                $(`#${item} :nth-child(2)`).html(resetText(el,item, count)) //resetText(el,item)
                   
             }
             return
         }
         return alreadyExists.innerHTML =resetText(el,item)
     }
        //grab box to place results in
        let box = document.getElementById("searchResult")

        //create report header
        let head = document.createElement("h1")
        head.setAttribute('id', item)
        
        //create report line
        let div = document.createElement("div")        
        div.setAttribute('class', 'EODprintItem')
        
        if(item == 'ach'){
            div.setAttribute('id', item+count)
            div.setAttribute('name','achLineItem')
        }else{
            div.setAttribute('id', item)
        }
        //create line label for left side of line item
        let label = document.createElement('div')
        label.setAttribute('class', 'labelBox')

        //create result container for right side of line item
        let result = document.createElement('div')
        result.setAttribute('class','resultBox')
        
        //create spacer for inbetween sections
        let spacer = document.createElement('div')
        spacer.setAttribute('class', 'spacer')

        //create section header
        let h3 = document.createElement('h3')

        let labelText
        let resultText
        let text
        let h3text
        
        console.log(`item before switch in createEOD is : ${item}` )
        switch(item){
            case 'date':
                
                text = document.createTextNode(`END OF DAY ${getYesterday($('#datepickerReport').datepicker('getDate'))}`)
                head.appendChild(text)
                box.appendChild(head)

                h3text=document.createTextNode('Income')
                h3.setAttribute('id', 'dailySalesH3')
                h3.appendChild(h3text)
                box.appendChild(h3)

            break;
            case 'ach':
                console.log(el.parentNode.childNodes[1].value)
                //text = document.createTextNode(`ACH: ${formatToCurrency(el.value)}`)
                labelText = document.createTextNode(`ACH from ${el.value}`)
                label.appendChild(labelText)
                resultText= document.createTextNode(`${formatToCurrency(el.parentNode.childNodes[1].value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`)
                result.appendChild(resultText)
                div.appendChild(label)
                div.appendChild(result)
                
                //div.appendChild(text)
                //box.appendChild(div)
                document.getElementById('dailySalesH3').insertAdjacentElement('afterend', div)

            break;
            case 'achWrapper2':
                console.log(el.parentNode.childNodes[1].value)
                //text = document.createTextNode(`ACH: ${formatToCurrency(el.value)}`)
                labelText = document.createTextNode(`ACH from  ${el.value}`)
                label.appendChild(labelText)
                resultText= document.createTextNode(`${formatToCurrency(el.parentNode.childNodes[1].value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`)
                result.appendChild(resultText)
                div.appendChild(label)
                div.appendChild(result)
                //div.appendChild(text)
                box.appendChild(div)

            break;
            case 'from':
                
                
                text = document.createTextNode(`  --From: ${el.value}`)
                div.appendChild(text)
                box.appendChild(div)
            
            break;
            case 'batch':
                labelText = document.createTextNode(`Batch:`)
                label.appendChild(labelText)
                resultText= document.createTextNode(`${formatToCurrency(el.value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`)
                result.appendChild(resultText)
                div.appendChild(label)
                div.appendChild(result)                
                box.appendChild(div)

                box.appendChild(spacer)

                h3text =document.createTextNode('Daily Sales')
                h3.appendChild(h3text)
                box.appendChild(h3)

            break;
            case 'city':
                labelText = document.createTextNode(`City of Columbus:`)
                label.appendChild(labelText)
                resultText= document.createTextNode(`${formatToCurrency(el.value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`)
                result.appendChild(resultText)
                div.appendChild(label)
                div.appendChild(result)                
                box.appendChild(div)

            break;
            case 'daily':
                labelText = document.createTextNode(`Invoiced:`)
                label.appendChild(labelText)
                resultText= document.createTextNode(`${formatToCurrency(el.value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`)
                result.appendChild(resultText)
                div.appendChild(label)
                div.appendChild(result)                
                box.appendChild(div)
                box.appendChild(spacer)

                h3text =document.createTextNode('Monthly Breakdown')
                h3.appendChild(h3text)
                box.appendChild(h3)
                

            break;
            case 'director':
                labelText = document.createTextNode(`Director Series:`)
                label.appendChild(labelText)
                resultText= document.createTextNode(`${formatToCurrency(el.value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`)
                result.appendChild(resultText)
                div.appendChild(label)
                div.appendChild(result)                
                box.appendChild(div)

                
                box.appendChild(spacer)

                h3text =document.createTextNode('Monthly Sales Total')
                h3.appendChild(h3text)
                box.appendChild(h3)

                

                

            break;
            default:
                break;
        }
        
        
        
    
}
function resetText(el, item, count){
    let result = "invalid input"
    let result2 = "invalid input"
    console.log('resetText count= '+item+count)
    switch(item){
        case 'date':
            result = `END OF DAY ${el.value}`
            
        break;
        case `ach${count}`:
            
            result =`${formatToCurrency(el.parentNode.childNodes[1].value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`  
            result2  = `ACH from ${el.value}` 
            console.log(`within resetText(). case statement =ach${count} result = ${result} result2 = ${result2}`) 
            return [result,result2]   

        break;
        
        case 'from':                
            result = `  --From: ${el.value}`
        break;
        case 'batch':
            result =`${formatToCurrency(el.value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`
        break;
        case 'city':
            result =`${formatToCurrency(el.value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`
        break;
        case 'daily':
            result =`${formatToCurrency(el.value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`
        break;
        case 'director':
            result =`${formatToCurrency(el.value).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`
        break;
        default:
            break;
    }
    return result
}
function createACHinputs(count){
    let achPayee
    let achAmount
    let spacer = document.createElement('div')
    spacer.setAttribute('class','spacer')
    spacer.setAttribute('id', `spacer${count}`)
    let wrapper = document.createElement('div')
    //make ach area visible
    achBox.setAttribute('class', 'visible')

    //create elements
    let labelAmount = document.createElement('label')
    labelAmount.setAttribute('class','achLabel')
    let inputAmount = document.createElement('input')
    inputAmount.setAttribute('class','achInput')
    inputAmount.setAttribute('id',`ia${count}`)
    let labelFrom = document.createElement('label')
    labelFrom.setAttribute('class','achLabel')
    let inputFrom = document.createElement('input')
    inputFrom.setAttribute('class','achInput')
    inputFrom.setAttribute('id',`if${count}`)
    inputFrom.addEventListener('blur', (event)=>{
        //determine if this is the first group. if there is a previous group then
        //this is not the first
        achPayee = document.getElementById(`if${count}`)
        achAmount = document.getElementById(`ia${count}`)
        let previous = document.getElementById(`if${count-1}`)
        let wrap = document.getElementById(`achWrapper${count}`)
        let achSpacer = document.getElementById(`spacer${count}`)
        let existingNextWrap = document.getElementById(`achWrapper${count+1}`)
        //increment counter for id value
        

        //verify that fields aren't empty. If they are then remove group
        console.log(`this is in the from field : ${achPayee.value}`)

        //check to see if previous grouping exists and if it is empty. 
        //If not empty create new grouping and add line to report
        
        //if(previous){
           if(achPayee.value ==""){
            if(!previous) document.getElementById('cbACH').checked = false
               wrap.remove()
               achSpacer.remove()
               return
           }else{
               //if there is an existing ach block after this with entered data then we are editing
               //so do not create a new ach block
                if(existingNextWrap) return createEODitem(achPayee, `ach`,count)
                    
                
           }
           
       
        totalACH+=1
        //add line to report
        createEODitem(achPayee, `ach`,count)
        createACHinputs(totalACH)
        
        console.log(totalACH)
    })
    let txtAmount = document.createTextNode('Amount:')
    let txtFrom = document.createTextNode('From:')

    //append elements to ach area
    labelAmount.appendChild(txtAmount)
    wrapper.appendChild(labelAmount)
    wrapper.appendChild(inputAmount)
    //achBox.appendChild(labelAmount)        
    //achBox.appendChild(inputAmount)

    labelFrom.appendChild(txtFrom)
    wrapper.appendChild(labelFrom)
    wrapper.appendChild(inputFrom)
    wrapper.setAttribute('id',`achWrapper${count}`)
    
    //achBox.appendChild(labelFrom)        
    //achBox.appendChild(inputFrom)
    achBox.appendChild(wrapper)
    achBox.appendChild(spacer)
    $(`#ia${count}`).focus()
}
function handleCheck(checkbox){
    
    let achBox = document.getElementById('achBox')
    achBox.innerHTML = ""

    if(checkbox.checked == true){
        achBox.setAttribute('class', 'visible')
        totalACH = 1
       createACHinputs(totalACH)
       
      }else{
        achBox.setAttribute('class','hidden')
        removeLineItems(document.getElementsByName('achLineItem'))
   }
}
function removeLineItems(list){
    let arr =[]
    console.log(list)
    console.log('length of nodelist is: '+list.length)
    for(i=list.length-1;i>=0;i--){
        console.log('i in for loop is ='+i)
        list[i].remove()
    }
    console.log(arr)

}

function displayNoShows(){
    //load no-show data
    let objNoshows = ipcReport.sendSync('get-no-shows')

    let resultBox = document.getElementById('reportResult')
    
    let strForDisplay=""
    let lineItems =""
    let strData =""
    //build report
    for(member in objNoshows){
        let name = ipcReport.sendSync('db-get-customer-name', objNoshows[member].customer_ID)
        console.log(objNoshows[member].number_ID)
        
        let phoneNumber = (objNoshows[member].number_ID != null && objNoshows[member].number_ID != undefined && objNoshows[member].number_ID != 'null')? ipcReport.sendSync('db-get-phone', objNoshows[member].number_ID):{'number' :'no number entered'}
        console.log('phone number'+phoneNumber)
        let objContact = (phoneNumber.p_contact_ID != null && phoneNumber.p_contact_ID != undefined)? ipcReport.sendSync('db-get-contact', phoneNumber.p_contact_ID):{'first_name' :'no first name','last_name':'no last name'}
        console.log(objContact.first_name)
        let strData = `${name} was a no show for a ${objNoshows[member].job_type} job scheduled for ${objNoshows[member].date_scheduled} set up by ${objContact.first_name} ${objContact.last_name} from [${phoneNumber.number}]`
        lineItems+= `${strData}\n`
        strForDisplay += `${strData}<br/><br/>`
       
    }
    resultBox.innerHTML = strForDisplay
    noshows = lineItems
    resultBox.style.display="block"
    

}

function displayHistory(result){
    let lineItem=""
    let strForDisplay =""
    for(i=0;i<result.length;i++){
        if(typeof result[i] === 'object'){
            let strData = `${ipcReport.sendSync('db-get-customer-name',result[i].customer_ID)} ${result[i].job_type} job on UNIT: ${result[i].unit} on ${result[i].date_in}   NOTES: ${result[i].notes}`
            lineItem+= `${strData}\n`
            strForDisplay += `${strData}<br/><br/>`
        }
    }
    history = lineItem
   document.getElementById('reportResult').innerHTML = strForDisplay
   document.getElementById('searchContainer').style.display = 'block'
}
function fillCustomerDataList(){
	let element = document.getElementById('lstCustomer');
	let arrCL = new Array()

	
	document.getElementById('lstCustomer').style.display="block";
		
	companyList ='';
	element.innerHTML=""
	customerList = ipcReport.sendSync('get-customer-names')
	
	
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
	$("#txtCustomerName").on({
		
		'keydown': function (event) {
			chosenCompanyID = null
			val = this.value;	
			
			if(event.keyCode == 13 || event.keyCode == 9) {			
				
					chosenCompany = val
					
					
					$('#txtContacts').focus()			
				
			}
		 },
		'keyup': function(){
			val = this.value;		
			
			if(val == "") {	
	
					
											
					
			}
		},
		'input' : function(){
			val = this.value;
			 if($('#lstCustomer option').filter(function(){
			 	return this.value.toUpperCase() === val.toUpperCase();        
			 }).length) {
				
				chosenCompany = val
				
				chosenCompanyID = ipcReport.sendSync('get-customer-ID', chosenCompany)
				let jobs = ipcReport.sendSync('get-jobs',chosenCompanyID)
				
                
                displayHistory(jobs)
				
			}
		},
		"blur": function(){			
			
			val = this.value;
			chosenCompany = val
			chosenCompanyID = ipcReport.sendSync('get-customer-ID', this.value)
			console.log('blur'+this.value+" "+chosenCompanyID)
			
		},
		"click": function(){
			
			this.value = ""
		}
		
	});
	
	
}