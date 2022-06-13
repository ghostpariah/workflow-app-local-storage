const calElectron = require('electron')
const calIPC = calElectron.ipcRenderer
const date = new Date();
let allJobs
let scheduledJobs
let year = date.getFullYear();
let Holidays = require('date-holidays')
let hd = new Holidays()
hd.init('US','oh')

var d = new Date();
var month_name=['January','February','March','April','May','June','July','August','September','October','November','December'];
var monthIndex = d.getMonth();// 0-11
var thisYear = d.getFullYear();// xxxx
var today = d.getDate();
var thisMonth = month_name[monthIndex];
let arrRightSide = ['4','5','6','11','12','13','18','19','20','25','26','27','32','33','34','39','40','41'];
let arrWeekendContext = ['5','6','12','13','19','20','26','27','33','34','40','41'];     
let arrTop = ['0','1','2','3','4','5','6']

var firstDay;
var selectedYear;
var totalBlocks;
var daysBefore;
var daysAfter;
var inc;
var dayHolder=[];
let currentUser



var daysInMonth= function (month,year){
    
    return 32 -new Date(year,month,32).getDate();
};
calIPC.on('opened', (event,args)=>{
    currentUser = args
    
    //console.log(hd.isHoliday(new Date('2022-4-17')))
})
calIPC.on('load-calendar', (event,args)=>{
    resetCalendar();
    setCalendarMonth();  
    console.log(hd.getCountries())  
})
calIPC.on('refresh', (event,args)=>{
    calendarLoad()

})

