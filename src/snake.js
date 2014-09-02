define(['../lib/impulse'], function(Impulse) {

	// imports

	var EventDelegate = Impulse.Util.EventDelegate;
	var Vector = Impulse.Shape2D.Vector;

	// Segment class

	var Segment = function(x, y) {
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

	// Snake class

	var Snake = function(x, y, dir) {
		// generate initial snake segments, starting at (x, y) and working in backwards direction
		var previous = this._previous(dir);
		this._segments = [
			new Segment(x, y),
			new Segment(x + previous.x, y + previous.y),
			new Segment(x + previous.x * 2, y + previous.y * 2),
		];

		// cache initial direction
		this.direction = dir;

		// initialize event delegates
		this.onGrew = new EventDelegate();
		this.onMoved = new EventDelegate();
	};

	Snake.prototype = {

		// members

		get direction() {
			return this._dir;
		},
		set direction(dir) {
			if (dir === 'left' || dir === 'up' || dir === 'right' || dir === 'down')
				this._dir = dir;
			else
				throw new Error('Unknown direction ' + dir + ' specified.');
		},
		get head() {
			return this._segments[0];
		},
		get length() {
			return this._segments.length;
		},
		get position() {
			return {
				x: this._segments[0].x,
				y: this._segments[0].y
			};
		},
		get segments() {
			return this._segments;
		},
		get tail() {
			return this._segments[this._segments.length - 1];
		},

		// private methods

		_move: function(dir) {
			// pop tail off of segments
			var newHead = this._segments.pop();

			// move it to where the head should be after moving
			var next = this._next(dir);
			var head = this.head;
			newHead.x = head.x + next.x;
			newHead.y = head.y + next.y;

			// make tail the new head
			this._segments.unshift(newHead);

			// update current direction
			this._dir = dir;

			// dispatch moved delegate
			this.onMoved.dispatch(this, dir);
		},
		_next: function(dir) {
			switch (dir) {
				case 'left': return { x: -1, y: 0 };
				case 'up': return { x: 0, y: -1 };
				case 'right': return { x: 1, y: 0 };
				case 'down': return { x: 0, y: 1 };
				default: throw new Error('Undefined direction ' + dir + ' found.');
			} // switch
		},
		_previous: function(dir) {
			var next = this._next(dir);
			next.x = -next.x;
			next.y = -next.y;
			return next;
		},

		// public methods

		down: function() {
			// snake can't double back on itself
			if (this._dir === 'up')
				return;

			this._move('down');
		},
		grow: function() {
			// push new segment at the same location as tail
			var tail = this.tail;
			this._segments.push(new Segment(tail.x, tail.y));

			// dispatch grew delegate
			this.onGrew.dispatch(this);
		},
		left: function() {
			// snake can't double back on itself
			if (this._dir === 'right')
				return;

			this._move('left');
		},
		right: function() {
			// snake can't double back on itself
			if (this._dir === 'left')
				return;

			this._move('right');
		},
		up: function() {
			// snake can't double back on itself
			if (this._dir === 'down')
				return;

			this._move('up');
		}
	};

	// exports

	return Snake;
});