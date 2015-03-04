// JavaScript Document


var map;
var mapURL;
var mapSettings = {center: [long, lat], zoom: 12, basemap: "streets" }
var graphic;
var layer;
var defaultSymbol;
var lat;
var long;
var currLocation;

var requirements = ["esri/map", "dojo/domReady!", "esri.dijit/LocateButton", "esri/geometry", "esri/geometry/Point", "esri/graphic", "esri/color", "esri/InfoTemplate", "esri/symbols/SimpleFillSymbol"]

long = "-73.5673";
lat = "45.5017";

require(requirements, function(Map, LocateButton, Point, SimpleMarkerSymbol, SimpleLineSymbol,Graphic, Color, Geometry,Polyline, Polygon, SimpleFillSymbol, InfoTemplate) {
	map = new esri.Map("map", mapSettings);
	
	
});
	
function geoLocator(){	
	geoLocate = new LocateButton({map: map}, "LocateButton");
    geoLocate.startup();
	
}

function orientationChanged() {
	if(map){
	  map.reposition();
	  map.resize();
	}
}

function initFunc(map) {
	if( navigator.geolocation ) {  
	  navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
	  //watchId = navigator.geolocation.watchPosition(showLocation, locationError); //Turns off watchPosition when commented
	} 
	else {
	  alert("Browser doesn't support Geolocation. Visit http://caniuse.com to see browser support for the Geolocation API.");
	}
}

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

function zoomToLocation(location) {
	var pt = new Point(location.coords.longitude, location.coords.latitude);
	addGraphic(pt);
	map.centerAndZoom(pt, 15);
}

function addPoint(x, y){
   var point = new esri.geometry.Point(x, y);
   var mp = esri.geometry.geographicToWebMercator(point);
   point = new esri.geometry.Point({ "x": mp.x, "y": mp.y});
   var graphic = new esri.Graphic(point, defaultSymbol);
   map.graphics.add(graphic);
}

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

function addGraphic(pt){
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
	graphic = new Graphic(pt, symbol);
	map.graphics.add(graphic);
}


function findClosest() {
	alert("No Locations loaded!");
}
dojo.addOnLoad(Init);