function calendarLoad(){
    clearDays(); 
    clearDayBlocks();
    createDayBlocks();
       
    setFirstDay(thisYear);
    fillDays(thisYear);    
    setMonth(thisYear);    
    inc=0;
    setSelectedYear(inc);
    setToday();
    createDayHolders();
    countSchJobsForCalendar();
   
    
}
function resetCalendar(){
    monthIndex = d.getMonth();// 0-11
    thisYear = d.getFullYear();//xxxx
    today = d.getDate();
    thisMonth = month_name[monthIndex];
    inc=0;
    
}
function setToday(){
    
    var selectedMonth= month_name[monthIndex];
    
    if(selectedMonth==thisMonth && selectedYear==thisYear){
        var t=today+firstDay-1;
        document.getElementById("dayNumber"+t).style.background='#803b3b';
        document.getElementById("dayNumber"+t).style.color="white";
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
function setFirstDay(y){
    var year = y;
   firstDay= new Date(year, monthIndex).getDay();
   
}
function clearDayBlocks(){
    for(i=0;i<totalBlocks;i++){
        $("#dayBlock"+i).remove();
    }
}
function clearDays(){
    for(var i=0;i<totalBlocks;i++){
       
       document.getElementById("dayNumber"+i).innerHTML="";
        document.getElementById("dayNumber"+i).style.background="";
    }

}
function fillDays(y){
    var year = y;
   
    //console.log(hd.getHolidays())
    let dim = daysInMonth(monthIndex, year);
    daysBefore = firstDay;
    daysAfter = totalBlocks-dim-daysBefore;
    var test=totalBlocks - dim;
    console.log(totalBlocks)
    
    for(i=0;i<dim+daysAfter;i++){
        
        var cell= i+firstDay;
        //assignJulian to block
        var m = monthIndex+1;
        var dnumber = i+1;
        if(dnumber>dim) {
            dnumber=dnumber - dim; 
            m+=1;
        }
        var jd = jDate(m.toString()+"/"+dnumber.toString()+"/"+year.toString());
        document.getElementById("dayBlock"+cell).setAttribute("data-julian",jd);
        let h = hd.isHoliday(new Date(m.toString()+"/"+dnumber.toString()+"/"+year.toString()))
        let strHolidayName =''
        let eleHolidayBox = document.createElement('div')
        eleHolidayBox.setAttribute('class','holiday')
        
        if(h){
            //console.log(h)
            strHolidayName = h[0].name
            let eleHolidayBoxText = document.createTextNode(strHolidayName)
            eleHolidayBox.appendChild(eleHolidayBoxText)
            if(h[0].type == 'public') eleHolidayBox.setAttribute('class','holiday bank')
            document.getElementById("dayNumber"+cell).appendChild(eleHolidayBox)


        }
        if(cell<daysInMonth(monthIndex, year)+daysBefore){
            let txtDayNumber = document.createTextNode(i+1)
            
            // document.getElementById("dayNumber"+cell).innerHTML=(h)
            // ?`${h[0].name} ${i+1}`
            // : i+1;
            document.getElementById("dayNumber"+cell).appendChild(txtDayNumber)

            //document.getElementById("dayNumber"+cell).innerHTML=i+1;
            document.getElementById("dayNumber"+cell).style.background="white";
        }else{
            let txtDayNumber = document.createTextNode(i-daysInMonth(monthIndex, year)+1)
            // document.getElementById("dayNumber"+cell).innerHTML=(h)
            // ?`${h[0].name} ${i-daysInMonth(monthIndex, year)+1}`
            // : i-daysInMonth(monthIndex, year)+1;
            document.getElementById("dayNumber"+cell).innerHTML=i-daysInMonth(monthIndex, year)+1;
            document.getElementById("dayBlock"+cell).classList.add("preview");
            //document.getElementById('dayBlock'+cell).innerHTML = i-daysInMonth(monthIndex, year)+1
        }
        
        var am = document.createElement('div');
        if(cell<daysInMonth(monthIndex, year)+daysBefore){
            am.className="am";
        }else{
            am.className="am preview";
        }
        am.setAttribute("id","am"+cell);
        am.ondblclick = function(){
            
            let objCalData = new Object()
            objCalData.launcher = 'calendar'
            objCalData.time_of_day = 'am'
            objCalData.date_scheduled = `${monthIndex+1}/${this.parentNode.firstChild.childNodes[1].textContent}/${year}`
            calIPC.send('open-add-job', currentUser, objCalData)
            
        };
        
        document.getElementById("dayBlock"+cell).appendChild(am);
        var pm = document.createElement('div');
        if(cell<daysInMonth(monthIndex, year)+daysBefore){
            pm.className="pm";
        }else{
            pm.className="pm preview";
        }
        pm.setAttribute("id","pm"+cell);
        pm.ondblclick = function(){
            let objCalData = new Object()
            objCalData.launcher = 'calendar'
            objCalData.time_of_day = 'pm'
            objCalData.date_scheduled = `${monthIndex+1}/${this.parentNode.firstChild.innerHTML}/${year}`
            calIPC.send('open-add-job', currentUser, objCalData)
        };
        document.getElementById("dayBlock"+cell).appendChild(pm);
        var j;
        for(j=0;j<6;j++){
            var indicator = document.createElement('div');
            indicator.className="indicator";
            indicator.setAttribute("id","indicatorAM"+jd+"_"+j)
            document.getElementById("am"+cell).appendChild(indicator);
            
            var thisIndicator=document.getElementById("indicatorAM"+jd+"_"+j);
            
            switch(j){
                case 0:
                    thisIndicator.innerHTML="AM";
                    thisIndicator.style.color="black";
                    if(cell>=daysInMonth(monthIndex, year)+daysBefore){
                        thisIndicator.classList.add("preview");
                    }
                    break;
                case 1:
                    thisIndicator.style.backgroundColor="#ff9e0c";
                    thisIndicator.style.visibility="hidden";
                    break;
                case 2:
                    thisIndicator.style.backgroundColor="#5e81ad";
                    thisIndicator.style.visibility="hidden";
                    break;
                case 3:
                    thisIndicator.style.backgroundColor="#ff2d00";
                    thisIndicator.style.visibility="hidden";
                    break;
                case 4:
                    thisIndicator.style.backgroundColor="#ad5ea8";
                    thisIndicator.style.visibility="hidden";
                    break;
                case 5:
                    thisIndicator.style.backgroundColor="#5ead63";
                    thisIndicator.style.visibility="hidden";
                    break;
                default:
                    break;

            }
        
        }
        for(j=0;j<6;j++){
            var indicator = document.createElement('div');
            indicator.className="indicator";
            indicator.setAttribute("id","indicatorPM"+jd+"_"+j);        
            document.getElementById("pm"+cell).appendChild(indicator);
            var thisIndicator=document.getElementById("indicatorPM"+jd+"_"+j);
           
            switch(j){
                case 0:
                    thisIndicator.innerHTML="PM";
                    thisIndicator.style.color="black";
                    if(cell>=daysInMonth(monthIndex, year)+daysBefore){
                        thisIndicator.classList.add("preview");
                    }
                    break;
                case 1:
                    thisIndicator.style.backgroundColor="#ff9e0c";
                    thisIndicator.style.visibility="hidden";
                    break;
                case 2:
                    thisIndicator.style.backgroundColor="#5e81ad";
                    thisIndicator.style.visibility="hidden";
                    break;
                case 3:
                    thisIndicator.style.backgroundColor="#ff2d00";
                    thisIndicator.style.visibility="hidden";
                    break;
                case 4:
                    thisIndicator.style.backgroundColor="#ad5ea8";
                    thisIndicator.style.visibility="hidden";
                    break;
                case 5:
                    thisIndicator.style.backgroundColor="#5ead63";
                    thisIndicator.style.visibility="hidden";
                    break;
                default:
                    break;

            }
        }
    }
    switch(totalBlocks){
        case 28:
            calIPC.send('resize-calendar', [1087,477])
            break;
        case 35:
            calIPC.send('resize-calendar', [1087,562])
            break;
        case 42:
            calIPC.send('resize-calendar', [1087,647])
            break;
        default:
            //calIPC.send('resize-calendar', [1087,562])
            break;
    }
    
    
}
function getScheduled(){
    arrScheduledJobs = []

    allJobs = calIPC.sendSync('pull_jobs')
    for(member in allJobs){

		(allJobs[member].status == 'sch')? arrScheduledJobs.push(allJobs[member]):'';
	}
    console.log(arrScheduledJobs)
   for(i=0;i<arrScheduledJobs.length;i++){
       arrScheduledJobs[i].customer_name = calIPC.sendSync('db-get-customer-name',arrScheduledJobs[i].customer_ID)
   }
    
    return arrScheduledJobs
}
function countSchJobsForCalendar(){
    m=monthIndex+1;
    resetSCHcounts();
    
    
    scheduledJobs = getScheduled()
    
    for(i=1;i<=daysInMonth(monthIndex, year)+daysAfter;i++){
        for(j=0;j<scheduledJobs.length;j++){
            let schD=scheduledJobs[j].date_scheduled;
            
            var calYear = schD.substr(schD.length - 4);
            
            var todaysJulianDate=jDate(m.toString()+"/"+i.toString()+"/"+year.toString());
            var isEligible = (selectedYear==calYear || monthIndex==11) ? true:false;
            
            if(todaysJulianDate==scheduledJobs[j].julian_date &&isEligible){
               
                var ampm = scheduledJobs[j].time_of_day;
                var jd = scheduledJobs[j].julian_date;
                
                switch(scheduledJobs[j].job_type){
                    
                    case "Check All":
                        if(ampm=="am"){
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"1").style.visibility="visible";
                            dayHolder[jd].am.checkallCount++;
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"1").innerHTML=dayHolder[jd].am.checkallCount;
                            }
                            else if(ampm=="pm"){
                                document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"1").style.visibility="visible";
                                dayHolder[jd].pm.checkallCount++;
                                document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"1").innerHTML=dayHolder[jd].pm.checkallCount;
                                }
                            else if(ampm==""){
                                document.getElementById("indicatorAM"+jd+"_"+"1").style.visibility="visible";
                                dayHolder[jd].am.checkallCount++;
                                document.getElementById("indicatorAM"+jd+"_"+"1").innerHTML=dayHolder[jd].am.checkallCount;
                                     
                                }
                        break;
                    case "King Pin":
                        
                        if(ampm=="am"){
                        document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"5").style.visibility="visible";
                        dayHolder[jd].am.kingpinCount++;
                        document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"5").innerHTML=dayHolder[jd].am.kingpinCount;
                        }
                        else if(ampm=="pm"){
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"5").style.visibility="visible";
                            dayHolder[jd].pm.kingpinCount++;
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"5").innerHTML=dayHolder[jd].pm.kingpinCount;
                            }
                            else if(ampm==""){
                                document.getElementById("indicatorAM"+jd+"_"+"5").style.visibility="visible";
                                dayHolder[jd].am.kingpinCount++;
                                document.getElementById("indicatorAM"+jd+"_"+"5").innerHTML=dayHolder[jd].am.kingpinCount;
                                 
                            }            
                        break;
                    case "Frame":
                        if(ampm=="am"){
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"3").style.visibility="visible";
                            dayHolder[jd].am.frameCount++;
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"3").innerHTML=dayHolder[jd].am.frameCount;
                            }
                            else if(ampm=="pm"){
                                document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"3").style.visibility="visible";
                                dayHolder[jd].pm.frameCount++;
                                document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"3").innerHTML=dayHolder[jd].pm.frameCount;
                                }
                            else if(ampm==""){
                                document.getElementById("indicatorAM"+jd+"_"+"3").style.visibility="visible";
                                dayHolder[jd].am.frameCount++;
                                document.getElementById("indicatorAM"+jd+"_"+"3").innerHTML=dayHolder[jd].am.frameCount;
                                     
                            }
                    break;
                    case "Spring":
                        if(ampm=="am"){
                            
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"2").style.visibility="visible";
                            dayHolder[jd].am.springCount++;
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"2").innerHTML=dayHolder[jd].am.springCount;
                            }
                            else if(ampm=="pm"){
                                document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"2").style.visibility="visible";
                                dayHolder[jd].pm.springCount++;
                                document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"2").innerHTML=dayHolder[jd].pm.springCount;
                                }
                            else if(ampm==""){
                                document.getElementById("indicatorAM"+jd+"_"+"2").style.visibility="visible";
                                dayHolder[jd].am.springCount++;
                                document.getElementById("indicatorAM"+jd+"_"+"2").innerHTML=dayHolder[jd].am.springCount;
                                 
                            }
                    break;
                    case "Alignment":
                        if(ampm=="am"){
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"4").style.visibility="visible";
                            dayHolder[jd].am.alignmentCount++;
                            document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"4").innerHTML=dayHolder[jd].am.alignmentCount;
                            }
                            else if(ampm=="pm"){
                                document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"4").style.visibility="visible";
                                dayHolder[jd].pm.alignmentCount++;
                                document.getElementById("indicator"+ampm.toUpperCase()+jd+"_"+"4").innerHTML=dayHolder[jd].pm.alignmentCount;
                            }
                            else if(ampm==""){
                                document.getElementById("indicatorAM"+jd+"_"+"4").style.visibility="visible";
                                dayHolder[jd].am.alignmentCount++;
                                document.getElementById("indicatorAM"+jd+"_"+"4").innerHTML=dayHolder[jd].am.alignmentCount;
                                 
                            }
                        break;
                    default:
                    break;
                }
            }
        }
    }
    
}


