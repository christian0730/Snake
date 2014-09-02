define(['../lib/underscore', '../lib/impulse', '../lib/keymaster', 'field', 'entities', 'fullscreen'], function(_, Impulse, key, Field, Entities, Fullscreen) {
	"use strict";

	// imports

	var Camera = Impulse.Scene2D.Camera;
	var EventDelegate = Impulse.Util.EventDelegate;
	var LinearSG = Impulse.Scene2D.LinearSG;
	var Scene = Impulse.Scene2D.Scene;
	var Vector = Impulse.Shape2D.Vector;

	var SnakeGame = function(canvasLayer1) {
		this._canvasLayer1 = canvasLayer1;

		// init event delegates
		this.onLost = new EventDelegate();
		this.onPaused = new EventDelegate();
		this.onScoreChanged = new EventDelegate();

		// start animating
		requestAnimationFrame(_.bind(this.render, this));

		// init keyboard hooks
		this._initKeyboard();
	};

	SnakeGame.prototype = {

		// members

		get isPaused() {
			return this._isPaused;
		},
		set isPaused(isPaused) {
			if (this._isLost && !isPaused)
				return;

			this._isPaused = isPaused;
			this.onPaused.dispatch(isPaused);
		},
		get speed() {
			return this._speed;
		},
		set speed(speed) {
			this._speed = speed;

			if (this._interval !== undefined)
				clearInterval(this._interval);

			this._interval = setInterval(_.bind(this.update, this), 250 / speed);
		},

		// private methods

		_initKeyboard: function() {
			key('space', _.bind(function() { this.isPaused = !this.isPaused; }, this));
			if (Fullscreen.canFullscreen())
				key('f', Fullscreen.toggleFullscreen);
		},

		// public methods

		render: function() {
			//if (this._scene0 !== undefined)
			//	this._scene0.render();

			if (this._field !== undefined)
				this._field.render();

			requestAnimationFrame(_.bind(this.render, this));
		},
		reset: function(w, h, speed) {
			// defaults
			if (w === undefined)
				w = 21;
			if (h === undefined)
				h = 15;
			if (speed === undefined)
				speed = 1.0;

			// pause the game
			this.isPaused = true;
			this._isLost = false;

			// reset speed
			this.speed = speed;

			// reset score
			this._score = 0;
			this.onScoreChanged.dispatch(0, localStorage.highScore || 0);

			// init camera (layer 1)
			var cam1 = new Camera(this._canvasLayer1, 0, 0, (w + 0.5) * 120, (h + 0.5) * 120, 60);

			// init game field
			this._field = new Field(w, h, 120, cam1);
			this._field.onGrew.add(_.bind(function(field) {
				// update score
				this._score += 10 * this.speed * this.speed;
				localStorage.highScore = Math.max(localStorage.highScore || 0, this._score);
				this.onScoreChanged.dispatch(this._score, localStorage.highScore);

				// increase simulation speed
				this.speed *= 1.025;
			}, this));
			this._field.onLost.add(_.bind(function(field) {
				this.isPaused = true;
				this._isLost = true;
				this.onLost.dispatch();
			}, this));
		},
		update: function() {
			if (this.isPaused)
				return;

			if (this._field !== undefined)
				this._field.update();
		}
	} // prototype

	// export SnakeGame class
	return SnakeGame;
});