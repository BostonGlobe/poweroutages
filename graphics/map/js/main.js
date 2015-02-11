// Require libraries.
var Leaflet    = require('leaflet');
var topojson   = require('topojson');
var APDateTime = require('../../../common/js/APDateTime.js');
var chroma     = require('chroma-js');

// 8:14 p.m., Feb. 9, 2015
function shortenedDateTime(date) {

	var display = APDateTime.time(date);
	var now = new Date(Date.now());
	var daysDelta = now.getDate() - date.getDate();

	// if date is today, only display time
	if (daysDelta > 0) {
		// but remove the year
		display += [', ', APDateTime.date(date).split(', ')[0]].join('');
	}

	return display;
}

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

			var companyOutages = company['Cust. Out'];
			var companyCustomers = company['Total Cust.'];
			var pct = Math.floor(100*companyOutages/companyCustomers);

			var label = companyOutages > 1 ? 'outages' : 'outage';

			return '<p class="outages">' + company.Company + ': ' + numberWithCommas(company['Cust. Out']) + ' ' + label + ' (' + pct + '%)</p>';
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

	var statewideTotals = _.chain(towns)
		.pluck('companies')
		.flatten()
		.pluck('Cust. Out')
		.reduce(function(a, b) {
			return a + b;
		})
		.value();

	var outagesByCompany = _.chain(towns)
		.pluck('companies')
		.flatten()
		.groupBy('Company')
		.map(function(outages, company) {

			var totals = _.chain(outages)
				.pluck('Cust. Out')
				.reduce(function(a, b) {
					return a + b;
				})
				.value();

			return {
				company: company,
				outages: totals
			};
		})
		.value();

	var companiesHtml = _.chain(dates)
		.map(function(v) {
			var outages = _.find(outagesByCompany, {company: v.company});
			v.outages = outages ? outages.outages : 0;
			return v;
		})
		.sortBy('company')
		.map(function(v) {

			var date = new Date(v.date);
			var displayDate = shortenedDateTime(date);
			var label = v.outages === 1 ? 'outage' : 'outages';

			return '<li><span class="util-name">' + v.company + '</span><span class="util-outageinfo">' + numberWithCommas(v.outages) + ' ' + label + ' as of ' + displayDate + '</span></li>';
		})
		.value().join('');

	// Populate the 'totals' element.
	$('.subhed .totals .totals-outage-no').html(numberWithCommas(statewideTotals));
	$('.subhed ul').html(companiesHtml);

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
};

$.ajax({
	url: 'http://www.bostonglobe.com/partners/outagescraper/outages.json',
	dataType: 'jsonp',
	jsonpCallback: 'outages'
});