function setMonth(y){
    var year = y;

    document.getElementById("calendar-month-year").innerHTML=month_name[monthIndex]+" "+year;
}
function clearDayBlock(){
    for(i=0;i<totalBlocks;i++){
        
        $("#am"+i).remove();
        
        $("#pm"+i).remove();
    }
    
}
function setSelectedYear(incrementor){
    
    var incrementor=incrementor;
    var sYear=new Date(new Date().setFullYear(new Date().getFullYear() + incrementor)); 
    selectedYear=sYear.getFullYear();
    

}
function setCalendarMonth(direction){
    var direction = direction;
    
    clearDays();
    clearDayBlock();
    clearDayBlocks();
    
    
    if(direction=="next"){
        if(monthIndex<month_name.length-1){
            
            setSelectedYear(inc);
            monthIndex=monthIndex+1;
            setMonth(selectedYear);
            setFirstDay(selectedYear);
            createDayBlocks();//added
            fillDays(selectedYear);
            countSchJobsForCalendar();
            
        }else{
           
           inc++;
           setSelectedYear(inc);
            monthIndex=0;
            setMonth(selectedYear);
            setFirstDay(selectedYear);
            createDayBlocks();
            fillDays(selectedYear);            
            countSchJobsForCalendar();
        } 
        
        
    }else if(direction=="previous"){
        if(monthIndex>0 ){
            monthIndex=monthIndex-1;
            setSelectedYear(inc);
            setMonth(selectedYear);
            setFirstDay(selectedYear);
            createDayBlocks();
            fillDays(selectedYear);
            countSchJobsForCalendar();
            }else{
                monthIndex=11;
                inc--;
                setSelectedYear(inc);
                setMonth(selectedYear);
                setFirstDay(selectedYear);
                createDayBlocks();
                fillDays(selectedYear);
                countSchJobsForCalendar();            
            }        
        
       
    }else{
        setSelectedYear(inc);
        setMonth(selectedYear);
        setFirstDay(selectedYear);
        createDayBlocks();
        fillDays(selectedYear);
        countSchJobsForCalendar();
    }
    
    setToday();
    
}

