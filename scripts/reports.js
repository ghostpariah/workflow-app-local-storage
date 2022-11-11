
//const electron = require('electron')
//const ipc = electron.ipcRenderer


//page elements

let allJobs = ipc.sendSync('pull_jobs')

let chosenJulian 
let chosenYear
let activity
let noshows
let history
let totalACH = 0
let tabIndexes = 5
let valid = false
let changed = false
let noShowResultsForDisplay = ""
let currentUser
let pulledCustomers
// variable represents the state of EOD data
// can be create , or edit
// create is the default and used when creating report. 
// edit is used when a report has already been created for the day. The saved info will populate the fields
let state = 'create'
    
document.addEventListener('keydown', function(event)
{
  var code = event.keyCode || event.which;
  if (code === 9) { 
    console.log('active element is below') 
    console.log(document.activeElement)
    console.log(document.activeElement.tabIndex)
  }
  
});

$(function(){
    $("#reportStartDate").datepicker({
        beforeShowDay: $.datepicker.noWeekends,
        constrainInput: false,
        dateFormat : "mm/dd/yy", 
    });
    $("#reportEndDate").datepicker({
        dateFormat : "m/d/yy"
    });
    $("#datepickerReport").datepicker({
        beforeShowDay: $.datepicker.noWeekends,
        constrainInput: false,
        dateFormat : "mm/dd/yy",        
    }).datepicker("setDate", getYesterday());
    console.log($('#datepickerReport').datepicker('getDate'))
    console.log("yesterday was "+getYesterday())
})


