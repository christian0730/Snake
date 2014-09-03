// This file defines the in-game berry class. Currently it contains only
// (x,y) coordinates, but exists mainly for future extendability

define(function() {

	// Berry class

	var Berry = function(x, y) {
		// initialize position
		if (x.x !== undefined && x.y !== undefined) {
			this.x = x.x;
			this.y = x.y;
		} // if
		else {
			this.x = x;
			this.y = y;
		} // else
	};

	return Berry;
});