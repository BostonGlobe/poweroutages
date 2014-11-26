(function() { globe.onDefine('window.jQuery && $(".igraphic-graphic.map").length', function() {

	var masterSelector = '.igraphic-graphic.map';
	var master = $(masterSelector);

	var hed = $('.hed', master);
	if (hed.length) {
		$('.header .main-hed').html(hed.html());
	}

	var subhed = $('.subhed', master);
	if (subhed.length) {
		$('.header .subhed').html(subhed.html());
	}

	$('.header').addClass('visible');

	var mobileHeader = require('../../../common/js/GlobeMobileHeader.js');

	if (Modernizr.touch) {
		mobileHeader({
			bodyElements: $('.content', master),
			drawerElements: $('.igraphic-graphic.map .source-and-credit, .header .subhed')
		});
	}


	require('./main.js');

}); }());