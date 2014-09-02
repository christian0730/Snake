define(function() {
	var canFullscreen = function() {
		return (
			document.fullscreenEnabled || 
			document.webkitFullscreenEnabled || 
			document.mozFullScreenEnabled ||
			document.msFullscreenEnabled
		);
	};

	var enterFullscreen = function() {
		var doc = document.documentElement;
		var rfs = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
		rfs.call(doc);
	};

	var exitFullscreen = function() {
		var efs = document.exitFullscreen ||document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
		efs.call(document);
	};

	var isFullscreen = function() {
		return (
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		) !== undefined;
	};

	var toggleFullscreen = function() {
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