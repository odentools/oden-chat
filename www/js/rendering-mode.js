(function () {

addEventListener(window, "load", print_rendering_mode);

function print_rendering_mode() {
	if( ! document.getElementById("rendering-mode") ) {
		return;
	}
	var mode = "";
	if( document.documentMode === undefined ) {
		if(document.compatMode == "CSS1Compat") {
			mode = "Standards-compliance mode";
		} else {
			mode = "Quirks mode";
		}
	} else {
		if(document.documentMode == 5) {
			mode = "IE Quirks mode";
		} else if(document.documentMode == 7) {
			mode = "IE7 Standards-compliance mode";
		} else if(document.documentMode == 8) {
			mode = "IE8 Standards-compliance mode";
		} else {
			mode = "unknown";
		}
	}
	document.getElementById("rendering-mode").innerHTML = mode;
}

function addEventListener(elm, type, func) {
	if(! elm) { return false; }
	if(elm.addEventListener) {
		elm.addEventListener(type, func, false);
	} else if(elm.attachEvent) {
		/* thanks to http://ejohn.org/projects/flexible-javascript-events/ */
		elm['e'+type+func] = func;
		elm[type+func] = function(){elm['e'+type+func]( window.event );}
		elm.attachEvent( 'on'+type, elm[type+func] );
	} else {
		return false;
	}
	return true;
}

})();