function createDayBlocks(){
    
    totalBlocks = weekCount(selectedYear || thisYear, monthIndex+1)*7;
    
    for(i=0;i<totalBlocks;i++){
        
        var db = document.createElement('div');
        db.setAttribute("id","dayBlock"+i);
        db.setAttribute("class","day-block");        
        db.onmouseenter = function(event){
            event.stopPropagation();

            let validDay = (this.childNodes.length>1)? true: false;            
            let children = this.childNodes

            //if jobwallet already open somewhere, close it
            if(document.getElementById("jobWallet")){
                $('#jobWallet').remove();
            }           
            
            //check if day has jobs
            let hasJobs = function(){
                let result
                let count = 0
                
                if(validDay){
                    for( var grandChild=children[1].firstChild; grandChild!==null; grandChild=grandChild.nextSibling){
                        if (grandChild.style.visibility == 'visible'){
                            count+=1
                        }
                    }
                    for( var grandChild=children[2].firstChild; grandChild!==null; grandChild=grandChild.nextSibling){
                        if (grandChild.style.visibility == 'visible'){
                            count+=1
                        }
                    }
                    result = (count>0) ? true : false
                        
                }
                return result
            } 
            
            //show jobwallet tooltip if there are jobs for the day
            if(hasJobs()){           
                showJobs(this);
                makeCalenderJobContainers(this);           
            }
        }
          
        
        document.getElementById("calendar-days-container").appendChild(db);
        
        var dn =document.createElement('div');
        dn.setAttribute("id","dayNumber"+i);
        dn.setAttribute("class","day-number");
        document.getElementById("dayBlock"+i).appendChild(dn);
        
        
        
    }
    
}
function jDate(ds){

    var ds = ds;
    var dayScheduled = new Date(ds);
    var julian= Math.ceil((dayScheduled - new Date(dayScheduled.getFullYear(),0,0)) / 86400000);
    
    return julian;
}
function days_of_a_year(year){
   
  return isLeapYear(year) ? 366 : 365;

}

