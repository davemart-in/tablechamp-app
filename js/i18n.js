(function($){
	var lang = localStorage.getItem('lang') || 'en';
	// Load language file
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.async = false;
	script.src = 'i18n/' + lang + '.js';
	head.appendChild(script);
	// Add to body
	$('body').addClass(lang);
})(jQuery);