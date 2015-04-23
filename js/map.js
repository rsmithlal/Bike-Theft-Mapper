/* -------------------------------- 

#### Utilizes:
* [ArcGIS API for Javascript](https://developers.arcgis.com/javascript/)
* [CodyHouse Full-Screen Pop-Out Navigation](http://codyhouse.co/gem/full-screen-pop-out-navigation/)
* [Firebase ](https://www.firebase.com) 

-------------------------------- */

// JavaScript Document
var map, ctxMenuForMap;
var graphic;
var currLocation;
var currLoc;
var watchId;
var selected, clickLocation;
var lon;
var lat;
lon = "-73.5673";
lat = "45.5017";
var theftDB = [];
var polygonDB = [];
var bikePathDB = [];

var graphic;


//begin firebase setup
var myFirebase = new Firebase("https://biketheftproject.firebaseio.com/");
var hotspotFB = new Firebase("https://bikethefthotspots.firebaseio.com/features");
var bikePathFB = new Firebase("https://bikepathrisk.firebaseio.com/features");
//end firebase setup

//helper functions
//helper function to return formatted lock type data as string for InfoTemplate section


function dividedListString(){
	var listString = "";
	var elemCount=0;
	var listArray = arguments;
	//count how many items exist
	for (var i=0; i<listArray.length; i++){
		
		if (listArray[i]){elemCount+=1;}
	}
	for (var i=0; i<listArray.length; i++){ //if there is only one item, the string returned is that item
		
		if (elemCount==1){
			listString += listArray[i];
		}
	}
	for (var i=0; i<listArray.length; i++){//if there is more than one item, the string returned are those items separated by vertical lines
		
		if (elemCount>1){
			listString += listArray[i];
			if (listArray[i]) {listString += " | ";}
		}
	}
		
	if (elemCount == 0) {listString = "No Data";}//if there are no items, return "No Data"
	if (listString.slice(listString.length-3, listString.length)==" | "){ //if the string has an orphan divider, trim it
		listString = listString.slice(0, listString.length-3);
	}
		return listString;//return the final formatted lock section string
}
function placeString(city, prov, country){
	var listString = "";
	if(city){listString += city;}
	if (city && prov){listString += ", "};
	if (city && country && prov == ""){listString += " | ";}
	if (prov){listString += prov;}
	if (country && city == ""){listString += " | ";}
	if (country && city && prov){listString += " | ";}
	if (country){listString += country;}
	if (city == "" && prov == "" && country == ""){listString += "No Data";}
	return listString;//return the final formatted lock section string
}
//end helper functions

