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
}).setView([42.25847871, -71.81544179], 8);

// Construct the chroma color interpolator using bezier curves.
var interpolator = chroma.interpolate.bezier(['#f1e4e1', '#6e1315']);

// Also correct lightness. See https://github.com/gka/chroma.js for more information.
var scale = chroma.scale(interpolator).correctLightness(true);

var popup;

// Return default style based on feature properties.
function style(feature) {

	var out = feature.properties.out;
	var total = feature.properties.total;

	var pct = (out && out > 0) ? out/total : 0;

	var color = out > 0 ? scale(pct).hex() : '#FFF';

	return {
		weight: 0.05,
		color: '#000',
		opacity: 1,
		fillOpacity: 1,
		fillColor: color
	};
}

function getPopupContent(feature) {
	var town = feature.properties.TOWN.toLowerCase();

	var outages = _.chain(feature.properties.companies)
		.map(function(company) {
			return '<p class="outages">' + company.Company + ': ' + numberWithCommas(company['Cust. Out']) + ' outages</p>';
		})
		.value().join('');

	return '<p class="town">' + town + '</p>' + (outages || '<p class="none">No outages reported</p>');
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

var geojson;

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

// Get outages data.
window.outages = function(data) {

	var towns = data.towns;
	var dates = data.dates;

	// Convert towns topojson to geojson.
	var townsTopojson = require('../../../data/output/TOWNS.json');
	var townsGeojson = topojson.feature(townsTopojson, townsTopojson.objects.TOWNS);

	// Bind outages data to towns.
	towns.forEach(function(town) {

		var match = _.find(townsGeojson.features, function(feature) {
			return feature.properties.TOWN === town.town;
		});

		// Calculate total customers.
		var total = _.chain(town.companies)
			.pluck('Total Cust.')
			.reduce(function(a, b) {
				return a + b;
			})
			.value();

		var out = _.chain(town.companies)
			.pluck('Cust. Out')
			.reduce(function(a, b) {
				return a + b;
			})
			.value();

		match.properties.out = out;
		match.properties.total = total;
		match.properties.companies = town.companies;
	});

	var OUT = _.chain(townsGeojson.features)
		.map(function(feature) {
			return feature.properties.out;
		})
		.filter(function(out) {
			return out;
		})
		.reduce(function(a, b) {
			return a + b;
		})
		.value();

	// Populate the 'totals' element.
	$('.subhed .totals span').html(numberWithCommas(OUT));

	var popup;

	// Add towns color layer to map.
	geojson = L.geoJson(townsGeojson, {
		style: style,
		onEachFeature: function(feature, layer) {
			layer.on({
				mouseover: highlightFeature,
				click: highlightFeature
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

	// Construct a new date with no minutes or seconds.
	var date = new Date(_.chain(dates)
		.pluck('date')
		.sortBy(function(date) {
			return date;
		})
		.first()
		.value());

	var hourDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());

	// Populate the 'updated' element.
	$('.updated-timestamp').html('Updated ' + [APDateTime.time(hourDate), APDateTime.date(hourDate)].join(', '));

};

$.ajax({
	url: 'http://www.bostonglobe.com/partners/outagescraper/outages.json',
	dataType: 'jsonp',
	jsonpCallback: 'outages'
});