function isLeapYear(year) {
    result = (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0))? true: false;
    console.log(`year=${year} result=${result}`)
    return result
}

function createDayHolders(){
    
    for(i=0;i<days_of_a_year(selectedYear)-1;i++){
        var dh="day"+i;
        dayHolder.push({
                "am":{
                    "kingpinCount": 0,
                    "alignmentCount": 0,
                    "springCount": 0,
                    "frameCount": 0,
                    "checkallCount": 0
                },
                "pm":{
                    "kingpinCount": 0,
                    "alignmentCount": 0,
                    "springCount": 0,
                    "frameCount": 0,
                    "checkallCount": 0
                }
            
        });
    }
}
function resetSCHcounts(){
    for(i=0;i<dayHolder.length;i++){
        dayHolder[i].am.kingpinCount=0;
        dayHolder[i].am.alignmentCount=0;
        dayHolder[i].am.springCount=0;
        dayHolder[i].am.frameCount=0;
        dayHolder[i].am.checkallCount=0;
        dayHolder[i].pm.kingpinCount=0;
        dayHolder[i].pm.alignmentCount=0;
        dayHolder[i].pm.springCount=0;
        dayHolder[i].pm.frameCount=0;
        dayHolder[i].pm.checkallCount=0;
    }
    
}
function showJobs(e){

    var element = e;
    var schJobWallet = document.createElement("div");
    
    let saturday = arrRightSide.filter((da)=>{
        return da % 2 == 0
    });
    
    (arrRightSide.includes(element.id.substring(8)))? schJobWallet.setAttribute("class","jobWalletLeft"): schJobWallet.setAttribute("class","jobWallet");
        
      
    //schJobWallet.setAttribute("class","jobWallet");    
    schJobWallet.setAttribute("id","jobWallet");
    element.appendChild(schJobWallet);
    
}

