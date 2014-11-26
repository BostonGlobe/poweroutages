// Require libraries.
var Leaflet = require('leaflet');
var APDateTime = require('../../../common/js/APDateTime.js');

// Convenience variables.
var master = $('.igraphic-graphic.map');
var $map = $('.content .map', master);

// Create the Leaflet map.
var map = L.map($map.get(0), {attributionControl: false}).setView([42.25841962, -71.81532837], 6);

// Add the MapBox baselayer to our map.
L.tileLayer('http://{s}.tiles.mapbox.com/v3/gabriel-florit.baselayer_land/{z}/{x}/{y}.png', {
	minZoom: 5,
	maxZoom: 10
}).addTo(map);

// Define the snowfall image bounds.
var southWest = new L.LatLng(30.8, -85.7),
	northEast = new L.LatLng(47.58, -67),
	bounds = new L.LatLngBounds(southWest, northEast);

// Add the snowfall image to the map.
var imageLayer = L.imageOverlay('http://amzncache.boston.com/partners/maps/snowfall.png', bounds).addTo(map);

// Create a Leaflet control for the legend.
var MyControl = L.Control.extend({

	options: {
		position: 'topright'
	},

	onAdd: function (map) {

		var container = L.DomUtil.create('div', 'legend leaflet-bar');

		// Insert the legend contents.
		container.innerHTML = $('.legend', master).html();

		return container;
	}
});

// Only add the control if we're not on touch screens.
if (!Modernizr.touch) {
	map.addControl(new MyControl());
}

// Get the time right now.
var date = new Date();

// Construct a new date with no minutes or seconds.
var hourDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());

// Populate the 'updated' element.
$('.updated-timestamp').html('Updated ' + [APDateTime.time(hourDate), APDateTime.date(hourDate)].join(', '));