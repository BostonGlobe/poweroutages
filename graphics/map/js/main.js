// Require libraries.
var Leaflet    = require('leaflet');
var topojson   = require('topojson');
var APDateTime = require('../../../common/js/APDateTime.js');

// Convenience variables.
var master = $('.igraphic-graphic.map');
var $map = $('.content .map', master);

// Create the Leaflet map.
var map = L.map($map.get(0), {
	attributionControl: false,
	scrollWheelZoom: false
}).setView([42.30841962, -71.05532837], 12);

// Convert towns topojson back to geojson.
var townsTopojson = require('../../../data/output/TOWNS.json');
var towns = topojson.feature(townsTopojson, townsTopojson.objects.TOWNS);

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

var colors = ['#ffffff', '#ffd2c9', '#ffa093', '#f96a5d', '#ea212d'];

function style(feature) {
	return {
		weight: 0.1,
		color: '#000',
		opacity: 1,
		fillOpacity: 1,
		fillColor: colors[getRandomInt(1, colors.length)]
	};
}

function highlightFeature(e) {
	var layer = e.target;
	layer.setStyle({
		weight: 5
	});

	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}	
}

function resetHighlight(e) {
	geojson.resetStyle(e.target);
}

function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight
	});
}

// Add towns color layer to map.
var geojson = L.geoJson(towns, {
	style: style,
	onEachFeature: onEachFeature
}).addTo(map);

var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);

var topLayer = L.tileLayer('http://{s}.tiles.mapbox.com/v3/gabriel-florit.207de5da/{z}/{x}/{y}.png', {
	minZoom: 7,
	maxZoom: 13
}).addTo(map);

topPane.appendChild(topLayer.getContainer());

topLayer.setZIndex(7);


// // Add towns outline/interaction layer to map.
// L.geoJson(towns, {
// 	style: function(feature) {
// 		return {
// 			color: '#000',
// 			weight: 1,
// 			opacity: 1
// 		};
// 	},
// 	className: 'gabriel'
// 	// ,
// 	// onEachFeature: function(feature, layer) {
// 	// 	layer.on({
// 	// 		mouseover: function(e) {
// 	// 		}
// 	// 	});
// 	// }
// }).addTo(map);

// Get outages data.
// var outages = require('../../../outages.json');

// Group data by town.
// var data = _.chain(outages)
// 	.map(function(company) {
// 		var name = company.company;

// 		company.towns = company.towns.map(function(town) {
// 			town.Company = name;
// 			return town;
// 		});

// 		return company;
// 	})
// 	.pluck('towns')
// 	.flatten()
// 	.groupBy(function(town) {
// 		return town.Town;
// 	})
// 	.map(function(v, i) {

// 		var total = _.chain(v)
// 			.pluck('Cust. Out')
// 			.reduce(function(a, b) {
// 				return a + b;
// 			})
// 			.value();

// 		return {
// 			town: i.toUpperCase(),
// 			// companies: v,
// 			total: total
// 		};
// 	})
// 	.sortBy(function(v, i) {
// 		return v.town;	
// 	})
// 	.map(function(v, i) {
// 		var colors = ['#ffffff', '#ffd2c9', '#ffa093', '#f96a5d', '#ea212d'];
// 		var color = colors[0];
// 		if (v.total > 1) { color = colors[1]; }
// 		if (v.total > 2) { color = colors[2]; }
// 		if (v.total > 4) { color = colors[3]; }
// 		if (v.total > 8) { color = colors[4]; }

// 		return "  [TOWN='"+ v.town + "'] { polygon-fill: " + color + "; }";
// 	})
// 	.value().join('\n');

// $('pre').html(data);


// //



// console.log(JSON.stringify(data, null, 4));
// debugger;


// // Define the snowfall image bounds.
// var southWest = new L.LatLng(30.8, -85.7),
// 	northEast = new L.LatLng(47.58, -67),
// 	bounds = new L.LatLngBounds(southWest, northEast);

// // Add the snowfall image to the map.
// var imageLayer = L.imageOverlay('http://amzncache.boston.com/partners/maps/snowfall.png', bounds).addTo(map);

// // Create a Leaflet control for the legend.
// var MyControl = L.Control.extend({

// 	options: {
// 		position: 'topright'
// 	},

// 	onAdd: function (map) {

// 		var container = L.DomUtil.create('div', 'legend leaflet-bar');

// 		// Insert the legend contents.
// 		container.innerHTML = $('.legend', master).html();

// 		return container;
// 	}
// });

// // Only add the control if we're not on touch screens.
// if (!Modernizr.touch) {
// 	map.addControl(new MyControl());
// }

// // Get the time right now.
// var date = new Date();

// // Construct a new date with no minutes or seconds.
// var hourDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());

// // Populate the 'updated' element.
// $('.updated-timestamp').html('Updated ' + [APDateTime.time(hourDate), APDateTime.date(hourDate)].join(', '));