var thisDaysSchJobs=[];
function makeCalenderJobContainers(e){
    
    for(i=thisDaysSchJobs.length;i>0;i--){
        thisDaysSchJobs.pop();
    }
    var element=e;
    var dayBlockJulian=element.getAttribute("data-julian");
   
    for(i=0;i<scheduledJobs.length;i++){

        if(scheduledJobs[i].julian_date == dayBlockJulian){
            thisDaysSchJobs.push(scheduledJobs[i]);           
        }
        
    }
    
    for(i=0;i<2;i++){
        var ampmContainer = document.createElement('div');
        ampmContainer.setAttribute("id","container"+i);
        ampmContainer.setAttribute("class","ampmContainer");
        document.getElementById("jobWallet").appendChild(ampmContainer);

    
    
    }
    var jobHeader = document.createElement('div');
    jobHeader.setAttribute("class","calJobHeader");
    jobHeader.setAttribute("id","jobHeaderAM");    
    document.getElementById("container0").appendChild(jobHeader);

    var jobHeader2=document.createElement('div');
    jobHeader2.setAttribute("class","calJobHeader");
    jobHeader2.setAttribute("id","jobHeaderPM");    
    document.getElementById("container1").appendChild(jobHeader2);

    document.getElementById("jobHeaderAM").innerHTML="AM";
    document.getElementById("jobHeaderPM").innerHTML="PM";
    
    for(j=0;j<thisDaysSchJobs.length;j++){

        let schJobType = thisDaysSchJobs[j].job_type;       
        let jcJobID = thisDaysSchJobs[j].job_ID       
        var jobContainer = document.createElement('div');
        jobContainer.setAttribute("id","jobContainer"+j);
        jobContainer.setAttribute("class", "calJobContainer");
        jobContainer.setAttribute("job-id", jcJobID);
        jobContainer.onclick = function (event){
            if(event.target.tagName.toLowerCase() === 'a'){
                
            } else {
                event.stopPropagation()
        
            }
            
            
        };
        jobContainer.oncontextmenu = function (event){
            if(event.target.nodeName == "A" || event.target.nodeName == 'B'){
                openContextMenu(event.target.parentNode);
            }else{
            openContextMenu(event.target);
            }
            console.log(event.target.nodeName)
            return false;
        };
   

        //job_type should be customer name. just used job_type to test
        let cuN = "<b class='customerName'>"+thisDaysSchJobs[j].customer_name.toUpperCase()+'</b><br/>'
        let u = (thisDaysSchJobs[j].unit == null || thisDaysSchJobs[j].unit == '')?'': '<b>Unit: </b>'+thisDaysSchJobs[j].unit+'</br>'
        let jcJT = thisDaysSchJobs[j].job_type.toUpperCase()
        jobContainer.innerHTML=`${cuN}
        ${u}
        ${jcJT}`
        
        if(thisDaysSchJobs[j].waiting_customer=="-1"){
            jobContainer.innerHTML+="<br/>Customer will be waiting";
        }
            switch(schJobType){
                case "Spring":

                    jobContainer.style.color="#5e81ad";                
                    jobContainer.style.borderColor="#5e81ad";
                    
                break;
                case "Check All":

                    jobContainer.style.color="#ff9e0c";                  
                    jobContainer.style.borderColor="#ff9e0c";  
                                
                    break;
                    
                case "Alignment":

                    jobContainer.style.color="#ad5ea8";
                    jobContainer.style.borderColor="#ad5ea8";
                    
                    break;
                case "King Pin":

                    jobContainer.style.color="#5ead63";                
                    jobContainer.style.borderColor="#5ead63"; 
                    
                    break;
                case "Frame":

                    jobContainer.style.color="#ff2d00";                
                    jobContainer.style.borderColor="#ff2d00";
                    
                    break;
                default:
                    break;
            }
            
        if(thisDaysSchJobs[j].time_of_day=="am"){
            document.getElementById("container0").appendChild(jobContainer);
        }else if(thisDaysSchJobs[j].time_of_day=="pm"){
            document.getElementById("container1").appendChild(jobContainer);
        }else{
            document.getElementById("container0").appendChild(jobContainer);
        }
        
    }
    var element = e;    
    var height = Math.floor($("#jobWallet").height());    
    let shift = Math.floor((height-40)-element.offsetTop)*-1
    
    if(height>element.offsetTop){       
        document.getElementById("jobWallet").style.bottom = shift+"px";        
    }
    
}



