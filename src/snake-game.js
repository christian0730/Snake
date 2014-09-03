// This file contains the SnakeGame definition. It contains all of the game state,
// either itself or via a Field class instance. This class is the entry point
// into the snake game simulation.

define(['../lib/underscore', '../lib/impulse', '../lib/keymaster', 'field', 'entities', 'fullscreen'], function(_, Impulse, key, Field, Entities, Fullscreen) {
	"use strict";

	// imports

	var Camera = Impulse.Scene2D.Camera;
	var EventDelegate = Impulse.Util.EventDelegate;
	var LinearSG = Impulse.Scene2D.LinearSG;
	var Scene = Impulse.Scene2D.Scene;
	var Vector = Impulse.Shape2D.Vector;

	// SnakeGame class

	var SnakeGame = function(canvasLayer1) {
		// cache the render target HTML canvas
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
			// don't allow unpausing if the player lost
			if (this._isLost && !isPaused)
				return;

			// change pause state, and dispatch event
			this._isPaused = isPaused;
			this.onPaused.dispatch(isPaused);
		},
		get speed() {
			return this._speed;
		},
		set speed(speed) {
			this._speed = speed;

			// clear any existing simulation update interval
			if (this._interval !== undefined)
				clearInterval(this._interval);

			// reset the simulation update interval to refect the new speed
			// normal update interval is 250ms
			this._interval = setInterval(_.bind(this.update, this), 250 / speed);
		},

		// private methods

		_initKeyboard: function() {
			// init pause and fullscreen keybindings
			key('space', _.bind(function() { this.isPaused = !this.isPaused; }, this));

			// check fullscreen support exists before binding fullscreen key
			if (Fullscreen.canFullscreen())
				key('f', Fullscreen.toggleFullscreen);
		},

		// public methods

		render: function() {
			// render the current simulation
			if (this._field !== undefined)
				this._field.render();

			// request a re-render at the next opportunity
			requestAnimationFrame(_.bind(this.render, this));
		},
		reset: function(w, h, speed) {
			// init defaults
			if (w === undefined)
				w = 21;
			if (h === undefined)
				h = 15;
			if (speed === undefined)
				speed = 1.0;

			// pause the game
			this.isPaused = true;

			// make sure lost flag is unset
			this._isLost = false;

			// reset speed
			this.speed = speed;

			// reset score
			this._score = 0;
			this.onScoreChanged.dispatch(0, localStorage.highScore || 0);

			// init Impulse camera
			var cam1 = new Camera(this._canvasLayer1, 0, 0, (w + 0.5) * 120, (h + 0.5) * 120, 60);

			// init game field
			this._field = new Field(w, h, 120, cam1);

			// hook into grew event so we can handle scoring
			this._field.onGrew.add(_.bind(function(field) {
				// update score
				this._score += 10 * this.speed * this.speed;
				localStorage.highScore = Math.max(localStorage.highScore || 0, this._score);
				this.onScoreChanged.dispatch(this._score, localStorage.highScore);

				// increase simulation speed
				this.speed *= 1.025;
			}, this));

			// hook into the lost event so we can stop the simulation
			this._field.onLost.add(_.bind(function(field) {
				this.isPaused = true;
				this._isLost = true;
				this.onLost.dispatch();
			}, this));
		},
		update: function() {
			// break if simulation is paused
			if (this.isPaused)
				return;

			// proceed to next simulation state
			if (this._field !== undefined)
				this._field.update();
		}
	} // prototype

	// export SnakeGame class
	return SnakeGame;
});