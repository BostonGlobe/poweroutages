(function() { globe.onDefine('window.jQuery && $(".igraphic-graphic.map").length', function() {

	require('./templates/templates.js');

	var masterSelector = '.igraphic-graphic.map';
	var master = $(masterSelector);

	var hed = $('.hed', master);
	if (hed.length) {
		$('.header .main-hed').html(hed.html());
	}

	var subhed = $('.subhed', master);
	if (subhed.length) {

		$('.header').append('<div class="subhed">' + subhed.html() + '</div>');
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