function openContextMenu(e){
    
    try{  
    
        let callingElement = e;

        var rn = callingElement.getAttribute("job-id");
        console.log(`calling element ID=${e.id} job ID=${rn}`)
        let objJobInfo = ()=> calIPC.sendSync('get-job', rn)
        
        cId=callingElement.id;
        
        var existingCMs = document.getElementsByClassName("cm_list");
        if(existingCMs){
            for(var k in existingCMs){
                $("#"+existingCMs[k].id).remove();
            };
        }
       
        let thisDay = document.getElementById('jobWallet').parentNode.id.substring(8);

        let cmList = document.createElement('ul');
        //is it on the top row
        (arrTop.includes(thisDay))
            //is it on the top row and on the right side (fri or sat)
            ? (arrWeekendContext.includes(thisDay))
                //if on top row and the right side
                ?  cmList.setAttribute("class","cm_list left top")
                //on top row but not the right side
                : cmList.setAttribute("class","cm_list top")
            //not on top
            : (arrWeekendContext.includes(thisDay))
                //not on top row but on the right side
                ? cmList.setAttribute("class","cm_list left")
                //not on top row or the right side
                : cmList.setAttribute("class","cm_list")

        

        
        cmList.setAttribute("id","cmList");
        callingElement.appendChild(cmList)
        
        let listItems =["EDIT","NO-SHOW","SEND TO LOT","CANCEL APPT"];
        for(i=0;i<listItems.length;i++){
            var cmListItem =document.createElement('li');
            cmListItem.setAttribute("id","cmListItem"+i);
            cmListItem.setAttribute("class","cmListItem"); 
            cmListItem.onclick= function(e){
                e.stopPropagation();
                
                switch(e.target.innerHTML){
                    case "SEND TO LOT":
                        
                        objLot = new Object()
                        objLot.job_ID = rn
                        objLot.shop_location = ''
                        objLot.status = 'wfw'
                        objLot.designation = 'On the Lot'
                        objLot.date_in = todayIs()
                        calIPC.send('update-job',objLot, 'calendar', currentUser)

                        
                        break;
                    case "EDIT":
                                               
                        calIPC.send('open-edit', objJobInfo(), 'calendar', currentUser)                        
                        
                        break;
                    case "NO-SHOW":
                        
                        objNoshow = new Object()
                        objNoshow.job_ID = rn
                        objNoshow.no_show = 1
                        objNoshow.active = 0
                        calIPC.send('update-job',objNoshow, "calendar",currentUser)
                        
                        break;
                    case "CANCEL APPT":

                        objCancel = new Object()
                        objCancel.job_ID = rn
                        objCancel.cancelled = 1
                        objNoshow.active = 0
                        calIPC.send('update-job',objCancel, "calendar",currentUser)
                        
                        break;
                    default:
                        break;
                }
            };
            document.getElementById("cmList").appendChild(cmListItem);     
        }
        for(i=0;i<listItems.length;i++){
            document.getElementById("cmListItem"+i).innerHTML=listItems[i];
        }
    }catch(e){
        alert("error"+ e);
    }
}

 
function weekCount(year, month_number) {

    // month_number is in the range 1..12

    var firstOfMonth = new Date(year, month_number-1, 1);
    var lastOfMonth = new Date(year, month_number, 0);

    var used = firstOfMonth.getDay() + lastOfMonth.getDate();

    return Math.ceil( used / 7);
}
