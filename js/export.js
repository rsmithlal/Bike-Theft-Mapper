// JavaScript Document
var myFirebase = new Firebase("https://biketheftproject.firebaseio.com/");
var dataJSON;
var jsonDL;
require([
      "dojo/dom", 
	  "dojo/on", 
	  "dojo/_base/lang", "dojo/domReady!"
    ], function(
    dom, 
	on, 
	lang,
	domReady
    )  {
 var exportDataBtn = dom.byId("exportBtn");
	  on(exportDataBtn, "click", JSONToCSVConvertor);
var exportJSONBtn = dom.byId("dlJSON");
	  on(exportJSONBtn, "click", DownloadJSON);
function DownloadJSON(){
	//console.log(JSON.stringify(dataJSON));
	var jsonString = JSON.stringify(dataJSON, null, 4);
	//console.log(jsonString);
  jsonDL = exportJSONBtn;
  jsonDL.download = "BikeThefts.json";
  jsonDL.href = "data:application/json;charset=utf-8," + jsonString;
  jsonDL.innerHTML = "Download data as JSON";
};
var dataObject;
	//this function grabs a 'snapshot' of all the data in Firebase, then navigates down to the 'features' child. It then iterates through all the
	//children under 'attributes' and retrieves all attribute data. Then it converts them to strings or numbers and calls addPoint to map them
myFirebase.on("value", function(snapshot) {
dataObject = snapshot;
dataJSON = dataObject.val();
//console.log(JSON.stringify(dataJSON));

});

function JSONToCSVConvertor() {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof dataJSON != 'object' ? JSON.parse(dataJSON) : dataJSON;
    
    var CSV = '';    
    //Set Report title in first row or line
    var ShowLabel = true;
	var ReportTitle = "Data";
    CSV += ReportTitle + '\r\n\n';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";
        
        //This loop will extract the label from 1st index of on array
        for (var index in arrData[0]) {
            
            //Now convert each value to string and comma-seprated
            row += index + ',';
        }

        row = row.slice(0, -1);
        
        //append Label row with line break
        CSV += row + '\r\n';
    }
    
    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        
        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }

        row.slice(0, row.length - 1);
        
        //add a line break after each row
        CSV += row + '\r\n';
    }

    if (CSV == '') {        
        alert("Invalid data");
        return;
    }   
    
    //Generate a file name
    var fileName = "BikeTheftIncidents_";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g,"_");   
    
    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
    
    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension    
    
    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");    
    link.href = uri;
    
    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";
    
    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

});