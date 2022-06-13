



let attachDatePicker = function(p){
    return new Promise(function(resolve,reject){
        $("#datepickerReport").datepicker({
            dateFormat : "m/d/yy"
        });
        $("#datepickerReport").datepicker('setDate', todayIs());
        
        resolve(console.log('datepicker success'))
    })
    
}

 
  
// function openModal() {
//   let win = new remote.BrowserWindow({
//     parent: remote.getCurrentWindow(),
//     modal: true,
//     width:900,
//     height:500
    
//   })
//   win.loadURL(url.format({
//     pathname: path.join(__dirname, 'modal.html'),
//     protocol: 'file',
//     slashes:true
// }))
// }

// $(function() {
//     $("#datepickerReport").datepicker({
//         dateFormat : "m/d/yy"
//     });
//     $("#datepickerReport").datepicker('setDate', todayIs());
// });

function printReport(){
   $('#reportFormWrapper').remove();
    window.print()
}
function checkForInputData(e){
	inputData = e.value;
	switch(inputData){
		case "":
		break;
		case "0":
		e.value = "";
		break;
		case "Customer Name":
			document.getElementById("from").innerHTML = "";
			e.value="";
			break;
		default:
		break;
		
		
	}
	
}

function fillPrint(e) {
	thisTotal = e.id;
	
	//alert(e.value + " "+e.id);
	//iframe.open();
	switch(thisTotal) {
		case "datepickerReport":
			if (e.value == "") {
				e.value = todayIs();
			} else {
				document.getElementById("reportHeader").innerHTML = "EOD Report " + e.value;

			}
			break;
		case "inpCheck":
			if (e.value == "") {
				e.value = "0";
			} else {
				document.getElementById("totalCashCheck").innerHTML = "$" + e.value;

			}
			break;
		case "inpBatch":
			if (e.value == "") {
				e.value = "0";
			} else {
				document.getElementById("totalBatch").innerHTML = "$" + e.value;
			}
			break;
		case "inpUPS":
			if (e.value == "") {
				//e.value = "0";
			} else {
				//countMonthly(e);
				//alert(e.value);
				
				document.getElementById("totalMonthly").innerHTML = "$" + countMonthly(e).toFixed(2);
				document.getElementById("totalUPS").innerHTML = "$" + e.value;
			}
			break;
		case "inpFrom":
			if (e.value == "") {
				e.value = "Customer Name";
			} else if(e.value == "Customer Name"){
				document.getElementById("from").innerHTML = "";
			}
			else{
				document.getElementById("from").innerHTML = e.value;
			}
			break;
		case "inpDaily":
			if (e.value == "") {
				e.value = "0";
			} else {
				document.getElementById("totalDaily").innerHTML = "$" + e.value;
			}
			break;
		case "inpMonthly":
			if (e.value == "") {
				e.value = "0";
			} else {
				document.getElementById("totalMonthly").innerHTML = "$" + e.value;
			}
			break;
		case "inpDirector":
			
				document.getElementById("totalMonthly").innerHTML = "$" + countMonthly(e).toFixed(2);
				
			break;
		default:
			break;
	}
	//iframe.close();
}
function loadModal(){
    //document.getElementById('datepickerReport').focus()
    $("#datepickerReport").click()
    
    
    $("#datepickerReport").value = todayIs()
    $("#datepickerReport").text = todayIs();
}
$(function(){
    $("#datepickerReport").datepicker({
        dateFormat : "m/d/yy"
    });
})
function todayIs() {
	const objDate = new Date();
	const day = objDate.getDate();
	const month = objDate.getMonth() + 1;
	const year = objDate.getFullYear();
	const today = month + "/" + day + "/" + year;
	return today;
}
     