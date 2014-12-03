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

var interpolator = chroma.interpolate.bezier(['#FFFFFF', '#6e1315']);
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

// Return highlight style.
function highlightFeature(e) {

	var layer = e.target;
	layer.setStyle({
		weight: 2
	});

	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}
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
			mouseover: highlightFeature,
			mouseout: resetHighlight
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
topLayer.setZIndex(7);