ipc.on('refresh', (event)=>{
    pullNoShows()
        search('noshow')
        console.log('refresh triggered')
})
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }
function getYesterday(){
    const objDate = new Date();
    const todaysDay = objDate.getDate();
    const todaysMonth = objDate.getMonth() + 1;
    const todaysYear = objDate.getFullYear();
    let newYear = (todaysDay === 1 && todaysMonth === 1) ? true : false;
    let newMonth = (todaysDay === 1) ? true : false;
    
    //if today is the first day of a new year
    if(newYear){
        return `12/31/${todaysYear - 1}`
    }
    //if today is the first day of a new month but still the same year
    if(newMonth){
        return todaysMonth-1 + "/" + getDaysInMonth(todaysYear, todaysMonth-1) +"/" + todaysYear;
    }
	
    //if its not the first day of a new month
	let yesterday = `${todaysMonth}/${todaysDay -1}/${todaysYear}`;
    console.log('yesterday is '+yesterday)
	return yesterday; 
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
function getEODdata(){
    const inpBatch  = document.getElementById('inpBatch')
    const inpCity = document.getElementById('inpCity')
    const inpDaily  = document.getElementById('inpDaily')
    const inpDirector = document.getElementById('inpDirector')
    const cbACH = document.getElementById('cbACH')
    

    let data = ipc.sendSync('get-eod-data', getYesterday(), todayIs())
    console.log(data)
   //pull saved EOD data if it exists
   

   //load data into EOD form if there was data input already today
   if(data !== undefined){
        state = 'edit'
       //createEODitem($('#datepickerReport'),'date')
       inpBatch.value = data.batch
       createEODitem(inpBatch, 'batch')
       inpCity.value = data.city
       createEODitem(inpCity, 'city')
       inpDaily.value = data.daily
       createEODitem(inpDaily, 'daily')
       inpDirector.value = data.director
       createEODitem(inpDirector, 'director')

       if(data.achCount > 0){
           //cbACH.checked = true
           for(i=1;i<=data.achCount;i++){
               let f = data['ach'+i].customer
               let a = data['ach'+i].amount
               createACHinputs(i)
            //    setTimeout(() => {
                
            //    }, 50);
               
               document.getElementById('if'+i).value = f
               document.getElementById('ia'+i).value = a
               if(i == data.achCount){
                totalACH = i
                //toggleActionButton(document.getElementById(`action${i}`),true, data.achCount)
               }
               createEODitem(document.getElementById('if'+i), `ach`,i, a)
           }
           
           //handleCheck(cbACH)
       }
   }
} 
function hasInfo(element){
    let a = element.parentNode.childNodes[0].value
    let f = element.parentNode.childNodes[1].value
    
    if(a !== "" && f !== ""){
        return true
    }else{
        return false
    }
}
async function loadModal(){
    console.time('get-all-customers')
    pulledCustomers = await getAllCustomers()
    console.timeEnd('get-all-customers')
    console.time('pull no show')
    pullNoShows()
    
    console.timeEnd('pull no show')
    
    $('#option4').click()
    const achContainer = document.getElementById('achBox')
    
    const printPDFBtn = document.getElementById('btnReport')

    printPDFBtn.addEventListener('click', function (event) {
        //create object to store data for reuse when report is opened on the same day for reprint
        let eodInfo = new Object()
        eodInfo.today = todayIs()
        eodInfo.reportDate = document.getElementById('datepickerReport').value
        eodInfo.batch = inpBatch.value
        eodInfo.city = inpCity.value
        eodInfo.daily = inpDaily.value
        eodInfo.director = inpDirector.value
        
        
        //if there is ACH info
        if(totalACH>0){//if(cbACH.checked){
            //TODO: create array of ACH objects for the amount of ACH entered. each object contains amount and company name
            let achContainerCount = achContainer.childNodes.length
            let validCount = 0
            console.log('achCoutainerCount = '+achContainerCount)
            for(i=1;i<=achContainerCount;i++){
                if(hasInfo(document.getElementById(`action${i}`))){
                    validCount+=1
                    
                }
            }
            eodInfo.achCount = validCount
            eodInfo.ach = new Array()
            console.log(validCount)
            for( i=1;i<=validCount;i++){
                
                    console.log(document.getElementById(`ia${i}`).value)
                    console.log('before i='+i)
                    
                    eodInfo.ach[i-1] = {}
                    eodInfo.ach[i-1].amount = document.getElementById(`ia${i}`).value
                    console.log('after i='+i)
                    eodInfo.ach[i-1].customer = document.getElementById(`if${i}`).value
                
                    
                   
                
            }
            console.table(eodInfo)
        }else{
        //if no ach
        eodInfo.achCount = 0   
        }
        //clean page for printing
        document.getElementById('mainMenu').style.display = "none"
        document.getElementById('ribbon4').setAttribute('class', 'ribbon hidden')
        document.getElementById('searchResult').style.border = "none"
        document.getElementById('searchResult').style.backgroundColor = "#fff"
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

    

       
    ipc.send('print-to-pdf','eod',eodInfo)
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
            if(activity.length>0){
                let arrActivity = activity.split("\n")
                console.table(arrActivity) 
                for(i=0;i<arrActivity.length;i++){
                    let c = document.createElement('div')
                    c.setAttribute('class', 'resultItem')
                    let t = document.createTextNode(arrActivity[i])
                    c.appendChild(t)
                    reportResultBox.appendChild(c)
                }
            }
            //reportResultBox.innerHTML = (activity.length >0) ? activity.toString().replace(/\n/g, '<br/><br/>') : `No Activity On ${reportStartDate}`
                    
            //reportResultBox.innerHTML = (activity.length >0) ? activity.toString().replace(/\n/g, '<br/><br/>') : `No Activity On ${reportStartDate}`
            document.getElementById('activitySearch').style.display = 'block'            
        },
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
    });

    $('#datepickerReport').on({
        change: function(event){
            createEODitem(this,'date')
            console.log("calendar changed")
        },
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
    return ipc.sendSync('pull-activity-log',date.year,date.julian, date.today)    
            
}
ipc.on('close-window', (event)=>{
    setTimeout(() => {
       window.close()
    }, 500);
    
})
ipc.on('role',(event,role,companyID,user,companyName)=>{
    console.log('role: '+role, companyName)
    //if more args were sent then open specific report
    if(companyName){
        setTimeout(() => {
            document.getElementById('option3').click()
            document.getElementById('searchCriteriaNS').value = companyName//ipc.sendSync('db-get-customer-name',companyID)
            
            //trigger an 'enter' keypress
            var e = $.Event( "keyup", { keyCode: 13 } );       
            $('#searchCriteriaNS').trigger(e) 
        }, 100);
       
       
        

    }
    if(role =="user"){
        document.getElementById('option1').style.display = 'none';
        // document.getElementById('option2').style.display = 'none';
        document.getElementById('option4').style.display = 'none';
    }
    if(user){
        currentUser = user
    }
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
    
    
    if(chosenOption==2){
        // setTimeout(() => {
            
            (ribVisibility<0) ? ribbon.setAttribute('class','ribbon hidden') : ribbon.setAttribute('class','ribbon visible flexCenter');
            displayLotReport()
            // }, 300);
       
    }
    if(chosenOption==4){
        document.getElementById('achBox').innerHTML = ""
        createEODitem($('#datepickerReport'),'date')
        getEODdata()
        setTimeout(() => {
            $('#inpBatch').focus()
        }, 50);
        (ribVisibility<0) ? ribbon.setAttribute('class','ribbon hidden') : ribbon.setAttribute('class','ribbon visible');
    }
    if(chosenOption ==3){
        (ribVisibility<0) ? ribbon.setAttribute('class','ribbon hidden') : ribbon.setAttribute('class','ribbon visible');
        //pullNoShows()
        $('#searchCriteriaNS').focus()
        if(document.getElementById('searchCriteriaNS').value != ''){
            $('#searchCriteriaNS').change()  
            search('noshow')          
        }
    }
    if(chosenOption == 5){
        (ribVisibility<0) ? ribbon.setAttribute('class','ribbon hidden') : ribbon.setAttribute('class','ribbon visible historyRibbon');
        $('#txtCustomerName').focus()
        if(document.getElementById('txtCustomerName').value != ''){
            
            $('#txtCustomerName').change()  
            search('history')          
        }
    }else{
    //(ribVisibility<0) ? ribbon.setAttribute('class','ribbon hidden') : ribbon.setAttribute('class','ribbon visible');
    }
    if(chosenOption == 1){
        (ribVisibility<0) ? ribbon.setAttribute('class','ribbon hidden') : ribbon.setAttribute('class','ribbon flexBetween');
        if(document.getElementById('reportStartDate').value != ''){
            
            $('#reportStartDate').change()  

            search('activity')          
        }
    }
}
function search(searchType){
    
    let searchCriteria 
    let objSearch
    let searchData 
    let searchResultBox = document.getElementById('searchResult')
    let allResultsBox = document.getElementById('reportResult')
    

    document.getElementById('searchResult').innerHTML = ""
    allResultsBox.innerHTML = ""

    let h = document.createElement('h2')
    let t = document.createTextNode('Search Results')
    h.appendChild(t)
    //searchResultBox.appendChild(h)   
    
    if(searchType == 'activity'){        
        objSearch = activity
        searchCriteria = document.getElementById('searchCriteria')
    }
    if(searchType == 'noshow'){
        objSearch = noshows
        searchCriteria = document.getElementById('searchCriteriaNS')
        console.log("searchType is noshow")
       //console.table(objSearch)
    }
    if(searchType == 'history'){
        objSearch = history
        searchCriteria = document.getElementById('searchCriteriaHS')
        console.log("searchType is history")
        console.log(history)
    }
    searchData = (searchCriteria.value !== "") ? filterItems(objSearch,searchCriteria.value) : ""
    

    if(searchType == 'noshow'){
            for (member in searchData) {                
                createResultElement(searchData[member])
            }
        }else{
            

            for (member in searchData) {
                let c = document.createElement('div')
                c.setAttribute('class', 'resultItem')
                let t = document.createTextNode(searchData[member])
                c.appendChild(t)
                allResultsBox.appendChild(c)
                //searchResultBox.innerHTML += `${searchData[member]} </br><br/>`                
            }
    }
}
function createResultElement(data){
    let searchResultBox = document.getElementById('searchResult')
    let container = document.createElement('div')
    let reportData = document.createElement('div')
    let undo = document.createElement('input')
    let reportText = document.createTextNode(data)
    let t = data.substring(data.indexOf(':')+1)
    let id = t.slice(0,t.indexOf(' '))
    
    
    container.setAttribute('class', 'no-show-container')

    reportData.setAttribute('class','no-show-data')
    reportData.appendChild(reportText)

    undo.setAttribute('class', 'mediumButton')
    undo.setAttribute('type', 'button')
    undo.setAttribute('value', 'undo')
    undo.setAttribute('id', id)
    undo.addEventListener('click', (event)=>{
        let objChange = new Object()
        objChange.job_ID = event.target.id
        objChange.active = 1
        objChange.no_show = 0
        
        console.log(event.target.id)
        ipc.send('update-job',objChange, 'reports', currentUser,'null')
        pullNoShows()
        search('noshow')
    })

    container.appendChild(reportData)
    container.appendChild(undo)

    searchResultBox.appendChild(container)
}
function createEODitem(el, item, count,achAmount){
    console.log('beginning of createEODitem..item= '+item+"count= "+count)
   
    let alreadyExists = document.getElementById(item)
    if(item == "ach"){
        alreadyExists = document.getElementById(item+count)
    }
    console.log(alreadyExists)
    if(alreadyExists) {
         if(item != 'date' && item != 'from'){ 
             if(item=='ach'){
                console.log(resetText(el,item+count, count,achAmount))
             $(`#${item+count} :nth-child(2)`).html(resetText(el,item+count, count,achAmount)[0]) //resetText(el,item)
             $(`#${item+count} :nth-child(1)`).html(resetText(el,item+count,count,achAmount)[1])
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
                resultText= document.createTextNode(`${formatToCurrency(achAmount).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`) //el.parentNode.childNodes[1].value
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

function removeLineItem(line){
    if(line) line.remove()
    
}
function resetText(el, item, count,achAmount){
    let result = "invalid input"
    let result2 = "invalid input"
    console.log('resetText count= '+item+count)
    switch(item){
        case 'date':
            result = `END OF DAY ${el.value}`
            
        break;
        case `ach${count}`:
            
            result =`${formatToCurrency(achAmount).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")}`  
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
/**
 * function to toggle the ach input line action between '+' and '-'
 * depending on fields being valid or not and previous action
 * 
 */
function toggleActionButton(element, isValid, count){
    let inner = element.innerHTML
    let parent = element.parentNode
    
    if(isValid){
        console.log('valid')
        
        let addACH = document.createElement('div')
        addACH.setAttribute('class','addText')
        addACH.setAttribute('id', `action${count}`)
        let text = document.createTextNode('+')
        addACH.appendChild(text)
        
        addACH.setAttribute('tabindex',`${element.getAttribute('tabindex')}`)
        addACH.addEventListener('click', (event)=>{
            console.log(totalACH)
            totalACH+=1
            if(hasInfo(event.target)){
                createACHinputs(totalACH)
            }
            
        })
        
        element.remove()
        parent.appendChild(addACH)
        
    }else{
        console.log(inner)
       
            let delACH = document.createElement('div')
            delACH.setAttribute('class','addText')
            delACH.setAttribute('id', `action${count}`)
            let text = document.createTextNode('-')
            delACH.appendChild(text)
            
            delACH.setAttribute('tabindex',`${element.getAttribute('tabindex')}`)
            delACH.addEventListener('click', (event)=>{
                
                //totalACH-=1
                console.log('totalACH = '+totalACH)
                parent.remove()


                
    
                // if(document.getElementById('achBox').childNodes.length == 0){
                //     document.getElementById('cbACH').checked = false
                // }
                // totalACH = document.getElementById('achBox').childNodes.length
                totalACH-=1
                //save ach input data and then recreate after deleted item removed
                let tempACHes = document.getElementById('achBox').childNodes
                for(member in tempACHes){
                    let f = tempACHes[member].childNodes[1].value
                    let a = tempACHes[member].childNodes[1].value
                    createACHinputs(i)
                 //    setTimeout(() => {
                     
                 //    }, 50);
                    
                    document.getElementById('if'+i).value = f
                    document.getElementById('ia'+i).value = a
                    if(i == data.achCount){
                     totalACH = i
                     //toggleActionButton(document.getElementById(`action${i}`),true, data.achCount)
                    }
                    createEODitem(document.getElementById('if'+i), `ach`,i, a)
                }

                console.log(totalACH)
            })
            element.remove()
            parent.appendChild(delACH)
        
    }
    
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
    if(state == 'edit'){

    }
    //create elements
    let labelAmount = document.createElement('label')
    labelAmount.setAttribute('class','achLabel')
    let inputAmount = document.createElement('input')
    inputAmount.setAttribute('class','smallInput')
    tabIndexes+=1
    inputAmount.setAttribute('tabindex',`${tabIndexes}`)
    inputAmount.addEventListener('keyup', (event)=>{
        let inner = event.target.nextSibling.nextSibling.innerHTML
        valid = hasInfo(event.target)
        let c = event.target.parentNode.id.substring(10)
        achAmount = event.target.parentNode.childNodes[0].value //document.getElementById(`ia${count}`).value
        achPayee = event.target.parentNode.childNodes[1]//document.getElementById(`if${count}`)
        
        if(valid){
            console.log('achAmount = '+achAmount+' and achPayee = '+achPayee)
            createEODitem(achPayee, `ach`,c, achAmount)
        }else{
            //delete line item
            removeLineItem(document.getElementById(`ach${c}`))
        }

        if( valid && inner == '-'){
            //toggleActionButton(event.target.nextSibling.nextSibling, valid, count)
            
        }else{
            if(inner == '+'){
                //toggleActionButton(event.target.nextSibling.nextSibling, valid, count)
            }
        }
    })
    
    inputAmount.setAttribute('id',`ia${count}`)
    inputAmount.setAttribute('placeholder','amount')
    // inputAmount.setAttribute('pattern','[0-9]{1,}')
    let labelFrom = document.createElement('label')
    labelFrom.setAttribute('class','achLabel')
    let inputFrom = document.createElement('input')
    inputFrom.setAttribute('class','smallInput')
    inputFrom.setAttribute('id',`if${count}`)
    inputFrom.setAttribute('placeholder','company')
    tabIndexes+=1
    inputFrom.setAttribute('tabindex',`${tabIndexes}`)
    inputFrom.addEventListener('keyup', (event)=>{
        let inner = event.target.nextSibling.innerHTML
        valid = hasInfo(event.target)
        let c = event.target.parentNode.id.substring(10)
        achAmount = event.target.parentNode.childNodes[0].value //document.getElementById(`ia${count}`).value
        achPayee = event.target.parentNode.childNodes[1]//document.getElementById(`if${count}`)
        
        if(valid){
            createEODitem(achPayee, `ach`,c, achAmount)
        }else{
            //delete line item
            removeLineItem(document.getElementById(`ach${c}`))
        }
        
        if( valid && inner == '-'){
            //toggleActionButton(event.target.nextSibling, valid, count)
            
            
            
        }else{
            if(inner == '+'){
                //toggleActionButton(event.target.nextSibling, valid, count)
            }
        }
    })
    // inputFrom.addEventListener('blur', (event)=>{
    //     //determine if this is the first group. if there is a previous group then
    //     //this is not the first
    //     achPayee = document.getElementById(`if${count}`)
    //     achAmount = document.getElementById(`ia${count}`).value
    //     let previous = document.getElementById(`if${count-1}`)
    //     let wrap = document.getElementById(`achWrapper${count}`)
    //     let achSpacer = document.getElementById(`spacer${count}`)
    //     let existingNextWrap = document.getElementById(`achWrapper${count+1}`)
    //     //increment counter for id value
        

    //     //verify that fields aren't empty. If they are then remove group
    //     console.log(`this is in the from field : ${achPayee.value}`)

    //     //check to see if previous grouping exists and if it is empty. 
    //     //If not empty create new grouping and add line to report
        
    //     //if(previous){
    //        if(achPayee.value ==""){
    //         if(!previous) document.getElementById('cbACH').checked = false
    //            wrap.remove()
    //            //achSpacer.remove()
    //            return
    //        }else{
    //            //if there is an existing ach block after this with entered data then we are editing
    //            //so do not create a new ach block
    //             if(existingNextWrap) return createEODitem(achPayee, `ach`,count, achAmount)
                    
                
    //        }
           
       
    //     totalACH+=1
    //     //add line to report
    //     createEODitem(achPayee, `ach`,count, achAmount)

    //     createACHinputs(totalACH)
        
    //     console.log(totalACH)
    // })
    let txtAmount = document.createTextNode('Amount:')
    let txtFrom = document.createTextNode('From:')

    //append elements to ach area
    labelAmount.appendChild(txtAmount)
    //wrapper.appendChild(labelAmount)
    wrapper.appendChild(inputAmount)
    //achBox.appendChild(labelAmount)        
    //achBox.appendChild(inputAmount)

    labelFrom.appendChild(txtFrom)
    //wrapper.appendChild(labelFrom)
    wrapper.appendChild(inputFrom)
    wrapper.setAttribute('id',`achWrapper${count}`)
    wrapper.setAttribute('class','achWrapper')
    

    let addACH = document.createElement('div')
    addACH.setAttribute('class','plusButton minus')
    addACH.setAttribute('id', `action${count}`)
    tabIndexes+=1
    addACH.setAttribute('tabindex',`${tabIndexes}`)

    //change tabindex of submit button and date field
    tabIndexes+=1
    document.getElementById('btnReport').tabIndex = tabIndexes
    tabIndexes+=1
    document.getElementById('datepickerReport').tabIndex = tabIndexes
    
    addACH.addEventListener('click', (event)=>{
        //console.log(totalACH)
        let previous = document.getElementById(`achWrapper${totalACH}`)
       // console.log(previous)
       console.log('totalACH = '+totalACH)
       

       //before removig the inputs from the page find out if 
       //the id is less than the total ach recreate all ACH to get id's back in numerical order
       let which = event.target.parentNode.id.substring(10)
       console.log('which= '+which)
       
        event.target.parentNode.remove()

        
        totalACH-=1
        console.log('totalACH = '+totalACH)
        
        //totalACH-=1
        removeLineItem(document.getElementById(`ach${which}`))
        
        //save ach input data and then recreate after deleted item removed
        let ACHboxes = document.getElementById('achBox').childNodes
        console.log(ACHboxes.length)
        let arrACH = Array.from(ACHboxes)
        let achComponents
        console.log(arrACH)
        for(member in arrACH){
           // let f = tempACHes[member].childNodes[1].value
            //let a = tempACHes[member].childNodes[1].value
            //createACHinputs(i)
            let eID = arrACH[member].id.substring(10)
            console.log(member)
            arrACH[member].setAttribute('id',`achWrapper${Number(member)+1}`)
            arrACH[member].childNodes[0].setAttribute('id',`ia${Number(member)+1}`)
            arrACH[member].childNodes[1].setAttribute('id',`if${Number(member)+1}`)
            arrACH[member].childNodes[2].setAttribute('id',`action${Number(member)+1}`)
            if(document.getElementById(`ach${eID}`)){
            document.getElementById(`ach${eID}`).setAttribute('id',`ach${Number(member)+1}`)
            }
            achComponents = ACHboxes[member].childNodes
            
            // document.getElementById('if'+i).value = f
            // document.getElementById('ia'+i).value = a
            // if(i == data.achCount){
            //  totalACH = i
            //  //toggleActionButton(document.getElementById(`action${i}`),true, data.achCount)
            // }
            // createEODitem(document.getElementById('if'+i), `ach`,i, a)
            console.log(achComponents[0].value)
        }
        //removeLineItem(document.getElementById(`ach${count}`))
        // if(document.getElementById('achBox').childNodes.length == 0){
        //     document.getElementById('cbACH').checked = false
        // }
        // totalACH+=1
        // if(hasInfo(event.target)){
        //     createACHinputs(totalACH)
        // }
    })

    let addText = document.createTextNode('-')
    addACH.appendChild(addText)
    //achBox.appendChild(labelFrom)        
    //achBox.appendChild(inputFrom)
    wrapper.appendChild(addACH)
    achBox.appendChild(wrapper)
    //achBox.appendChild(spacer)
    inputAmount.focus()
    //$(`#ia${count}`).focus()
}

function handleCheck(checkbox){
    
    let achBox = document.getElementById('achBox')
    //achBox.innerHTML = ""

    //if(checkbox.checked == true){
        achBox.setAttribute('class', 'visible')
        totalACH+=1
       createACHinputs(totalACH)
       
//       }else{
//         achBox.setAttribute('class','hidden')
//         removeLineItems(document.getElementsByName('achLineItem'))
//    }
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
function printLotReport(){
    
}
function displayLotReport(){
    let onTheLot = new Array()
    let inTheShop = new Array()
    let completed = new Array()
    let scheduled = new Array()
    for(var member in allJobs){
        switch(allJobs[member].status){
            case 'wfw':
                onTheLot.push(allJobs[member]);
                
                break;
            case 'wpu':
                onTheLot.push(allJobs[member]);
                break;
            case 'wip':
                inTheShop.push(allJobs[member]);
                break;
            case 'pen':
                onTheLot.push(allJobs[member])
                break;
            default:
                scheduled.push(allJobs[member])
                break;

        }
        
    }
    //box to append report
    let displayBox = document.getElementById('searchResult')


    //create report header
    let header = document.createElement('header')
    let headerText = document.createTextNode(`Lot Report ${todayIs()}`)
    header.appendChild(headerText)
    header.setAttribute('class','mainLotReportHeader')

    //create report body
    let reportBody = document.createElement('section')
    reportBody.setAttribute('class','reportBody')

    //create shop section
    let shopSection = document.createElement('section')
    shopSection.setAttribute('class','reportSection')

    //create shop header
    let shopHeader = document.createElement('div')
    let shopHeaderText = document.createTextNode('In the Shop')
    shopHeader.setAttribute('class','sectionHeader')
    shopHeader.appendChild(shopHeaderText)    

    //create lot section
    let lotSection = document.createElement('section')
    lotSection.setAttribute('class','reportSection')

    //create lot header
    let lotHeader = document.createElement('div')
    let lotHeaderText = document.createTextNode('On the Lot')
    lotHeader.setAttribute('class','sectionHeader')
    lotHeader.appendChild(lotHeaderText)


    


    //asemble pieces
    //--header
    displayBox.appendChild(header)

    //--shop
    shopSection.appendChild(shopHeader)

    
    //----append line item to section
    for(var member in inTheShop){
        //----create report line items
        let lineItem = document.createElement('div')
        lineItem.setAttribute('class','lineItem')

        //--check box
        let checkbox = document.createElement('div')
        checkbox.setAttribute('class','checkbox')
        lineItem.appendChild(checkbox)

        //--company name
        let company = document.createElement('div')
        let companyText = document.createTextNode(ipc.sendSync('db-get-customer-name',inTheShop[member].customer_ID))
        company.setAttribute('class','lineItemCompany')
        company.appendChild(companyText)
        lineItem.appendChild(company)

        //--unit
        let unit = document.createElement('div')
        let unitText = document.createTextNode(`Unit: ${inTheShop[member].unit}`)
        unit.setAttribute('class', 'lineItemSection')
        unit.appendChild(unitText)
        lineItem.appendChild(unit)

        //--unit type
        let unitType = document.createElement('div')
        let unitTypeText = document.createTextNode(`Unit Type: ${(inTheShop[member].unit_type) ? inTheShop[member].unit_type : ''}`) 
        unitType.setAttribute('class', 'lineItemSection')
        unitType.appendChild(unitTypeText)
        lineItem.appendChild(unitType)


        //--job type
        let jobType = document.createElement('div')
        let jobTypeText = document.createTextNode(`Job Type: ${inTheShop[member].job_type}`)
        jobType.appendChild(jobTypeText)
        lineItem.appendChild(jobType)

        shopSection.appendChild(lineItem)
    }

    //append section to report
    displayBox.appendChild(shopSection)

    //--lot
    lotSection.appendChild(lotHeader)

    
    //----append line item to section
    for(var member in onTheLot){
        //----create report line items
        let lineItem = document.createElement('div')
        lineItem.setAttribute('class','lineItem')

        //--check box
        let checkbox = document.createElement('div')
        checkbox.setAttribute('class','checkbox')
        lineItem.appendChild(checkbox)

        //--company name
        let company = document.createElement('div')
        let companyText = document.createTextNode(ipc.sendSync('db-get-customer-name',onTheLot[member].customer_ID))
        company.setAttribute('class','lineItemCompany')
        company.appendChild(companyText)
        lineItem.appendChild(company)

        //--unit
        let unit = document.createElement('div')
        let unitText = document.createTextNode(`Unit: ${onTheLot[member].unit}`)
        unit.setAttribute('class', 'lineItemSection')
        unit.appendChild(unitText)
        lineItem.appendChild(unit)

        //--unit type
        let unitType = document.createElement('div')
        let unitTypeText = document.createTextNode(`Unit Type: ${(onTheLot[member].unit_type) ? onTheLot[member].unit_type : ''}`) 
        unitType.setAttribute('class', 'lineItemSection')
        unitType.appendChild(unitTypeText)
        lineItem.appendChild(unitType)

        //--job type
        let jobType = document.createElement('div')
        let jobTypeText = document.createTextNode(`Job Type: ${onTheLot[member].job_type}`)
        jobType.appendChild(jobTypeText)
        lineItem.appendChild(jobType)

        lotSection.appendChild(lineItem)
    }

    //append section to report
    displayBox.appendChild(lotSection)
    
    //register event for button click
    const printPDFBtn = document.getElementById('printLot')

    printPDFBtn.addEventListener('click', function (event) {
        //clean page for printing
        document.getElementById('mainMenu').style.display = "none"
        document.getElementById('ribbon2').setAttribute('class', 'ribbon hidden')
        document.getElementById('searchResult').style.border = "none"
        document.getElementById('searchResult').style.backgroundColor = "white"

        //verify that there are no ach even if inputs created and empty then uncheck ACH if checked
        
        ipc.send('print-to-pdf', 'lot')
    })

    


    console.log(`OnTheLot: ${onTheLot.length} In the Shop: ${inTheShop.length} Completed: ${completed.length} Sch: ${scheduled.length}`)
}
function displayNoShows(){
    document.getElementById('reportResult').innerHTML = noShowResultsForDisplay

    //create line items for report
}
async function getAllPhoneNumbers(){
    //pulledNumbers = 
}
async function getAllCustomers(){
    return ipc.sendSync('db-get-all-customers')
}
async function pullNoShows(){
    //load no-show data
    console.time('noshow')
    let objNoshows = ipc.sendSync('get-no-shows')
    console.timeEnd('noshow')
    setTimeout(() => {
        console.table(pulledCustomers)
    }, 100);
    
    //let objCustomers = ipc.sendSync('get-customer-names')
    //let objContacts = 
    let resultBox = document.getElementById('reportResult')
    
    let strForDisplay=""
    let lineItems =""
    let strData =""
    let arrData = new Array()
    //build report
    console.time('no-show-forLoop')
    for(member in objNoshows){
       // console.time('db-get-customer-name')
        let name = ipc.sendSync('db-get-customer-name', objNoshows[member].customer_ID)
       // console.timeEnd('db-get-customer-name')
        
        let phoneNumber = (objNoshows[member].number_ID != null && objNoshows[member].number_ID != undefined && objNoshows[member].number_ID != 'null')? ipc.sendSync('db-get-phone', objNoshows[member].number_ID):{'number' :'no number entered'}
       // console.log('phone number'+phoneNumber)
        let objContact = (phoneNumber.p_contact_ID != null && phoneNumber.p_contact_ID != undefined)? ipc.sendSync('db-get-contact', phoneNumber.p_contact_ID):{}//{'first_name' :'no first name','last_name':'no last name'}
        //console.log(objContact.first_name)
        let fn = (objContact.first_name) ? objContact.first_name : ''
        let ln = (objContact.last_name) ? objContact.last_name : ''
        let strData = `${name} was a no show for a ${objNoshows[member].job_type} job ID:${objNoshows[member].job_ID} scheduled for ${objNoshows[member].date_scheduled} ${(objContact.first_name || objContact.last_name) ? 'set up by' : ''} ${fn} ${ln} on ${objNoshows[member].date_called} from phone number [${phoneNumber.number}]`
        arrData.push(strData)
        lineItems = `${strData}\n` + lineItems
        //strForDisplay += `${strData}<br/><br/>`
       
    }
    console.timeEnd('no-show-forLoop')
    for(i=arrData.length-1;i>=0;i--){

        strForDisplay+= `<p>${arrData[i]}</p>`
    }
    
    noShowResultsForDisplay = strForDisplay
    //resultBox.innerHTML = strForDisplay
    noshows = lineItems
    resultBox.style.display="flex"
    

}

function displayHistory(result){
    let lineItem=""
    let strForDisplay =""
    for(i=0;i<result.length;i++){
        if(typeof result[i] === 'object'){
            let strData = `${ipc.sendSync('db-get-customer-name',result[i].customer_ID)} ${result[i].job_type} job on UNIT: ${result[i].unit} on ${result[i].date_in}   NOTES: ${result[i].notes}`
            strData += (result[i].no_show)? `  <<<NO SHOW on ${result[i].date_scheduled}>>>`: ''
            lineItem+= `${strData}\n`
            strForDisplay += `${strData}<br/><br/>`

            let c = document.createElement('div')
                c.setAttribute('class', 'resultItem')
                let t = document.createTextNode(strData)
                c.appendChild(t)
                document.getElementById('reportResult').appendChild(c)
        }
    }
    history = lineItem
   //document.getElementById('reportResult').innerHTML = strForDisplay
   document.getElementById('searchContainer').style.display = 'flex'
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
				
				chosenCompanyID = ipc.sendSync('get-customer-ID', chosenCompany)
				let jobs = ipc.sendSync('get-jobs',chosenCompanyID)
				
                console.log('input triggered')
                document.getElementById('reportResult').innerHTML = ''
                displayHistory(jobs)
				
			}
		},
		"blur": function(){			
			
			val = this.value;
			chosenCompany = val
			chosenCompanyID = ipc.sendSync('get-customer-ID', this.value)
			console.log('blur'+this.value+" "+chosenCompanyID)
			
		},
		"click": function(){
			
			this.value = ""
		}
		
	});
	
	
}