//begin esri arcGIS map domain
require([
      "esri/map", 
      "esri/dijit/LocateButton",
      "esri/geometry/Point", 
	  "esri/symbols/SimpleMarkerSymbol", 
	  "esri/symbols/SimpleLineSymbol",
	  "esri/graphic", 
	  "esri/Color", 
	  //Geometry Modules
	  "esri/geometry/Geometry",
	  "esri/geometry/Polyline",
	  "esri/geometry/Polygon",
	 
	  //Graphic & Style Modules
	  
	  "esri/symbols/SimpleFillSymbol",
	  "esri/InfoTemplate",
	 
	   
	  "dojo/dom", 
	  "dojo/on", 
	  "dojo/_base/lang", "dojo/domReady!", "esri/layers/GraphicsLayer",
	  "esri/layers/FeatureLayer",
	  "esri/config", 
	  "esri/layers/KMLLayer",
	  "dojo/parser", "dojo/dom-style",
	  "esri/layers/GraphicsLayer",
	  "esri/geometry/Extent",
	  "esri/geometry/screenUtils",
	  "esri/dijit/Search",
	  "dojo/Evented",
        "dijit/Menu", "dijit/MenuItem", "dijit/MenuSeparator", "esri/geometry/jsonUtils"
    ], function(
      Map, LocateButton, Point,
        SimpleMarkerSymbol, SimpleLineSymbol,
        Graphic, Color, //Geometry Hooks
    Geometry,
    Polyline, 
    Polygon,
 
    //Graphic & Style Hooks
    SimpleFillSymbol,
    InfoTemplate, 
	dom, 
	on, 
	lang,
	domReady, GraphicsLayer, FeatureLayer,
	esriConfig,
	KMLLayer, parser, domStyle,
	GraphicsLayer,
	Extent,
	screenUtils,
	Search,
	Evented,
        Menu, MenuItem, MenuSeparator, geometryJsonUtils
    )  {
//begin map instance namespace
//create map
map = new Map("map", {
center: [lon, lat],
zoom: 10,
basemap: "streets",
extent: new Extent({xmin:-73.806,ymin:45.414,xmax:-73.446,ymax:45.617,spatialReference:{wkid:4326}})
});

//search bar
//var s = new Search({
//	map: map
// }, "search");
// s.startup();
//end search

map.on("load", initFunc); //turn on geolocate on map load

//GraphicsLayers for each feature set to be added to the map
var pointGraphics = new GraphicsLayer({id:"TheftPoints"});
var polyGraphics = new GraphicsLayer({opacity:0.5, id:"TheftHotspots"});
var bikePathGraphics = new GraphicsLayer({id:"BikePaths"});
map.addLayer(polyGraphics,1);
map.addLayer(bikePathGraphics,2);
map.addLayer(pointGraphics,10);

toggleLegend();
toggleNewTheftForm();

//load all features to map
loadAllPoints();
loadPolygons();
loadBikePaths();
//end load features

//geolocate button dijit    
geoLocate = new LocateButton({
map: map
}, "LocateButton");
geoLocate.startup();
//end geolocate button

//begin javascript-html bridge

//click events
var addPointBtn = dom.byId("addPointPopup");
on(addPointBtn, "click", toggleNewTheftForm);

var closestPtBtn = dom.byId("closestPoint");
on(closestPtBtn, "click", closestDist);

var submitBtn = dom.byId("submit");
on(submitBtn, "click", submitData);

var closeDiv = dom.byId("closeDiv");
on(closeDiv, "click", toggleNewTheftForm);

var toggleLegendDiv = dom.byId("toggleLegend");
on(toggleLegendDiv, "click", toggleLegend);
//end click events

if (pointGraphics.visible){dom.byId("theftsCheckBox").checked=true;}
else {dom.byId("theftsCheckBox").checked=false;}
if (polyGraphics.visible){dom.byId("hotspotsCheckBox").checked=true;}
else {dom.byId("hotspotsCheckBox").checked=false;}

//monitor check boxes
on(dom.byId("theftsCheckBox"), "change", toggleTheftsVisibility);
on(dom.byId("hotspotsCheckBox"), "change", toggleHotspotsVisability);
on(dom.byId("bikePathsCheckBox"), "change", toggleBikePathsVisability);
on(dom.byId("location"), "change", toggleLatLon);
dom.byId("location").checked=true;

//toggle functions
function toggleLatLon (){
 var checkbox = dom.byId("location");
 var toggleLat = dom.byId("latForm");
 updateToggle = checkbox.checked ? toggleLat.disabled=true : toggleLat.disabled=false;
 updateLat = checkbox.checked ? toggleLat.value = currLoc.y : toggleLat.value = 0;
 var toggleLon = dom.byId("lonForm");
 updateToggle = checkbox.checked ? toggleLon.disabled=true : toggleLon.disabled=false;
 updateLon = checkbox.checked ? toggleLon.value = currLoc.x : toggleLon.value = 0;
}

function toggleTheftsVisibility (){
  if (pointGraphics.visible){pointGraphics.hide();
  } else {pointGraphics.show();}
}

function toggleHotspotsVisability (){
  if (polyGraphics.visible){polyGraphics.hide();
  } else {polyGraphics.show();}
}

function toggleBikePathsVisability (){
  if (bikePathGraphics.visible){bikePathGraphics.hide();
  } else {bikePathGraphics.show();}
}

function toggleLegend() {
if (document.getElementById("legendDiv").style.display==="none"){
document.getElementById("legendDiv").style.display = "block";
} else {document.getElementById("legendDiv").style.display = "none";}
}

function toggleNewTheftForm() {

if (dom.byId("popupDiv").style.display==="none"){
dom.byId("popupDiv").style.display = "block";
} else {dom.byId("popupDiv").style.display = "none";}

}
//end javascript-html bridge	
	
//begin data object definitions
//TheftReport object definition; Container for theft incident data pulled from firebase
function TheftReport(lon, lat, type, reported, year, month, time, city, province, country, accessories, handle, pedal, seat, wheel, uLock, chain, cable, wLock, unlocked) {
//variable mapping
		//console.log();
		this.reported = reported;
		this.type = type;
		this.year = year;
		this.month = month;
		this.time = time;
		this.city = city;
		this.prov = province;
		this.ctry = country;
		this.access = accessories;
		this.handle = handle;
		this.pedal = pedal;
		this.seat = seat;
		this.wheel = wheel;
		this.uLock = uLock;
		this.chain = chain;
		this.cable = cable;
		this.wLock = wLock;
		this.unlocked = unlocked;
		this.pt = new Point(lon, lat);
		//mapping variables for InfoTemplate string substitution
		this.attr = {"Type":type,
					 "Reported":reported,
					 "Year":year,
					 "Month":month,
					 "Time":time,
					 "City":city,
					 "Prov":province,
					 "Ctry":country,
					 "Access":accessories,
					 "Handle":handle,
					 "Pedal":pedal,
					 "Seat":seat,
					 "Wheel":wheel,
					 "Ulock":uLock,
					 "Chain":chain,
					 "Cable":cable,
					 "Wlock":wLock,
					 "Unlocked":unlocked
					 };
		//helper function to return formatted lock type data as string for InfoTemplate section
		this.lockedBy = dividedListString(cable, chain, wLock, uLock, unlocked);
		this.partsStolen = dividedListString(handle, pedal, seat, wheel);
		this.dateString = dividedListString(time, month, year);
		this.placeString = placeString(city, province, country);		
				
		this.infoBoxBike = new InfoTemplate("Bike Theft Details","<strong>Reported:</strong> ${Reported}<br /><strong>Occured:</strong> " + this.dateString + "<br /><strong>Location:</strong> " + this.placeString + "<br /><strong>Locked using:</strong> " + this.lockedBy);
		this.infoBoxPart = new InfoTemplate("Part Theft Details","<strong>Occured:</strong> " + this.dateString + "<br /><strong>Location: </strong>" + this.placeString + "<br /><strong>Parts Taken:</strong> " + this.partsStolen);
		//function to draw TheftReport to its GraphicsLayer
		this.draw = function(){
		  //symbol for bike theft graphic
		  	 var bikeSymbol = new SimpleMarkerSymbol({
				  "color": [210, 105, 30, 255],
				  "size": 6,
				  "angle": 0,
				  "xoffset": 0,
				  "yoffset": 0,
				  "type": "esriSMS",
				  "style": "esriSMSCircle",
				  "outline": {
					"color": [255,255,255,255],
					"width": 1,
					"type": "esriSLS",
					"style": "esriSLSSolid"
				  }
			  });
			  //symbol for part theft graphic
			  var partSymbol = new SimpleMarkerSymbol({ 
				  "color": [119, 13, 213, 255],
				  "size": 6,
				  "angle": 0,
				  "xoffset": 0,
				  "yoffset": 0,
				  "type": "esriSMS",
				  "style": "esriSMSCircle",
				  "outline": {
					"color": [0,0,0,255],
					"width": 1,
					"type": "esriSLS",
					"style": "esriSLSSolid"
				  }
			  });
			//determine which symbol to use for the graphic of this point 
			if (this.type === "Bike") {	
			  var theftGraphic = new Graphic(this.pt, bikeSymbol, this.attr, this.infoBoxBike);
			  pointGraphics.add(theftGraphic);
			  return;
			} else if (this.type === "Part") {
			  var theftGraphic = new Graphic(this.pt, partSymbol, this.attr, this.infoBoxPart);
			  pointGraphics.add(theftGraphic);
			  return;
			}
		};//end draw() definition
	  }//end TheftReport object definition
	  
	  //HotspotPolygon definition, accepts data from hotspot firebase
	  function TheftPolygon(attributes, rings) {

  		
		this.attributes = attributes;
		this.geometryJSON = JSON.stringify(rings);
		this.polygon = 
		{
			"geometry":{
				"rings":{}, 
				"spatialReference":{"wkid":4326}
			}, 
			"symbol":
			   {"color":[0,0,0,64],
				"outline":
					{"color":[0,0,0,255],
					 "width":1,
					 "type":"esriSLS",
					 "style":"esriSLSSolid"
					 },
				"type":"esriSFS",
				"style":"esriSFSSolid"
				},
			"infoTemplate":{
				"title":"",
				"content":""
			}	
		};
		
		this.polygon["geometry"]["rings"] = rings;
		//console.log(this.attributes);
		this.confidence = "";
		if(this.attributes.Gi_Bin===3){
			this.polygon["symbol"]["color"] = [252,48,48,255];
			this.confidence = "99% Confidence";
		} else if(this.attributes.Gi_Bin===2){
			this.polygon["symbol"]["color"] = [255,127,127,255];
			this.confidence = "95% Confidence";
		} else if(this.attributes.Gi_Bin===1){
			this.polygon["symbol"]["color"] = [252,200,200,255];
			this.confidence = "90% Confidence";
		}
		this.polygon["infoTemplate"]["title"] = "Hotspot Details";
		this.polygon["infoTemplate"]["content"] = "<strong>Number of Thefts:</strong> " + String(this.attributes.Count_) + "<br /><strong>Confidence:</strong> " + String(this.confidence) + "<br /><strong>P-Value:</strong> " + String(this.attributes.GiPValue) + "<br /><strong>Z-Score:</strong> " + String(this.attributes.GiZScore);
		//console.log(this.polygon);
		
		this.draw = function(){
			var polyGraphic = new Graphic(this.polygon);
			polyGraphics.add(polyGraphic);
			
	  }
	  }; //end hotspotObject prototype
	  
	  
	  //begin bikePath prototype
	  function BikePathPolygon(attributes, rings) {

  		
		this.attributes = attributes;
		this.geometryJSON = JSON.stringify(rings);
		this.polygon = 
		{
			"geometry":{
				"rings":{}, 
				"spatialReference":{"wkid":4326}
			}, 
			"symbol":
			   {"color":[0,0,0,64],
				"type":"esriSFS",
				"style":"esriSFSSolid"
				},
			"infoTemplate":{
				"title":"",
				"content":""
			}	
		};
		
		this.polygon["geometry"]["rings"] = rings;
		//console.log(this.attributes);
		this.risk = "";
		this.percRisk = this.attributes.pointRatio * 100;
		//console.log(this.attributes.higherRisk);
		if(this.attributes.higherRisk==0){
			this.polygon["symbol"]["color"] = [77,230,0,255];
			this.risk = "Lower than average risk";
		} else if(this.attributes.higherRisk==1){
			this.polygon["symbol"]["color"] = [0,0,0,255];
			this.risk = "Greater than average risk";
		} 
		this.polygon["infoTemplate"]["title"] = "Bike Path Details";
		this.polygon["infoTemplate"]["content"] = "<strong>Risk of Theft:</strong> " + this.risk + "<br /><strong>Proportion on Path:</strong> " + String(this.percRisk.toFixed(2)) + "% compared to 15% average<br /><strong>Thefts on Path:</strong> " + String(this.attributes.theftsOnPath) + "<br /><strong>Thefts in Tract:</strong> " + String(this.attributes.theftsInTract);
		//console.log(this.polygon);
		
		this.draw = function(){
			var polyGraphic = new Graphic(this.polygon);
			bikePathGraphics.add(polyGraphic);
			
	  }
	  };
	  
	  //end bikepath prototype
	  
	  //end data object prototypes
	  
	 

	

	function submitData() { 
	if (dom.byId('type').value === "" || dom.byId('month').value === "" || dom.byId('year').value === "" || dom.byId('city').value === "" || dom.byId('country').value === "" || dom.byId('reported').value === "") {
		alert("Fill All Fields !");
	} 
	else {
	
	var newLoc = new Point();
	if (dom.byId("location").checked==false){
		newLoc.setX(dom.byId("lonForm").value);
		newLoc.setY(dom.byId("latForm").value);
	} else {
		newLoc.setX(currLoc.x);
		newLoc.setY(currLoc.y);
	}
	
	var accessories;
	dom.byId("accessories").checked ? accessories = "Accessories" : accessories = "";
	var handlebars;
	dom.byId("handlebars").checked ? handlebars = "Handlebars" : handlebars = "";
	var pedal;
	dom.byId("pedal").checked ? pedal = "Pedal" : pedal = "";
	var seat;
	dom.byId("seat").checked ? seat = "Seat" : seat = "";
	var wheel;
	dom.byId("wheel").checked ? wheel = "Wheel" : wheel = "";
	
	var cable;
	dom.byId("cable").checked ? cable = "Cable" : cable = "";
	var chain;
	dom.byId("chain").checked ? chain = "Chain" : chain = "";
	var uLock;
	dom.byId("uLock").checked ? uLock = "U-Lock" : uLock = "";
	var wLock;
	dom.byId("wLock").checked ? wLock = "Wheel Lock" : wLock = "";
	var unlocked;
	dom.byId("unlocked").checked ? unlocked = "Unlocked" : unlocked = "";
	
	var newTheft = new TheftReport(newLoc.x,newLoc.y, dom.byId("type").value, dom.byId("reported").value, dom.byId("year").value, dom.byId("month").value, dom.byId("time").value, dom.byId("city").value, dom.byId("province").value, dom.byId("country").value, accessories, handlebars, pedal, seat, wheel, uLock, chain, cable, wLock, unlocked);
	//console.log(newTheft);
	pushToFirebase(newTheft);
	
	//dom.byId('form').submit();
	alert("New Hotspot Submitted Successfully!");
	
	document.getElementById("form").reset();
	
	div_hide();
	map.centerAt(newTheft.pt);
	}
	
	}
	//Function To Display Popup
	function div_show() {
	document.getElementById("popupDiv").style.display = "block";
	}
	//Function to Hide Popup
	function div_hide(){
	dom.byId("popupDiv").style.display = "none";
	}

	//draw() function draws all TheftReports in the theftDB[]
	function draw () {
		
		//if (map.graphics){map.graphics.clear();};
		for (i=0; i<theftDB.length; i++){
			theftDB[i].draw();
		}
		
	}
	function drawPolygons () {
		
		//if (map.graphics){map.graphics.clear();};
		for (i=0; i<polygonDB.length; i++){
			polygonDB[i].draw();
		}
		polyGraphics.hide();
		dom.byId("hotspotsCheckBox").checked=false;
	}
	
	function drawBikePaths () {
		
		//if (map.graphics){map.graphics.clear();};
		for (i=0; i<bikePathDB.length; i++){
			bikePathDB[i].draw();
		}
		bikePathGraphics.hide();
		dom.byId("bikePathsCheckBox").checked=false;
	}
	
	function closestDist (){
		var minEuclidDist;
		var closestIndex=0;
		
		var x0Dist = theftDB[0].pt.x - currLoc.x;
		var y0Dist = theftDB[0].pt.y - currLoc.y;
		
		minEuclidDist = Math.sqrt((x0Dist*x0Dist)+(y0Dist*y0Dist));
		
		for (i=0; i<theftDB.length; i++){
			var xDist = theftDB[i].pt.x - currLoc.x;
			
			var yDist = theftDB[i].pt.y - currLoc.y;
			
			
			var euclidDist = Math.sqrt((xDist*xDist)+(yDist*yDist));
			
			if (euclidDist<minEuclidDist) {
				minEuclidDist = euclidDist;
				closestIndex = i;
			};	
		} //end for loop
		map.centerAndZoom(theftDB[closestIndex].pt,17);
		
		theftDB[closestIndex].pt.emit("click");
		
		//addGraphic(theftDB[closestIndex].pt);
		
	}
	function orientationChanged() {
          if(map){
            map.reposition();
            map.resize();
          }
        }
		
		//geolocation to run at map load

        function initFunc(map) {
          if( navigator.geolocation ) {  
            navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
			
			//watches for movement and updates current location
            watchId = navigator.geolocation.watchPosition(watchLocation, locationError); //Turns off watchPosition when commented
          } else {
            alert("Browser doesn't support Geolocation. Visit http://caniuse.com to see browser support for the Geolocation API.");
          }
        }
//error handling for geolocation
        function locationError(error) {
          //error occurred so stop watchPosition
          if( navigator.geolocation ) {
            navigator.geolocation.clearWatch(watchId);
          }
          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert("Location not provided");
              break;

            case error.POSITION_UNAVAILABLE:
              alert("Current location not available");
              break;

            case error.TIMEOUT:
              alert("Timeout");
              break;

            default:
              alert("unknown error");
              break;
          }
        }
//helper function
        function zoomToLocation(location) {
          var pt = new Point(location.coords.longitude, location.coords.latitude);
          addGraphic(pt);
          map.centerAndZoom(pt, 15);
		  currLoc = pt;
		  
		  
        }

//add graphic to map; helper for adding points	    
		function addGraphic(pt, attributes, info){
          var symbol = new SimpleMarkerSymbol(
            SimpleMarkerSymbol.STYLE_CIRCLE, 
            12, 
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([210, 105, 30, 0.5]), 
              8
            ), 
            new Color([210, 105, 30, 0.9])
          );
          graphic = new Graphic(pt, symbol, attributes, info);
          map.graphics.add(graphic);
        }
	
	function watchLocation(location) {
          //zoom to the users location and add a graphic
          var pt = new Point(location.coords.longitude, location.coords.latitude);
          if ( !graphic ) {
            addGraphic(pt);
          } else { // move the graphic if it already exists
            graphic.setGeometry(pt);
			currLoc = pt;
          }
        }
	
	//helper 	
        function showLocation(location) {
          //zoom to the users location and add a graphic
          var pt = new Point(location.coords.longitude, location.coords.latitude);
          if ( !graphic ) {
            addGraphic(pt);
          } else { // move the graphic if it already exists
            graphic.setGeometry(pt);
          }
          map.centerAt(pt);
        }
		
	//load all points
	function loadAllPoints(){
		var dataObject;
		theftDB=[];
	//this function grabs a 'snapshot' of all the data in Firebase, then navigates down to the 'features' child. It then iterates through all the
	//children under 'attributes' and retrieves all attribute data. Then it converts them to strings or numbers and calls addPoint to map them
		myFirebase.on("value", function(snapshot) {
		dataObject = snapshot;
		
		//iterate through each child in the datasnapshot
		dataObject.forEach(function(childSnapshot){
			
			//grabs each attribute from the firebase children, and converts to respective types (Number or String)
			var xcoord = Number(childSnapshot.child("Longitude").val());
			var ycoord = Number(childSnapshot.child("Latitude").val());
			var reported = String(childSnapshot.child("Reported").val());
			var time = String(childSnapshot.child("Time").val());
			var cable = String(childSnapshot.child("Cable").val());
			var chain = String(childSnapshot.child("Chain").val());
			var city = String(childSnapshot.child("City").val());
			var month = String(childSnapshot.child("Month").val());
			var prov = String(childSnapshot.child("Province").val());
			var type = String(childSnapshot.child("Theft Type").val());
			var year = String(childSnapshot.child("Year").val());
			var ctry = String(childSnapshot.child("Country").val());
			var access = String(childSnapshot.child("Accessories").val());
			var handle = String(childSnapshot.child("Handlebars").val());
			var pedal = String(childSnapshot.child("Pedal").val());
			var seat = String(childSnapshot.child("Seat").val());
			var wheel = String(childSnapshot.child("Wheel").val());
			var uLock = String(childSnapshot.child("U-Lock").val());
			var wLock = String(childSnapshot.child("Wheel Lock").val());
			var unlocked = String(childSnapshot.child("Unlocked").val());
			

			
			var theft = new TheftReport(xcoord, ycoord, type, reported, year, month, time, city, prov, ctry, access, handle, pedal, seat, wheel, uLock, chain, cable, wLock, unlocked);
			
			//add the newly created hotspot to the theftDB array
			theftDB.push(theft);
		});
		//how many children do i have?
		var numberofchild = dataObject.numChildren();
		console.log(numberofchild);
		draw();
		
			console.log(theftDB[theftDB.length]);
		dataObject = null;
		}, function (errorObject) {
		console.log("The read failed: " + errorObject.code);
	});//end firebase.on()
	}//end loadAllPoints
	
	//load all polygons (hotspots)
	function loadPolygons(){
		var dataObject;
		polygonDB=[];
	//this function grabs a 'snapshot' of all the data in Firebase, then navigates down to the 'features' child. It then iterates through all the
	//children under 'attributes' and retrieves all attribute data. Then it converts them to strings or numbers and calls addPoint to map them
		hotspotFB.on("value", function(snapshot) {
		dataObject = snapshot;
		
		//iterate through each child in the datasnapshot
		dataObject.forEach(function(childSnapshot){
			
			//grabs each attribute from the firebase children, and converts to respective types (Number or String)
			var attributes = childSnapshot.child("attributes").val();
			//console.log(attributes);
			var rings = childSnapshot.child("geometry").child("rings").val();
			//console.log(JSON.stringify(geometry));
						
			var polygon = new TheftPolygon(attributes, rings);
			//console.log(polygon.polygon);
			//add the newly created hotspot to the theftDB array
			polygonDB.push(polygon);
			
		});
		//how many children do i have?
		var numberofchild = dataObject.numChildren();
		console.log(numberofchild);
		drawPolygons();
		
			console.log(polygonDB[polygonDB.length]);
		dataObject = null;
		}, function (errorObject) {
		console.log("The read failed: " + errorObject.code);
	});//end firebase.on()
	
	}//end loadPolygons

