// Require libraries.
var Leaflet    = require('leaflet');
var topojson   = require('topojson');
var APDateTime = require('../../../common/js/APDateTime.js');
var chroma     = require('chroma-js');

// Convenience variables.
var master = $('.igraphic-graphic.map');
var $map = $('.content .map', master);

// Create the Leaflet map.
var map = L.map($map.get(0), {
	attributionControl: false,
	scrollWheelZoom: false
}).setView([42.30841962, -71.05532837], 8);

// Get outages data.
var outages = require('../../../../outages_scraper/outages.json');

// Convert towns topojson to geojson.
var townsTopojson = require('../../../data/output/TOWNS.json');
var towns = topojson.feature(townsTopojson, townsTopojson.objects.TOWNS);

// Bind outages data to towns.
outages.forEach(function(outage) {

	var match = _.find(towns.features, function(town) {
		return town.properties.TOWN === outage.town;
	});

	match.properties.out = outage.out;
	match.properties.total = outage.total;
});

// Construct the chroma color interpolator using bezier curves.
var interpolator = chroma.interpolate.bezier(['#FFFFFF', '#6e1315']);

// Also correct lightness. See https://github.com/gka/chroma.js for more information.
var scale = chroma.scale(interpolator).correctLightness(true);

// Return default style based on feature properties.
function style(feature) {

	var out = feature.properties.out;
	var total = feature.properties.total;

	var pct = (out && out > 0) ? out/total : 0;

	var color = scale(pct).hex();

	return {
		weight: 0.05,
		color: '#000',
		opacity: 1,
		fillOpacity: 1,
		fillColor: color
	};
}

var popup;

function getPopupContent(feature) {
	var town = feature.properties.TOWN.toLowerCase();
	var outages = numberWithCommas(feature.properties.out || 0);
	return '<p class="town">' + town + '</p><p class="outages">Outages: ' + outages + '</p>';
}

function numberWithCommas(x) {
	var parts = x.toString().split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}

// Return highlight style.
function highlightFeature(e) {

	// Reset all features.
	geojson.eachLayer(function(layer) {
		if (layer.feature.properties.selected) {
			geojson.resetStyle(layer);
			layer.feature.properties.selected = false;
		}
	});

	var layer = e.target;

	var content = getPopupContent(layer.feature);

	if (popup) {
		popup
			.setLatLng(e.latlng)
			.setContent(content);
	} else {
		popup = L.popup({
				autoPan: false,
				closeButton: false,
				closeOnClick: false,
				offset: L.point(0, -20)
			})
			.setLatLng(e.latlng)
			.setContent(content)
			.openOn(map);
	}

	var defaultStyle = style(layer.feature);

	var fill = chroma(defaultStyle.fillColor).darken(50).hex();

	layer.setStyle({
		fillColor: fill
	});

	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}

	layer.feature.properties.selected = true;
}

// Reset style back to default.
function resetHighlight(e) {
	geojson.resetStyle(e.target);
}

// Add towns color layer to map.
var geojson = L.geoJson(towns, {
	style: style,
	onEachFeature: function(feature, layer) {
		layer.on({
			mouseover: highlightFeature
		});
	}
}).addTo(map);

// Unorthodox layer creation so we can have baselayer above interaction layer.
// This comes from http://bl.ocks.org/rsudekum/5431771.
var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
var topLayer = L.tileLayer('http://{s}.tiles.mapbox.com/v3/gabriel-florit.207de5da/{z}/{x}/{y}.png', {
	minZoom: 7,
	maxZoom: 13
}).addTo(map);
topPane.appendChild(topLayer.getContainer());
topLayer.setZIndex(6);


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

// // Get the time right now.
// var date = new Date();

// // Construct a new date with no minutes or seconds.
// var hourDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());

// // Populate the 'updated' element.
// $('.updated-timestamp').html('Updated ' + [APDateTime.time(hourDate), APDateTime.date(hourDate)].join(', '));


































