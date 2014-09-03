// This file defines several HTML5 fullscreen utility methods

define(function() {
	var canFullscreen = function() {
		// return true if fullscreen API is supported
		return (
			document.fullscreenEnabled || 
			document.webkitFullscreenEnabled || 
			document.mozFullScreenEnabled ||
			document.msFullscreenEnabled
		);
	};

	var enterFullscreen = function() {
		// enter fullscreen mode, using the entire HTML document as the target
		var doc = document.documentElement;
		var rfs = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
		rfs.call(doc);
	};

	var exitFullscreen = function() {
		// exit fullscreen, requires no target
		var efs = document.exitFullscreen ||document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
		efs.call(document);
	};

	var isFullscreen = function() {
		// return true if the browser is currently in fullscreen mode
		return (
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		) !== undefined;
	};

	var toggleFullscreen = function() {
		// toggle fullscreen mode depending on the result of isFullscreen()
		if (isFullscreen())
			exitFullscreen();
		else
			enterFullscreen();
	};

	return {
		canFullscreen: canFullscreen,
		enterFullscreen: enterFullscreen,
		exitFullscreen: exitFullscreen,
		isFullscreen: isFullscreen,
		toggleFullscreen: toggleFullscreen
	};
});