//load all bike paths
	function loadBikePaths(){
		var dataObject;
		bikePathDB=[];
	//this function grabs a 'snapshot' of all the data in Firebase, then navigates down to the 'features' child. It then iterates through all the
	//children under 'attributes' and retrieves all attribute data. Then it converts them to strings or numbers and calls addPoint to map them
		bikePathFB.on("value", function(snapshot) {
		dataObject = snapshot;
		
		//iterate through each child in the datasnapshot
		dataObject.forEach(function(childSnapshot){
			
			//grabs each attribute from the firebase children, and converts to respective types (Number or String)
			var attributes = childSnapshot.child("attributes").val();
			//console.log(attributes);
			var rings = childSnapshot.child("geometry").child("rings").val();
			//console.log(JSON.stringify(geometry));
						
			var polygon = new BikePathPolygon(attributes, rings);
			//console.log(polygon.polygon);
			//add the newly created BikePathPolygon to the bikePathDB array
			bikePathDB.push(polygon);
			
		});
		//how many children do i have?
		var numberofchild = dataObject.numChildren();
		console.log(numberofchild);
		drawBikePaths();
		
			console.log(bikePathDB[bikePathDB.length]);
		dataObject = null;
		}, function (errorObject) {
		console.log("The read failed: " + errorObject.code);
	});//end firebase.on()
	
	}//end loadBikePaths
	
	function pushToFirebase(theft){
		myFirebase.push({"Accessories":theft.access,"Cable":theft.cable,"Chain":theft.chain,"City":theft.city,"Country":theft.ctry,"Handlebars":theft.handle,"Latitude":theft.pt.y,"Longitude":theft.pt.x,"Month":theft.month,"Pedal":theft.pedal,"Province":theft.prov,"Reported":theft.reported,"Seat":theft.seat,"Theft Type":theft.type,"Time":theft.time,"U-Lock":theft.uLock,"Unlocked":theft.unlocked,"Wheel":theft.wheel,"Wheel Lock":theft.wLock,"Year":theft.year,"userAdded":true});
		loadAllPoints();
	}
        
        
      });//end esri arcGIS map domain
	  //end javascript

	  


