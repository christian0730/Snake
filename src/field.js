// This file contains the game field class. It takes dimensions, a tileSize in
// pixels, and an Impulse camera object. It is responsible for all the game
// related logic for a specific instance of the game. The camera is responsible
// for transforming game world 'pixels' into actual screen pixels.

define(['../lib/underscore', '../lib/impulse', '../lib/keymaster', 'snake', 'berry', 'entities'], function(_, Impulse, key, Snake, Berry, Entities) {

	// imports

	var EventDelegate = Impulse.Util.EventDelegate;
	var LinearSG = Impulse.Scene2D.LinearSG;
	var Scene = Impulse.Scene2D.Scene;
	var Vector = Impulse.Shape2D.Vector;

	// constants

	var spawnBuffer = 1;

	// Field class

	var Field = function(w, h, tileSize, camera) {
		// cache parameters
		this._w = w;
		this._h = h;
		this._tileSize = tileSize;

		// create a new scene
		this._sceneGraph = new LinearSG();
		this._scene = new Scene(camera, this._sceneGraph);

		// make snake game representation
		this._snake = new Snake(w / 2 | 0, h / 2 | 0, 'down');

		// hook into snake's grew and moved events
		this._snake.onGrew.add(_.bind(this._updateSnakeVisuals, this));
		this._snake.onMoved.add(_.bind(this._updateSnakeVisuals, this));

		// init empty entities array
		this._snakeEntities = [];

		// init berry game representation
		this._berry = new Berry(0, 0);

		// init berry entity
		this._berryEntity = new Entities.Berry(new Vector(0, 0));
		this._sceneGraph.addEntity(this._berryEntity);

		// init berry to random location
		this._spawnBerry();

		// make snake visual representation
		this._updateSnakeVisuals();

		// initialize keyboard hooks
		this._initKeyboard();

		// initialize event delegates
		this.onGrew = new EventDelegate();
		this.onLost = new EventDelegate();

		// set initial next action
		this._nextAction = _.bind(this._snake.down, this._snake);
	};

	Field.prototype = {

		// private methods

		_initKeyboard: function() {
			var self = this;
			var snake = this._snake;

			// set next action function based on key pressed
			// don't allow the snake to double back on itself
			key('left', function() {
				if (snake.direction !== 'right')
					self._nextAction = _.bind(snake.left, snake);
			});
			key('up', function() {
				if (snake.direction !== 'down')
					self._nextAction = _.bind(snake.up, snake);
			});
			key('right', function() {
				if (snake.direction !== 'left')
					self._nextAction = _.bind(snake.right, snake);
			});
			key('down', function() {
				if (snake.direction !== 'up')
					self._nextAction = _.bind(snake.down, snake);
			});
		},
		_spawnBerry: function() {
			var head = this._snake.head;
			var segs = this._snake.segments;

			// Repeatedly 'guess and check' a new berry location. Don't place
			// the berry within spawnBuffer tiles of the walls or the snake's
			// head. Try again if the berry overlaps part of the snake.
			// * This theoretically could go on forever, but works well in practice
			guess: while (true) {
				// generate new random location, accounting for spawnBuffer
				this._berry.x = Math.random() * (this._w - spawnBuffer * 2) + spawnBuffer | 0;
				this._berry.y = Math.random() * (this._h - spawnBuffer * 2) + spawnBuffer | 0;

				// check for overlap with the snake
				for (var i = 1; i < segs.length; i++) {
					if (this._berry.x == segs[i].x && this._berry.y == segs[i].y)
						continue guess;
				} // for( i )

				// check for poximity to the snake's head
				if (Math.abs(this._berry.x - head.x) > spawnBuffer ||
					Math.abs(this._berry.y - head.y) > spawnBuffer)
				{
					break guess;
				} // if
			} // while

			// update the berry's backing visual representation
			var entPos = this._tileToWoldPosition(this._berry.x, this._berry.y);
			this._berryEntity.setPosition(entPos.x, entPos.y);
		},
		_tileToWoldPosition: function(x, y) {
			// translate tile coordinates into game world coordinates
			// x = tileSize*x - tileSize*width/2 + tileSize/2
			// y = -tileSize*y + tileSize*height/2 - tileSize/2
			return {
				x: this._tileSize * (x - this._w/2 + 0.5),
				y: this._tileSize * (-y + this._h/2 - 0.5)
			};
		},
		_updateSnakeVisuals: function() {
			// update the snake's backing visual representation

			var segs = this._snake.segments;

			// create new segment entities if needed
			for (var i = segs.length - this._snakeEntities.length; i > 0; i--) {
				var ent = new Entities.Segment(new Vector(0, 0));
				this._snakeEntities.push(ent);
				this._sceneGraph.addEntity(ent);
			} // for( i )

			// update in-world positions of segment entities
			for (var i = 0; i < segs.length; i++) {
				var pos = this._tileToWoldPosition(segs[i].x, segs[i].y);
				this._snakeEntities[i].setPosition(pos.x, pos.y);
			} // for( i )
		},

		// public methods

		render: function() {
			// blank the scene with solid white, then re-render
			this._scene.blank('#fff');
			this._scene.render();
		},
		update: function() {
			// do the next registered action, if available
			if (this._nextAction !== undefined)
				this._nextAction();

			// check snake head intersection with berry
			var sPos = this._snake.position;
			if (sPos.x == this._berry.x && sPos.y == this._berry.y) {
				this._snake.grow();
				this._spawnBerry();
				this.onGrew.dispatch(this);
			} // if

			// check snake head intersection with walls
			var head = this._snake.head;
			if (head.x < 0 || head.x >= this._w || head.y < 0 || head.y >= this._h) {
				this.onLost.dispatch(this);
				return;
			} // if

			// check snake head intersection with snake body
			var segs = this._snake.segments;
			for (var i = 1; i < segs.length; i++) {
				if (head.x == segs[i].x && head.y == segs[i].y) {
					this.onLost.dispatch(this);
					return;
				} // if
			} // for( i )
		}
	};

	// exports

	return Field;

});