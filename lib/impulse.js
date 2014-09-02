/**
 * @license Impulse.js
 * http://www.impulsejs.com
 *
 * Copyright 2012-2013 by Dustin Brown (dustin.brown@dubrowgn.com)
 * Licensed under GPLv2 (http://www.gnu.org/licenses/gpl-2.0.html)
 */

// slightly modified to play nice with node and requirejs

define(function() {

return (function(window) {

"use strict";
var Impulse = {};



Impulse.Audio = {}; // stub

Impulse.Entity = (function() {
	// imports
	var EventDelegate = Impulse.Util.EventDelegate;
	var EventedCollection = Impulse.Util.EventedCollection;
	var Matrix = Impulse.Shape2D.Matrix;
	var ModelState = Impulse.Model2D.ModelState;
	var Vector = Impulse.Shape2D.Vector;

	var Entity = function(model, position, collidable, parent, flags) {
		this.children = new EventedCollection();
		this._collidable = collidable;
		this.flags = flags === undefined ? 0 : flags;

		this._matrix = new Matrix(1, 0, 0, 1, position.x, position.y);
		this.modelState = new ModelState(model);
		this.moved = new EventDelegate();
		this.parent = parent;
        this.rotated = new EventDelegate();
	}; // class Entity

	Entity.prototype.children = undefined;
	Entity.prototype.flags = 0;
	Entity.prototype._animation = undefined;
	Entity.prototype._animationPaused = undefined;
	Entity.prototype._animationTime = undefined;
	Entity.prototype._collidable = undefined;
	Entity.prototype.modelState = undefined;
	Entity.prototype.moved = undefined; // event(Entity2D, {dx, dy})
	Entity.prototype._matrix = undefined;
	Entity.prototype.parent = undefined;
    Entity.prototype.rotated = undefined; // event(Entity2D, dRads)
	Entity.prototype._scale = 1; // FIXME???

    // void face(Entity);
    // void face(Vector);
	Entity.prototype.face = function(vec) {
        if (vec instanceof Entity)
            vec = vec.getPosition();

		var dRads = this.getPosition().angleTo(vec) - this._matrix.getRotation();
        this._matrix.preRotate(dRads);
		this.rotated.dispatch(this, dRads);
	}; // face( )

    // Shape getCollidable();
    Entity.prototype.getCollidable = function() {
        return this._collidable.clone().applyTransform(this._matrix);
    }; // getCollidable( )

	// getAnimationState(number currentTimeMs)
	Entity.prototype.getAnimationState = function(currentTimeMs) {
		var animState = this.modelState.getAnimationState(currentTimeMs);
		animState.matrix.combine(this.getMatrix());
		return animState;
	};

	// Matrix getMatrix();
	Entity.prototype.getMatrix = function() {
		if (this.parent !== undefined)
			return this.parent.getMatrix().clone().combine(this._matrix);
		return this._matrix;
	};

	// Vector GetPosition();
	Entity.prototype.getPosition = function() {
		return new Vector(this._matrix.e, this._matrix.f);
	}; // getPosition( )

	// Number getRotation();
	Entity.prototype.getRotation = function() {
		return this._matrix.getRotation();
	}; // getRotation( )

	// void MoveForward(number);
	Entity.prototype.MoveForward = function(distance) {
		var e = {
			dx: (this._matrix.d / this._scale) * distance,
			dy: (this._matrix.b / this._scale) * distance
		};

		this._matrix.e += e.dx;
		this._matrix.f += e.dy;

		this.moved.dispatch(this, e);
	}; // MoveForward( )

	// void rotate(number);
	Entity.prototype.rotate = function(rads) {
		this._matrix.preRotate(rads);
		this.rotated.dispatch(this, rads)
	}; // rotate( )

    // void setPosition(Entity)
    // void setPosition(Vector)
    // void setPosition(Number, Number)
    Entity.prototype.setPosition = function(x, y) {
		// FIXME ???
		// seems highly suspicious that we don't take into account for scale
        if (x instanceof Entity)
            x = x.getPosition();

		var e;
        if (x instanceof Vector)
			e = { dx: x.x - this._matrix.e, dy: x.y - this._matrix.f };
		else
			e = { dx: x - this._matrix.e, dy: y - this._matrix.f };

		this._matrix.e += e.dx;
		this._matrix.f += e.dy;

		this.moved.dispatch(this, e);
	}; // setPosition( )

	// void setRotation(number);
	Entity.prototype.setRotation = function(rads) {
		var dRads = rads - this._matrix.getRotation();
        this._matrix.preRotate(dRads);
		this.rotated.dispatch(this, dRads);
	}; // setRotation( )

	// void SetScale(number);
	Entity.prototype.SetScale = function(_scale) {
		// FIXME ???
		// should probably be an event delegate for scaled...
		this._matrix.preScale(_scale / this._scale);
		this._scale = _scale;
	}; // SetScale( )

	// void StrafeRight(number);
	Entity.prototype.StrafeRight = function(_distance) {
		var e = {
			dx: (this._matrix.b / this._scale) * _distance,
			dy: (this._matrix.d / this._scale) * _distance
		};

		this._matrix.e -= e.dx;
		this._matrix.f += e.dy;

		this.moved.dispatch(this, e);
	}; // StrafeRight( )

	Entity.prototype.translate = function(dx, dy) {
		if (dx instanceof Vector) {
			this._matrix.e += dx.x;
			this._matrix.f += dx.y;
			this.moved.dispatch(this, { dx: dx.x, dy: dx.y });
		} else {
			this._matrix.e += dx;
			this._matrix.f += dy;
			this.moved.dispatch(this, { dx: dx, dy: dy });
		} // if / else
	}; // translate( )

	Entity.prototype.translateLocal = function(dx, dy) {
		var b = this._matrix.b / this._scale;
		var d = this._matrix.d / this._scale;

		var e;
		if (dx instanceof Vector)
			e = {
				dx: (d * dx.y) - (b * dx.x),
				dy: (b * dx.y) + (d * dx.x)
			};
		else
			e = {
				dx: (d * dy) - (b * dx),
				dy: (b * dy) + (d * dx)
			};

		this._matrix.e += e.dx;
		this._matrix.f += e.dy;

		this.moved.dispatch(this, e);
	}; // translateLocal( )

	return Entity;
});

/**
 * @namespace
 */
Impulse.Input = (function() {
	var Input = {};

	// imports
	var EventDelegate = Impulse.Util.EventDelegate;
	var Vector = Impulse.Shape2D.Vector;

	Input.MouseAdapter = (function() {
		var MouseButtons = Input.MouseButtons;
		var MouseState = Input.MouseState;

		var MouseAdapter = function(camera) {
			this._buttons = new MouseButtons();
			this._camera = camera;

			// initialize mouse delegates
			this.click = new EventDelegate();
			this.doubleClick = new EventDelegate();
			this.down = new EventDelegate();
			this.move = new EventDelegate();
			this.up = new EventDelegate();
			this.wheel = new EventDelegate();

			// initialize custom event handlers for this instance
			var maThis = this;

			this._onClick = function(e) {
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left && !e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle && !e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right && !e.buttons.right;
				maThis.click.dispatch(e);
			};

			this._onDoubleClick = function(e) {
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left && !e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle && !e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right && !e.buttons.right;
				maThis.doubleClick.dispatch(e);
			};

			this._onDown = function(e) {
				e.preventDefault();
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left || e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle || e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right || e.buttons.right;
				maThis.down.dispatch(e);
			};

			this._onMove = function(e) {
				maThis._updateRawPosition(e);
				e = maThis._normalizeMouseEvent(e);
				maThis._position = e.position.clone();
				maThis.move.dispatch(e);
			};

			this._onUp = function(e) {
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left && !e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle && !e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right && !e.buttons.right;
				maThis.up.dispatch(e);
			};

			this._onWheel = function(e) {
				maThis.wheel.dispatch(maThis._normalizeMouseEvent(e));
			};

			// attach to camera events
			this._onCameraEvent = function(source) {
				if (maThis._rawPosition !== undefined)
					maThis._position = maThis._camera.canvasToWorld(maThis._rawPosition);
			};

			camera.moved.add(this._onCameraEvent);
			camera.rotated.add(this._onCameraEvent);
			camera.zoomed.add(this._onCameraEvent);

			// attach mouse delegates to the canvas object
			var canvas = this._camera.getCanvas();
			canvas.addEventListener('click', this._onClick, false);
			canvas.addEventListener('contextmenu', this._onContextMenu, false);
			canvas.addEventListener('dblclick', this._onDoubleClick, false);
			canvas.addEventListener('mousedown', this._onDown, false);
			canvas.addEventListener('mousemove', this._onMove, false);
			canvas.addEventListener('mouseup', this._onUp, false);
			canvas.addEventListener('mousewheel', this._onWheel, false);
			canvas.addEventListener('DOMMouseScroll', this._onWheel, false); // firefox >= 3.5
		}; // class MouseAdapter

		MouseAdapter.prototype._camera = undefined;
		MouseAdapter.prototype._buttons = undefined;
		MouseAdapter.prototype.click = undefined;
		MouseAdapter.prototype.doubleClick = undefined;
		MouseAdapter.prototype.down = undefined;
		MouseAdapter.prototype.move = undefined;
		MouseAdapter.prototype._onCameraEvent = undefined;
		MouseAdapter.prototype._onClick = undefined;
		MouseAdapter.prototype._onDoubleClick = undefined;
		MouseAdapter.prototype._onDown = undefined;
		MouseAdapter.prototype._onMove = undefined;
		MouseAdapter.prototype._onUp = undefined;
		MouseAdapter.prototype._onWheel = undefined;
		MouseAdapter.prototype._position = undefined;
		MouseAdapter.prototype._rawPosition = undefined;
		MouseAdapter.prototype.up = undefined;
		MouseAdapter.prototype.wheel = undefined;


		MouseAdapter.prototype.destroy = function() {
			// detach mouse delegates from the canvas object
			var canvas = this._camera.getCanvas();
			canvas.removeEventListener('click', this._onClick, false);
			canvas.removeEventListener('contextmenu', this._onContextMenu, false);
			canvas.removeEventListener('dblclick', this._onDoubleClick, false);
			canvas.removeEventListener('mousedown', this._onDown, false);
			canvas.removeEventListener('mousemove', this._onMove, false);
			canvas.removeEventListener('mouseup', this._onUp, false);
			canvas.removeEventListener('mousewheel', this._onWheel, false);
			canvas.removeEventListener('DOMMouseScroll', this._onWheel, false); // firefox >= 3.5

			// detach camera delegates
			camera.moved.remove(this._onCameraEvent);
			camera.rotated.remove(this._onCameraEvent);
			camera.zoomed.remove(this._onCameraEvent);
		}; // destroy( )

		MouseAdapter.prototype.getButtons = function() {
			return this._buttons;
		}; // getButtons( )

		MouseAdapter.prototype.getPosition = function() {
			return this._position;
		}; // getPosition( )

		MouseAdapter.prototype._normalizeMouseEvent = function(e) {
			// build and return normalized event object
			return new MouseState(
				this._camera.canvasToWorld(
					e.offsetX !== undefined ? e.offsetX : e.pageX - e.currentTarget.offsetLeft,
					e.offsetY !== undefined ? e.offsetY : e.pageY - e.currentTarget.offsetTop
				),
				new MouseButtons(
					e.which === 1,
					e.which === 2,
					e.which === 3
				),
				e.wheelDelta !== undefined ? e.wheelDelta / 40 : e.detail !== undefined ? -e.detail : 0
			);
		}; // _normalizeMouseEvent( )

		MouseAdapter.prototype._onContextMenu = function (e) {
			e.preventDefault();
		}; // _onContextMenu( )

		MouseAdapter.prototype._updateRawPosition = function(e) {
			this._rawPosition = new Vector(
				e.offsetX !== undefined ? e.offsetX : e.pageX - e.currentTarget.offsetLeft,
				e.offsetY !== undefined ? e.offsetY : e.pageY - e.currentTarget.offsetTop
			);
		};

		return MouseAdapter;
	});

	Input.MouseButtons = (function() {
		var MouseButtons = function(left, middle, right) {
			this.left = left === undefined ? false : left;
			this.middle = middle === undefined ? false : middle;
			this.right = right === undefined ? false : right;
		}; // class

		MouseButtons.prototype.left = false;
		MouseButtons.prototype.middle = false;
		MouseButtons.prototype.right = false;

		return MouseButtons;
	});

	Input.MouseState = (function() {
		var MouseButtons = Input.MouseButtons;
		var Vector = Impulse.Shape2D.Vector;

		var MouseState = function(position, buttons, wheel) {
			this.buttons = buttons === undefined ? new MouseButtons() : buttons;
			this.position = position === undefined ? new Vector() : position;
			this.wheel = wheel === undefined ? 0 : wheel;
		}; // class

		MouseState.prototype.buttons = undefined;
		MouseState.prototype.position = undefined;
		MouseState.prototype.wheel = 0;

		return MouseState;
	});

	// init in correct order
	Input.MouseButtons = Input.MouseButtons();
	Input.MouseState = Input.MouseState(); // requires MouseButtons
	Input.MouseAdapter = Input.MouseAdapter(); // requires MouseButtons, MouseState

	return Input;
});

/**
 * @namespace
 */
Impulse.Model2D = (function() {
	var Model2D = {};

	// imports
	var Matrix = Impulse.Shape2D.Matrix;
	var Rect = Impulse.Shape2D.Rect;

	Model2D.Animation = function() {
		/**
		 * Creates a new Animation object.
		 * @class A class for storing and manipulating a sprite animation
		 *
		 * @public
		 * @constructor
		 * @sig Animation(Rect, Number, Number)
		 * @sig Animation(Rect, Number, Number, Matrix2D)
		 * @param {Rect} firstFrameRect
		 * @param {Number} numberOfFrames
		 * @param {Number} duration - animation duration in ms
		 * @param {Matrix} [matrix]
		 * @returns {Animation} Returns a new Animation.
		 */
		var Animation = function(firstFrameRect, numberOfFrames, duration, matrix) {
			this._firstFrameRect = firstFrameRect;
			this._numberOfFrames = numberOfFrames;
			this._frameDuration = duration / numberOfFrames;
			this.matrix = (matrix === undefined ? new Matrix() : matrix).preScale(1, -1);
		}; // class Animation

		Animation.prototype._firstFrameRect = undefined;
		Animation.prototype._frameDuration = undefined;
		Animation.prototype._numberOfFrames = undefined;
		Animation.prototype.matrix = undefined;

		/**
		 * Returns the correct frame Rect from this animation for the specified point in time.
		 *
		 * @public
		 * @sig getFrameRect(Number)
		 * @param {Number} time - time of animation in ms
		 * @returns {Rect} Returns new frame Rect
		 */
		Animation.prototype.getFrameRect = function(time) {
			var frame = ((time / this._frameDuration) | 0) % this._numberOfFrames;
			return new Rect(
				this._firstFrameRect.x + this._firstFrameRect.w * frame,
				this._firstFrameRect.y,
				this._firstFrameRect.w,
				this._firstFrameRect.h);
		}; // GetFrameRect( )

		return Animation;
	};

	Model2D.AnimationState = function() {
		var AnimationState = function(frameRect, image, matrix) {
			this.frameRect = frameRect;
			this.image = image;
			this.matrix = matrix;
		};

		AnimationState.prototype.frameRect = undefined;
		AnimationState.prototype.image = undefined;
		AnimationState.prototype.matrix = undefined;

		return AnimationState;
	};

	Model2D.Model = function() {
		// Model Model(HTMLImage);
		var Model = function(_img) {
			this.animations = [];
			this.image = _img;
		}; // class Model

		Model.prototype.animations = undefined;
		Model.prototype.image = undefined;

		return Model;
	};

	Model2D.ModelState = function() {
		var AnimationState = Model2D.AnimationState;

		var ModelState = function(model) {
			this._model = model;
		};

		ModelState.prototype._model = undefined;
		ModelState.prototype._animation = undefined;
		ModelState.prototype._animationPaused = false;
		ModelState.prototype._animationTime = 0;

		ModelState.prototype.getAnimationState = function(currentTimeMs) {
			// make sure we have an animation assigned
			if (this._animation === undefined)
				return undefined;

			// only advance animation time if the animation isn't paused
			this._animationTime += this._animationPaused ? 0 : currentTimeMs - this._animationTime;

			// return the current animation state
			return new AnimationState(
				this._animation.getFrameRect(this._animationTime),
				this._model.image,
				this._animation.matrix.clone()
			);
		};

		ModelState.prototype.playAnimation = function(animationID) {
			this._animation = this._model.animations[animationID];
			this._animationTime = 0;
		};

		ModelState.prototype.pauseAnimation = function() {
			this._animationPaused = true;
		};

		ModelState.prototype.resumeAnimation = function() {
			this._animationPaused = false;
		};

		ModelState.prototype.stopAnimation = function() {
			this._animationPaused = true;
			this._animationTime = 0;
		};

		ModelState.prototype.isAnimationPaused = function() {
			return this._animationPaused;
		};

		ModelState.prototype.isAnimationStopped = function() {
			return this._animationPaused && this._animationTime == 0;
		};

		ModelState.prototype.playSound = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.pauseSound = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.pauseSounds = function() {
			throw "not implemented";
		};

		ModelState.prototype.resumeSound = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.resumeSounds = function() {
			throw "not implemented";
		};

		ModelState.prototype.stopSound = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.stopSounds = function() {
			throw "not implemented";
		};

		ModelState.prototype.isSoundPaused = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.isSoundStopped = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.areSoundsPaused = function() {
			throw "not implemented";
		};

		ModelState.prototype.areSoundsStopped = function() {
			throw "not implemented";
		};

		return ModelState;
	};

	// init in the correct order
	Model2D.Animation = Model2D.Animation();
	Model2D.AnimationState = Model2D.AnimationState();
	Model2D.Model = Model2D.Model();
	Model2D.ModelState = Model2D.ModelState();

	return Model2D;
});

/**
 * @namespace
 */
Impulse.Networking = (function() {
	var Networking = {};

	Networking.Types = {
		Array:0,
		Binary:1,
		Float32:2,
		Float64:3,
		Int8:4,
		Int16:5,
		Int32:6,
		String:7,
		Uint8:8,
		Uint16:9,
		Uint32:10
	}; // enum

	Networking.BinarySerializer = (function() {
		var BinarySerializer = function(arrayBuffer) {
			if (typeof(arrayBuffer) === "number")
				this._dv = new DataView(new ArrayBuffer(arrayBuffer));
			else
				this._dv = new DataView(arrayBuffer);
		}; // class BinarySerializer

		BinarySerializer.prototype._dv = undefined;
		BinarySerializer.prototype._offset = 0;

		// POSITION ====================================================================

		BinarySerializer.prototype.seek = function(offset) {
			this._offset = offset === undefined ? 0 : offset;
			return this;
		};

		BinarySerializer.prototype.position = function() {
			return this._offset;
		};

		BinarySerializer.prototype.length = function() {
			return this._dv.buffer.byteLength;
		};

		// BUFFER ======================================================================

		BinarySerializer.prototype.buffer = function() {
			return this._dv.buffer;
		};

		// READ FUNCTIONS ==============================================================

		BinarySerializer.prototype.get = function(getFunction) {
			getFunction.call(this);
		};

		BinarySerializer.prototype.getInt8 = function() {
			++this._offset;
			return this._dv.getInt8(this._offset - 1);
		};

		BinarySerializer.prototype.getUint8 = function() {
			++this._offset;
			return this._dv.getUint8(this._offset - 1);
		};

		BinarySerializer.prototype.getInt16 = function() {
			this._offset += 2;
			return this._dv.getInt16(this._offset - 2);
		};

		BinarySerializer.prototype.getUint16 = function() {
			this._offset += 2;
			return this._dv.getUint16(this._offset - 2);
		};

		BinarySerializer.prototype.getInt32 = function() {
			this._offset += 4;
			return this._dv.getInt32(this._offset - 4);
		};

		BinarySerializer.prototype.getUint32 = function() {
			this._offset += 4;
			return this._dv.getUint32(this._offset - 4);
		};

		BinarySerializer.prototype.getFloat32 = function() {
			this._offset += 4;
			return this._dv.getFloat32(this._offset - 4);
		};

		BinarySerializer.prototype.getFloat64 = function() {
			this._offset += 8;
			return this._dv.getFloat64(this._offset - 8);
		};

		BinarySerializer.prototype.getString = function() {
			// length of the string is stored as a Uint32
			var length = this._dv.getUint32(this._offset);
			this._offset += 4;

			// foreach char in length, read a Uint16 and convert to character
			var str = "";
			for (var i = 0; i < length; ++i) {
				str += String.fromCharCode(this._dv.getUint16(this._offset));
				this._offset += 2;
			} // for( i )

			// join all the characters and return new string
			return str;
		};

		BinarySerializer.prototype.getBinary = function() {
			// length of the binary string is stored as a Uint32
			var length = this._dv.getUint32(this._offset);
			this._offset += 4 + length;

			// return the array buffer slice
			return this._dv.buffer.slice(this._offset - length, this._offset);
		};

		// assumes array of only one type
		BinarySerializer.prototype.getArray = function(getFunction) {
			// length of the array is stored as a Uint32
			var length = this._dv.getUint32(this._offset);
			this._offset += 4;

			// foreach item in length, read it from the buffer
			var items = [];
			for (var i = 0; i < length; ++i) {
				items[i] = getFunction.call(this);
			} // for( i )

			// return the new array of items
			return items;
		};

		// WRITE FUNCTIONS =============================================================

		BinarySerializer.prototype.set = function(value, setFunction) {
			setFunction.call(this, value);

			return this;
		};

		BinarySerializer.prototype.setInt8 = function(value) {
			this._dv.setInt8(this._offset, value);
			++this._offset;

			return this;
		};

		BinarySerializer.prototype.setUint8 = function(value) {
			this._dv.setUint8(this._offset, value);
			++this._offset;

			return this;
		};

		BinarySerializer.prototype.setInt16 = function(value) {
			this._dv.setInt16(this._offset, value);
			this._offset += 2;

			return this;
		};

		BinarySerializer.prototype.setUint16 = function(value) {
			this._dv.setUint16(this._offset, value);
			this._offset += 2;

			return this;
		};

		BinarySerializer.prototype.setInt32 = function(value) {
			this._dv.setInt32(this._offset, value);
			this._offset += 4;

			return this;
		};

		BinarySerializer.prototype.setUint32 = function(value) {
			this._dv.setUint32(this._offset, value);
			this._offset += 4;

			return this;
		};

		BinarySerializer.prototype.setFloat32 = function(value) {
			this._dv.setFloat32(this._offset, value);
			this._offset += 4;

			return this;
		};

		BinarySerializer.prototype.setFloat64 = function(value) {
			this._dv.setFloat64(this._offset, value);
			this._offset += 8;

			return this;
		};

		BinarySerializer.prototype.setString = function(value) {
			// cache the length for later use
			var length = value.length;

			// store the length of the string as a Uint32
			this._dv.setUint32(this._offset, length);
			this._offset += 4;

			// foreach char in value, write a Uint16 for that char
			for (var i = 0; i < length; ++i) {
				this._dv.setUint16(this._offset, value.charCodeAt(i));
				this._offset += 2;
			} // for( i )

			return this;
		};

		BinarySerializer.prototype.setBinary = function(value) {
			// cache the length for later use
			var length = value.byteLength;

			// store the length of the binary string as a Uint32
			this._dv.setUint32(this._offset, length);
			this._offset += 4;

			// foreach byte in value, write a Uint8
			var u8Value = new Uint8Array(value);
			for (var i = 0; i < length; ++i) {
				this._dv.setUint8(this._offset, u8Value[i]);
				++this._offset;
			} // for( i )

			return this;
		};

		// assumes array of only one type
		BinarySerializer.prototype.setArray = function(value, setFunction) {
			// cache the length for later use
			var length = value.length;

			// store the length of the array as a Uint32
			this._dv.setUint32(this._offset, length);
			this._offset += 4;

			// foreach item in length, write it to the buffer
			for (var i = 0; i < length; ++i) {
				setFunction.call(this, value[i]);
			} // for( i )

			return this;
		};

		return BinarySerializer;
	})();

	Networking.Sanitizer = (function() {
		var Sanitizer = {};

		// use to sanitize user content before attaching to the HTML DOM to prevent XSS attacks
		Sanitizer.sanitizeForDom = function(str) {
			str = str.replace(/&/g, "&amp;");
			str = str.replace(/</g, "&lt;");
			str = str.replace(/>/g, "&gt;");
			str = str.replace(/"/g, "&quot;");
			str = str.replace(/'/g, "&#x27;");
			str = str.replace(/\//g, "&#x2F;");

			return str;
		};

		return Sanitizer;
	})();

	return Networking;
});

/**
 * @namespace
 */
Impulse.Scene2D = (function() {
	var Scene2D = {};

	// imports
	var Entity = Impulse.Entity;
	var EventDelegate = Impulse.Util.EventDelegate;
	var Intersect = Impulse.Shape2D.Intersect;
	var Matrix = Impulse.Shape2D.Matrix;
	var MouseAdapter = Impulse.Input.MouseAdapter;
	var Polygon = Impulse.Shape2D.Polygon;
	var Vector = Impulse.Shape2D.Vector;

	Scene2D.Camera = (function() {
		var Camera = function(canvas, x, y, w, h, viewportMargin) {
			this._cameraMatrix = new Matrix(1, 0, 0, 1, -x, -y);
			this._canvas = canvas;
			this.moved = new EventDelegate();
			this.rotated = new EventDelegate();
			this._targetH = h;
			this._targetW = w;
			this.viewportMargin = viewportMargin === undefined ? 0 : viewportMargin;
			this.zoomed = new EventDelegate();

			// hook into the window resize event handler
			var thisCamera = this;
			this._resizeHandler = function() { thisCamera._updateCanvasValues(); };
			window.addEventListener('resize', this._resizeHandler, false);

			// init the canvas related values for this camera
			this._updateCanvasValues();
		}; // class Camera

		Camera.prototype._cameraMatrix = undefined;
		Camera.prototype._canvas = undefined;
		Camera.prototype._canvasMatrix = undefined;
		Camera.prototype._h = undefined;
		Camera.prototype.moved = undefined;
		Camera.prototype._resizeHandler = undefined;
		Camera.prototype.rotated = undefined;
		Camera.prototype._targetH = 0;
		Camera.prototype._targetW = 0;
		Camera.prototype.viewportMargin = 0;
		Camera.prototype._w = undefined;
		Camera.prototype.zoomed = undefined;

		// Vector canvasToWorld(Number, Number);
		// Vector canvasToWorld(Vector);
		Camera.prototype.canvasToWorld = function(x, y) {
			if (typeof x === "number")
				x = new Vector(x, y);
			else
				x = x.clone();
			return x.applyTransform(this.getRenderMatrix().invert());
		}; // canvasToWorld( )

		// void destroy();
		Camera.prototype.destroy = function() {
			window.removeEventListener("resize", this._resizeHandler, false);
		}; // destroy( )

		// HTMLCanvas getCanvas();
		Camera.prototype.getCanvas = function() {
			return this._canvas;
		}; // getCanvas( )

		// Matrix getMatrix();
		Camera.prototype.getMatrix = function() {
			return this._cameraMatrix;
		}; // getMatrix( )

		// Vector2D getPosition();
		Camera.prototype.getPosition = function() {
			return new Vector(-this._cameraMatrix.e, -this._cameraMatrix.e);
		}; // getPosition( )

		// Matrix2D getRenderMatrix();
		Camera.prototype.getRenderMatrix = function() {
			return this._cameraMatrix.clone().combine(this._canvasMatrix);
		}; // getRenderMatrix( )

		// Polygon getViewport([Boolean]);
		Camera.prototype.getViewport = function(useMargin) {
			var hh = this._h / 2 + (useMargin === true ? this.viewportMargin : 0);
			var hw = this._w / 2 + (useMargin === true ? this.viewportMargin : 0);
			var vp = new Polygon([
				new Vector(-hw, hh),
				new Vector(hw, hh),
				new Vector(hw, -hh),
				new Vector(-hw, -hh)
			]);
			return vp.applyTransform(this._cameraMatrix.clone().invert());
		}; // getViewport( )

		// void rotate(Number)
		Camera.prototype.rotate = function(rads) {
			this._cameraMatrix.rotate(rads);
		};

		// void setPosition(Entity)
		// void setPosition(Vector)
		// void setPosition(Number, Number)
		Camera.prototype.setPosition = function(x, y) {
			if (x instanceof Entity)
				x = x.getPosition();

			if (x instanceof Vector) {
				this._cameraMatrix.e = -x.x;
				this._cameraMatrix.f = -x.y;
			} else {
				this._cameraMatrix.e = -x;
				this._cameraMatrix.f = -y;
			} // if / else

			this.moved.dispatch(this);
		}; // setPosition( )

		// void setRotation(Number)
		Camera.prototype.setRotation = function(rads) {
			this._cameraMatrix.rotate(rads - this._cameraMatrix.getRotation());
			this.rotated.dispatch(this);
		}; // setRotation( )

		Camera.prototype.setZoom = function(zoom) {
			this._cameraMatrix.preScale(zoom / this._cameraMatrix.getScale());
			this.zoomed.dispatch(this);
		}; // setZoom( )

		// void translate(Vector)
		// void translate(Number, Number)
		Camera.prototype.translate = function(x, y) {
			if (x instanceof Vector)
				this._cameraMatrix.preTranslate(-x.x, -x.y);
			else
				this._cameraMatrix.preTranslate(-x, -y);

			this.moved.dispatch(this);
		}; // translate( )

		// void _updateCanvasValues();
		Camera.prototype._updateCanvasValues = function() {
			// calculate zoom factor
			var zoom = Math.min(this._canvas.width / this._targetW, this._canvas.height / this._targetH);

			// update width/height values
			this._h = this._canvas.height / zoom;
			this._w = this._canvas.width / zoom;

			// rebuild the transformation matrix
			this._canvasMatrix = new Matrix(zoom, 0, 0, -zoom, this._canvas.width/2, this._canvas.height/2);

			// dispatch zoom changed event
			this.zoomed.dispatch(this);
		}; // _updateCanvasValues( )

		// Vector worldToCanvas(Number, Number);
		// Vector worldToCanvas(Vector);
		Camera.prototype.worldToCanvas = function(x, y) {
			if (typeof x === "number")
				x = new Vector(x, y);
			else
				x = x.clone();
			return x.applyTransform(this.getRenderMatrix());
		};

		// void zoom(Number)
		Camera.prototype.zoom = function(zoom) {
			this._cameraMatrix.preScale(zoom);
			this.zoomed(this);
		}; // zoom( )

		return Camera;
	});

	Scene2D.ISceneGraph = (function() {
		/**
		 * @abstract
		 */
		var SceneGraph = function() {}; // class Shape

		// void addEntity(Entity);
		SceneGraph.prototype.addEntity = function(ent) {
			throw "Not implemented!";
		}; // addEntity( )

		// void clear();
		SceneGraph.prototype.clear = function() {
			throw "Not implemented!";
		}; // clear( )

		// Vector getMtv(Shape, [Number], [Boolean]);
		SceneGraph.prototype.getMtv = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // getMtv( )

		// Array<Entity> query([Number], [Boolean]);
		SceneGraph.prototype.query = function(flags, useOr) {
			throw "Not implemented!";
		}; // query( )

		// Array<Entity> queryCenterIn(Shape, [Number], [Boolean]);
		SceneGraph.prototype.queryCenterIn = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryCenterIn( )

		// Array<Entity> queryContainedIn(Shape, [Number], [Boolean]);
		SceneGraph.prototype.queryContainedIn = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryContainedIn( )

		// Array<Entity> queryIntersectWith(Shape, [Number], [Boolean]);
		SceneGraph.prototype.queryIntersectWith = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryIntersectWith( )

		// Array<Entity> queryOutsideOf(Shape, [Number], [Boolean]);
		SceneGraph.prototype.queryOutsideOf = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryOutsideOf( )

		// void removeEntity(Entity);
		SceneGraph.prototype.removeEntity = function(ent) {
			throw "Not implemented!";
		}; // removeEntity( )

		return SceneGraph;
	});

	Scene2D.LinearSG = (function() {
		var Vector = Impulse.Shape2D.Vector;

		var LinearSG = function() {
			this._entities = [];
		}; // class LinearSG

		LinearSG.prototype = new Scene2D.ISceneGraph();
		LinearSG.prototype._entities = undefined;

		// void addEntity(Entity);
		LinearSG.prototype.addEntity = function(ent) {
			this._entities.push(ent);
		}; // addEntity( )

		// void clear();
		LinearSG.prototype.clear = function() {
			this._entities = [];
		}; // clear( )

		// Vector getMtv(Shape, [Number], [Boolean]);
		LinearSG.prototype.getMtv = function(shape, flags, useOr) {
			// init default values
			var entity = undefined;
			if (shape instanceof Entity) {
				entity = shape;
				shape = shape.getCollidable();
			} // if
			if (flags === undefined)
				flags = 0;
			if (useOr === undefined)
				useOr = true;

			var ent;
			var mtv = new Vector(0, 0);

			for (var i = 0; i < this._entities.length; i++) {
				ent = this._entities[i];

				// don't check against the original entity, if there is one
				if (ent === entity)
					continue;

				// test if ent.flags contain all of _flags
				if ((!flags || ((useOr && (ent.flags & flags) > 0) || (!useOr && (ent.flags & flags) === flags)))) {
					var localMtv = Intersect.shapeVsShapeSat(shape, ent.getCollidable());
					if (localMtv !== undefined)
						mtv.add(localMtv);
				} // if
			} // for( i )

			return mtv;
		}; // getMtv( )

		// Array<Entity> query([Number], [Boolean]);
		LinearSG.prototype.query = function(flags, useOr) {
			// init default values
			if (flags === undefined)
				flags = 0;
			if (useOr === undefined)
				useOr = true;

			var entArray = [];
			var ent;

			for (var i = 0; i < this._entities.length; i++) {
				ent = this._entities[i];
				// test if ent.flags contain all of _flags
				if ((!flags || ((useOr && (ent.flags & flags) > 0) || (!useOr && (ent.flags & flags) === flags))))
					entArray.push(ent);
			} // for( i )

			return entArray;
		}; // query( )

		// Array<Entity> queryCenterIn(Shape, [Number], [Boolean]);
		LinearSG.prototype.queryCenterIn = function(shape, flags, useOr) {
			// init default values
			var entity = undefined;
			if (shape instanceof Entity) {
				entity = shape;
				shape = shape.getCollidable();
			} // if
			shape = shape.getCenter();
			if (flags === undefined)
				flags = 0;
			if (useOr === undefined)
				useOr = true;

			var entArray = [];
			var ent;

			for (var i = 0; i < this._entities.length; i++) {
				ent = this._entities[i];

				// don't check against the original entity, if there is one
				if (ent === entity)
					continue;

				// test if ent.flags contain all of _flags
				if ((!flags || ((useOr && (ent.flags & flags) > 0) || (!useOr && (ent.flags & flags) === flags))) &&
					Intersect.shapeVsShape(shape, ent.getCollidable()))
					entArray.push(ent);
			} // for( i )

			return entArray;
		}; // queryCenterIn( )

		// Array<Entity> queryContainedIn(Shape, [Number], [Boolean]);
		LinearSG.prototype.queryContainedIn = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryContainedIn( )

		// Array<Entity> queryIntersectWith(Shape, [Number], [Boolean]);
		LinearSG.prototype.queryIntersectWith = function(shape, flags, useOr) {
			// init default values
			var entity = undefined;
			if (shape instanceof Entity) {
				entity = shape;
				shape = shape.getCollidable();
			} // if
			if (flags === undefined)
				flags = 0;
			if (useOr === undefined)
				useOr = true;

			var entArray = [];
			var ent;

			for (var i = 0; i < this._entities.length; i++) {
				ent = this._entities[i];

				// don't check against the original entity, if there is one
				if (ent === entity)
					continue;

				// test if ent.flags contain all of _flags
				if ((!flags || ((useOr && (ent.flags & flags) > 0) || (!useOr && (ent.flags & flags) === flags))) &&
					Intersect.shapeVsShape(shape, ent.getCollidable()))
					entArray.push(ent);
			} // for( i )

			return entArray;
		}; // queryIntersectWith( )

		// Array<Entity> queryOutsideOf(Shape, [Number], [Boolean]);
		LinearSG.prototype.queryOutsideOf = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryOutsideOf( )

		// void removeEntity(Entity);
		LinearSG.prototype.removeEntity = function(ent) {
			var index = this._entities.indexOf(ent);
			if (index >= 0)
				this._entities.splice(index, 1);
		}; // removeEntity( )

		return LinearSG;
	});

	Scene2D.QuadTreeSG = {}; // stub

	Scene2D.Scene = (function() {
		var Timing = Impulse.Util.Timing;

		var Scene = function(camera, sceneGraph) {
			this._camera = camera;
			this._canvas = camera.getCanvas();
			this._context = this._canvas.getContext("2d");
			this._mouse = new MouseAdapter(camera);
			this._sceneGraph = sceneGraph;
		}; // class Scene

		Scene.prototype._camera = undefined;
		Scene.prototype._canvas = undefined;
		Scene.prototype._context = undefined;
		Scene.prototype._lastRender = 0;
		Scene.prototype._mouse = undefined;
		Scene.prototype._sceneGraph = undefined;

		Scene.prototype.blank = function(rgb) {
			if (rgb === undefined) {
				this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
			} else {
				this._context.fillStyle = rgb;
				this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
			} // if/else
		}; // clear( )

		Scene.prototype.destroy = function() {
			this._mouse.destroy();
		}; // destroy( )

		Scene.prototype.getCamera = function() {
			return this._camera;
		}; // getCamera( )

		Scene.prototype.getMouse = function() {
			return this._mouse;
		}; // getMouse( )

		Scene.prototype.getSceneGraph = function() {
			return this._sceneGraph;
		}; // getSceneGraph( )

		Scene.prototype.render = function() {
			this._lastRender = this._lastRender || (new Date() | 0);
			var ents = this._sceneGraph.queryIntersectWith(this._camera.getViewport(true));
			var timeMs = Timing.now();
			var camMatrix = this._camera.getRenderMatrix();

			var animState = undefined;
			var r = undefined;
			var m = undefined;

			this._context.save();
			var lng = ents.length;
			for(var i = 0; i < lng; i++) {
				animState = ents[i].getAnimationState(timeMs);
				m = animState.matrix;
				r = animState.frameRect;

				if (r != undefined && m != undefined) {
					// combine camera transformations
					m.combine(camMatrix);

					// init canvas transformation
					this._context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);

					// draw the image sprite to the canvas
					this._context.drawImage(animState.image, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
				} // if
			} // for( i )
			this._context.restore();

			this._lastRender += timeMs;
		}; // render( )

		return Scene;
	});

	// init in correct order
	Scene2D.Camera = Scene2D.Camera();
	Scene2D.ISceneGraph = Scene2D.ISceneGraph();
	Scene2D.LinearSG = Scene2D.LinearSG(); // requires ISceneGraph
	Scene2D.Scene = Scene2D.Scene(); // requires Camera, ISceneGraph

	return Scene2D;
});

/**
 * @namespace
 */
Impulse.Shape2D = (function() {
	/**
	 * enumeration of shape types and their associated ID's
	 *
	 * @enum {number}
	 * @private
	 */
	var _shapeID = {
		Circle:0,
		Polygon:1,
		Rect:2,
		Vector:3
	};

	var Shape2D = {};

	Shape2D.Circle = (function() {
		/**
		 * A simple circle class
		 *
		 * Circle Circle(Circle);
		 * Circle Circle(Number, Number, Number);
		 * Circle Circle(Vector, Number);
		 *
		 * @public
		 * @constructor
		 * @param x {Circle|number|Vector}
		 * @param y {number=}
		 * @param r {number=}
		 */
		var Circle = function(x, y, r) {
			if (x instanceof Circle) {
				this.x = x.x;
				this.y = x.y;
				this.r = x.r;
			} else if (x instanceof Shape2D.Vector) {
				this.x = x.x;
				this.y = x.y;
				this.r = y;
			} else {
				this.x = x;
				this.y = y;
				this.r = r;
			} // else
		}; // class Circle

		Circle.prototype = new Shape2D.IShape();
		Circle.prototype.x = 0;
		Circle.prototype.y = 0;
		Circle.prototype.r = 1;

		// Circle applyTransform();
		Circle.prototype.applyTransform = function(matrix) {
			var tmp = this.x;
			this.x = matrix.a * tmp + matrix.c * this.y + matrix.e;
			this.y = matrix.b * tmp + matrix.d * this.y + matrix.f;

			tmp = matrix.getScale();
			if (tmp.x != tmp.y)
				throw "Non-uniform scaling cannot be applied to type Circle";
			this.r *= tmp.x;

			return this;
		}; // applyTransform( )

		// Circle clone();
		Circle.prototype.clone = function() {
			return new Circle(this);
		}; // clone( )

		// bool equals(Circle);
		Circle.prototype.equals = function(cir) {
			return (cir instanceof Circle &&
				this.x == cir.x &&
				this.y == cir.y &&
				this.r == cir.r);
		}; // equals( )

		// Point getCenter();
		Circle.prototype.getCenter = function() {
			return new Shape2D.Vector(this.x, this.y);
		}; // getCenter( )

		// Number getShapeID();
		Circle.prototype.getShapeID = function() {
			return _shapeID.Circle;
		}; // getShapeID( )

		// Circle setCenter(Vector);
		// Circle setCenter(Number, Number);
		Circle.prototype.setCenter = function(x, y) {
			if (x instanceof Shape2D.Vector) {
				this.x = x.x;
				this.y = x.y;
			} else {
				this.x = x;
				this.y = y;
			} // if/else

			return this;
		}; // setCenter( )

		// string toString();
		Circle.prototype.toString = function() {
			return "Circle(" + this.x + ", " + this.y + ", " + this.r + ")";
		}; // toString( )

		return Circle;
	});

	Shape2D.Intersect = (function() {
		var Intersection = Shape2D.Intersection;
		var Vector = Shape2D.Vector;

		// map shapeID to intersection functions
		var _shapeMap = [];
		var _shapeMapSat = [];

		var Intersect = {};

		// Boolean circleVsCircle(Circle, Circle);
		Intersect.circleVsCircle = function(cir1, cir2) {
			// return true if the squared distance between circle centers is less than the combined radii squared
			// this prevents us from doing a square root operation to find actual distance between centers
			// 0 distance between circles is assumed to be non-intersecting
			return (cir2.x - cir1.x) * (cir2.x - cir1.x) +
				(cir2.y - cir1.y) * (cir2.y - cir1.y) <
				(cir1.r + cir2.r) * (cir1.r + cir2.r);
		}; // circleVsCircle( )

		// Intersection circleVsCircleSat(Circle, Circle);
		Intersect.circleVsCircleSat = function(cir1, cir2) {
			// calculate the vector between the circles' centers
			var dc = new Vector(cir1.x - cir2.x, cir1.y - cir2.y);

			// calculate magnitude of dc and combined radii
			var l = dc.magnitude();
			var rs = cir1.r + cir2.r;

			// if magnitude of dc >= rs, circles do not intersect
			if (l >= rs)
				return undefined;

			// circles intersect
			// scale dc to magnitude of overlap
			dc.scale((rs - l) / l);

			// return dc as projection, and negative, normalized dc as surface normal
			return dc;
		}; // circleVsCircleSat( )

		/**
		 * Takes a circle and a collection of vertices and performs circle-polygon projections intersection on them.
		 * Results are always from the perspective of cir, that is, the minimum translation vector needed to move cir
		 * out of collision with v1.
		 *
		 * @param {Circle} cir The Circle to perform intersection tests against
		 * @param {Array<Vector} v1 An array of vertices representing the polygon
		 * @return {undefined|Vector} Returns the Minium Translation Vector if the circle and polygon intersect,
		 * undefined otherwise
		 * @private
		 */
		Intersect._circleVsEdges = function(cir, v1) {
			var perp, min1, min2, max1, max2, dp, i, j, k, overlap, mtv, diff1, diff2;
			var smallest = Number.MAX_VALUE;

			// test edges stored in v1 against cir
			for (i = 0, j = v1.length - 1; i < v1.length; j = i++) {
				// calculate normalized vector perpendicular to each line segment of the polygon
				perp = new Vector(-v1[i].y + v1[j].y, v1[i].x - v1[j].x).normalize();

				// assume the polygon has at least one vertex (see Shape2D.Polygon constructor)
				// project the polygon onto the new axis (the perpendicular vector)
				min1 = max1 = v1[0].dotProduct(perp);
				for (k = 1; k < v1.length; k++) {
					dp = v1[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// project the circle onto the new axis (the perpendicular vector)
				min2 = cir.getCenter().dotProduct(perp) - cir.r;
				max2 = min2 + 2 * cir.r;

				// break early if projections don't overlap, no intersection exists
				if (max1 < min2 || min1 > max2)
					return undefined;

				// otherwise, calculate overlap
				overlap = Math.min(max1, max2) - Math.max(min1, min2);

				// test for containment
				if ((min1 > min2 && max1 < max2) || (min1 < min2 && max1 > max2)) {
					diff1 = Math.abs(min1 - min2);
					diff2 = Math.abs(max1 - max2);

					// append smallest difference to overlap, negating the axis if needed
					if (diff1 < diff2) {
						overlap += diff1;
						if (min1 < min2)
							perp.negate();
					} // if
					else {
						overlap += diff2;
						if (max1 < max2)
							perp.negate();
					} // else
				} // if
				else if (min1 > min2) {
					// shortest intersection is in the negative direction relative to perp
					perp.negate();
				} // else if

				// does this axis contain the smallest overlap so far?
				if (overlap < smallest) {
					smallest = overlap;
					mtv = perp;
				} // if
			} // for( i )

			// find closest vertex to cir
			var v = undefined;
			var distSqr = Number.MAX_VALUE;
			for (i = 0; i < v1.length; i++) {
				var d = (cir.x - v1[i].x) * (cir.x - v1[i].x) + (cir.y - v1[i].y) * (cir.y - v1[i].y);
				if (d < distSqr) {
					v = v1[i];
					distSqr = d;
				} // if
			} // for( i )

			// test closest vertex against cir
			//perp = new Vector(-v.y + cir.y, v.x - cir.x).normalize();
			perp = new Vector(cir.x - v.x, cir.y - v.y).normalize();

			// project the polygon onto the new axis (the perpendicular vector)
			min1 = max1 = v1[0].dotProduct(perp);
			for (k = 1; k < v1.length; k++) {
				dp = v1[k].dotProduct(perp);
				min1 = Math.min(min1, dp);
				max1 = Math.max(max1, dp);
			} // for( k )

			// project the circle onto the new axis (the perpendicular vector)
			min2 = cir.getCenter().dotProduct(perp) - cir.r;
			max2 = min2 + 2 * cir.r;

			// break early if projections don't overlap, no intersection exists
			if (max1 < min2 || min1 > max2)
				return undefined;

			// otherwise, calculate overlap
			overlap = Math.min(max1, max2) - Math.max(min1, min2);

			// test for containment
			if ((min1 > min2 && max1 < max2) || (min1 < min2 && max1 > max2)) {
				diff1 = Math.abs(min1 - min2);
				diff2 = Math.abs(max1 - max2);

				// append smallest difference to overlap, negating the axis if needed
				if (diff1 < diff2) {
					overlap += diff1;
					if (min1 < min2)
						perp.negate();
				} // if
				else {
					overlap += diff2;
					if (max1 < max2)
						perp.negate();
				} // else
			} // if
			else if (min1 > min2) {
				// shortest intersection is in the negative direction relative to perp
				perp.negate();
			} // else if

			// does this axis contain the smallest overlap so far?
			if (overlap < smallest) {
				smallest = overlap;
				mtv = perp;
			} // if

			// return the minimum translation vector (MTV)
			// this is the perpendicular axis with the smallest overlap, scaled to said overlap
			return mtv.scaleToMagnitude(smallest);
		}; // _circleVsEdges( )

		// Boolean circleVsPolygon(Circle, Polygon);
		Intersect.circleVsPolygon = function(cir, poly) {
			// quick rejection
			if (!Intersect.circleVsCircle(cir, poly.getBoundingCircle()))
				return false;

			// see http://www.metanetsoftware.com/technique/tutorialA.html#section2
			var v = poly.getVertices();
			var min1, min2, max1, max2, dp, perp;

			// test edges stored in v against cir
			for (var i = 0, j = v.length - 1; i < v.length; j = i++) {
				perp = new Shape2D.Vector(-v[i].y + v[j].y, v[i].x - v[j].x);
				perp.normalize();

				// project vertices of poly onto perp
				min1 = max1 = v[0].dotProduct(perp);
				for (var k = 1; k < v.length; k++) {
					dp = v[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// project cir onto perp
				dp = cir.getCenter().dotProduct(perp);
				min2 = dp - cir.r;
				max2 = dp + cir.r;

				if (max1 < min2 || min1 > max2)
					return false;
			} // for( i )

			// find the vertex closest to cir.center
			var dist = cir.getCenter().distanceSq(v[0]);
			var vertex = v[0];
			for (var i = 1; i < v.length; i++) {
				var tmp = cir.getCenter().distanceSq(v[i]);
				if (tmp < dist) {
					dist = tmp;
					vertex = v[i];
				} // if
			} // for( k )

			// test line cir.center - vertext
			perp = cir.getCenter().subtract(vertex);
			perp.normalize();

			// project vertices of poly onto perp
			min1 = max1 = v[0].dotProduct(perp);
			for (var i = 1; i < v.length; i++) {
				dp = v[i].dotProduct(perp);
				min1 = Math.min(min1, dp);
				max1 = Math.max(max1, dp);
			} // for( k )

			// project cir onto perp
			dp = cir.getCenter().dotProduct(perp);
			min2 = dp - cir.r;
			max2 = dp + cir.r;

			if (max1 < min2 || min1 > max2)
				return false;

			// no separating axis, shapes are intersecting
			return true;
		};

		// Boolean circleVsPolygonSat(Circle, Polygon);
		Intersect.circleVsPolygonSat = function(cir, poly) {
			// coarse test
			if (!Intersect.circleVsCircle(cir, poly.getBoundingCircle()))
				return undefined;

			// fine test
			return Intersect._circleVsEdges(cir, poly.getVertices());
		}; // circleVsPolygonSat( )

		// Boolean circleVsRect(Circle, Rect);
		Intersect.circleVsRect = function(cir, rect) {
			// reorient rect with respect to cir, thus cir is the new origin
			var l = rect.x - cir.x;
			var t = rect.y - cir.y;
			var r = l + rect.w;
			var b = t - rect.h;

			if (r < 0) // rect to left of circle center
				if (t < 0) // rect to lower left
					return (r * r + t * t) < cir.r * cir.r;
				else if (b > 0) // rect to upper left
					return (r * r + b * b) < cir.r * cir.r;
				else // directly left of circle center
					return Math.abs(r) < cir.r;
			else if (l > 0) // rect to the right of circle center
				if (t < 0) // rect to lower right
					return (l * l + t * t) < cir.r * cir.r;
				else if (b > 0) // rect to upper right
					return (l * l + b * b) < cir.r * cir.r;
				else // directly right of circle center
					return Math.abs(l) < cir.r;
			else // rect intersects with y-axis
			if (t < 0) // directly down from circle center
				return Math.abs(t) < cir.r;
			else if (b > 0) // directly up from circle center
				return Math.abs(b) < cir.r;
			else // rect contains circle center
				return true;
		}; // circleVsRect( )

		// Boolean circleVsRectSat(Circle, Rect);
		Intersect.circleVsRectSat = function(cir, rect) {
			// coarse test
			if (!Intersect.circleVsRect(cir, rect))
				return undefined;

			// fine test
			return Intersect._circleVsEdges(cir, rect.getVertices());
		}; // circleVsRectSat( )

		// bool circleVsVector(Circle, Point);
		Intersect.circleVsVector = function(cir, vect) {
			return (vect.x - cir.x) * (vect.x - cir.x) + (vect.y - cir.y) * (vect.y - cir.y) <= cir.r * cir.r;
		}; // circleVsVector( )

		// bool circleVsVectorSat(Circle, Point);
		Intersect.circleVsVectorSat = function(cir, vect) {
			// calculate the vector between the circles' centers
			var dc = new Vector(cir.x - vect.x, cir.y - vect.y);

			// calculate magnitude of dc
			var l = dc.magnitude();

			// if magnitude of dc >= rs, circle does not intersect with vect
			if (l >= cir.r)
				return undefined;

			// scale dc to magnitude of overlap
			dc.scale((cir.r - l) / l);

			// return dc as mtv
			return dc;
		}; // circleVsVectorSat( )

		/**
		 * Takes two collections of vertices and performs polygon-polygon projections intersection on them. Results are
		 * always from the perspective of v1, that is, the minimum translation vector needed to move v1 out of collision
		 * with v2.
		 *
		 * see http://content.gpwiki.org/index.php/Polygon_Collision
		 * see http://www.codezealot.org/archives/55
		 *
		 * @param {Array<Vector>} v1 An array of vertices representing the first polygon
		 * @param {Array<Vector>} v2 An array of vertices representing the second polygon
		 * @return {undefined|Vector} Returns the Minium Translation Vector if the polygons intersect, undefined
		 * otherwise
		 * @private
		 */
		Intersect._edgesVsEdges = function(v1, v2) {
			var perp, min1, min2, max1, max2, dp, i, j, k, overlap, mtv, diff1, diff2;
			var smallest = Number.MAX_VALUE;

			// test edges stored in v1 against edges stored in v2
			for (i = 0, j = v1.length - 1; i < v1.length; j = i++) {
				// calculate normalized vector perpendicular to each line segment of the polygon
				perp = new Vector(-v1[i].y + v1[j].y, v1[i].x - v1[j].x).normalize();

				// assume both poly's have at least one vertex (see Shape2D.Polygon constructor)
				// project the first polygon onto the new axis (the perpendicular vector)
				min1 = max1 = v1[0].dotProduct(perp);
				for (k = 1; k < v1.length; k++) {
					dp = v1[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// project the second polygon onto the new axis (the perpendicular vector)
				min2 = max2 = v2[0].dotProduct(perp);
				for (k = 1; k < v2.length; k++) {
					dp = v2[k].dotProduct(perp);
					min2 = Math.min(min2, dp);
					max2 = Math.max(max2, dp);
				} // for( k )

				// break early if projections don't overlap, no intersection exists
				if (max1 < min2 || min1 > max2)
					return undefined;

				// otherwise, calculate overlap
				overlap = Math.min(max1, max2) - Math.max(min1, min2);

				// test for containment
				if ((min1 > min2 && max1 < max2) || (min1 < min2 && max1 > max2)) {
					diff1 = Math.abs(min1 - min2);
					diff2 = Math.abs(max1 - max2);

					// append smallest difference to overlap, negating the axis if needed
					if (diff1 < diff2) {
						overlap += diff1;
						if (min1 > min2)
							perp.negate();
					} // if
					else {
						overlap += diff2;
						if (max1 > max2)
							perp.negate();
					} // else
				} // if
				else if (min1 < min2) {
					// shortest intersection is in the negative direction relative to perp
					perp.negate();
				} // else if

				// does this axis contain the smallest overlap so far?
				if (overlap < smallest) {
					smallest = overlap;
					mtv = perp;
				} // if
			} // for( i )

			// test edges stored in v2 against edges stored in v1
			for (i = 0, j = v2.length - 1; i < v2.length; j = i++) {
				// calculate normalized vector perpendicular to each line segment of the polygon
				perp = new Vector(-v2[i].y + v2[j].y, v2[i].x - v2[j].x).normalize();

				// assume both poly's have at least one vertex (see Shape2D.Polygon constructor)
				// project the first polygon onto the new axis (the perpendicular vector)
				min1 = max1 = v1[0].dotProduct(perp);
				for (k = 1; k < v1.length; k++) {
					dp = v1[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// project the second polygon onto the new axis (the perpendicular vector)
				min2 = max2 = v2[0].dotProduct(perp);
				for (k = 1; k < v2.length; k++) {
					dp = v2[k].dotProduct(perp);
					min2 = Math.min(min2, dp);
					max2 = Math.max(max2, dp);
				} // for( k )

				// break early if projections don't overlap, no intersection exists
				if (max1 < min2 || min1 > max2)
					return undefined;

				// otherwise, calculate overlap
				overlap = Math.min(max1, max2) - Math.max(min1, min2);

				// test for containment
				if ((min1 > min2 && max1 < max2) || (min1 < min2 && max1 > max2)) {
					diff1 = Math.abs(min1 - min2);
					diff2 = Math.abs(max1 - max2);

					// append smallest difference to overlap, negating the axis if needed
					if (diff1 < diff2) {
						overlap += diff1;
						if (min1 > min2)
							perp.negate();
					} // if
					else {
						overlap += diff2;
						if (max1 > max2)
							perp.negate();
					} // else
				} // if
				else if (min1 < min2) {
					// shortest intersection is in the negative direction relative to perp
					perp.negate();
				} // else if

				// does this axis contain the smallest overlap so far?
				if (overlap < smallest) {
					smallest = overlap;
					mtv = perp;
				} // if
			} // for( i )

			// return the minimum translation vector (MTV)
			// this is the perpendicular axis with the smallest overlap, scaled to said overlap
			return mtv.scaleToMagnitude(smallest);
		}; // _edgesVsEdges( )

		// Boolean polygonVsPolygon(Polygon, Polygon);
		Intersect.polygonVsPolygon = function(poly1, poly2) {
			return Intersect.polygonVsPolygonSat(poly1, poly2) !== undefined;
		};

		// Vector polygonVsPolygonSat(Polygon, Polygon);
		Intersect.polygonVsPolygonSat = function(poly1, poly2) {
			// coarse test
			if (!Intersect.circleVsCircle(poly1.getBoundingCircle(), poly2.getBoundingCircle()))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(poly1.getVertices(), poly2.getVertices());
		};

		// Boolean polygonVsRect(Polygon, Rect);
		Intersect.polygonVsRect = function(poly, rect) {
			// quick rejection
			if (!Intersect.circleVsRect(poly.getBoundingCircle(), rect))
				return false;

			var v1 = poly.getVertices();
			var v2 = rect.getVertices();

			// check v1 against v2 and v2 against v1
			// boolean short-circuit allows calling both functions only when needed
			return Intersect._verticesVsVertices(v1, v2) && Intersect._verticesVsVertices(v2, v1);
		};

		// Boolean polygonVsRectSat(Polygon, Rect);
		Intersect.polygonVsRectSat = function(poly, rect) {
			// coarse test
			if (!Intersect.circleVsRect(poly.getBoundingCircle(), rect))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(poly.getVertices(), rect.getVertices());
		}; // polygonVsRectSat( )

		// Boolean polygonVsVector(Polygon, Vector);
		Intersect.polygonVsVector = function(poly, vect) {
			// quick rejection
			if (!Intersect.circleVsVector(poly.getBoundingCircle(), vect))
				return false;

			// using Point Inclusion in Polygon test (aka Crossing test)
			var c = false;
			var v = poly.getVertices();
			for (var i = 0, j = v.length - 1; i < v.length; j = i++) {
				if (((v[i].y > vect.y) != (v[j].y > vect.y)) &&
					(vect.x < (v[j].x - v[i].x) * (vect.y - v[i].y) / (v[j].y - v[i].y) + v[i].x))
					c = !c;
			} // for( i )

			return c;
		};

		// Boolean polygonVsVectorSat(Polygon, Vector);
		Intersect.polygonVsVectorSat = function(poly, vect) {
			// coarse test
			if (!Intersect.circleVsVector(poly.getBoundingCircle(), vect))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(poly.getVertices(), [vect]);
		}; // polygonVsVectorSat( )

		// Boolean rectVsRect(Rect, Rect);
		Intersect.rectVsRect = function(rect1, rect2) {
			return (rect1.x <= rect2.x + rect2.w &&
				rect1.x + rect1.w >= rect2.x &&
				rect1.y >= rect2.y - rect2.h &&
				rect1.y - rect1.h <= rect2.y)
		}; // rectVsRect( )

		// Boolean rectVsRectSat(Rect, Rect);
		Intersect.rectVsRectSat = function(rect1, rect2) {
			// coarse test
			if (!Intersect.rectVsRect(rect1, rect2))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(rect1.getVertices(), rect2.getVertices());
		}; // rectVsRectSat( )

		// Boolean rectVsVector(Rect, Vector);
		Intersect.rectVsVector = function(rect, vect) {
			return vect.x >= rect.x && vect.x <= rect.x + rect.w &&
				vect.y <= rect.y && vect.y >= rect.y - rect.h;
		}; // rectVsVector( )

		// Boolean rectVsVectorSat(Rect, Vector);
		Intersect.rectVsVectorSat = function(rect, vect) {
			// coarse test
			if (!Intersect.rectVsVector(rect, vect))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(rect.getVertices(), [vect]);
		}; // rectVsVectorSat( )

		// Boolean shapeVsShape(IShape, IShape);
		Intersect.shapeVsShape = function(shape1, shape2) {
			return _shapeMap[shape1.getShapeID()][shape2.getShapeID()](shape1, shape2);
		}; // shapeVsShape( )

		// Boolean shapeVsShapeSat(IShape, IShape);
		Intersect.shapeVsShapeSat = function(shape1, shape2) {
			return _shapeMapSat[shape1.getShapeID()][shape2.getShapeID()](shape1, shape2);
		}; // shapeVsShape( )

		// Boolean vectorVsVector(Vector, Vector);
		Intersect.vectorVsVector = function(vect1, vect2) {
			return vect1.equals(vect2);
		};

		// Boolean vectorVsVectorSat(Vector, Vector);
		Intersect.vectorVsVectorSat = function(vect1, vect2) {
			return vect1.equals(vect2) ? new Shape2D.Vector(0, 0) : undefined;
		};

		// Boolean _verticesVsVertices(Array<Vector>, Array<Vector>);
		Intersect._verticesVsVertices = function(v1, v2) {
			var min1, min2, max1, max2, dp;

			// test edges stored in v1 against edges stored in v2
			var perp;
			for (var i = 0, j = v1.length - 1; i < v1.length; j = i++) {
				perp = new Shape2D.Vector(-v1[i].y + v1[j].y, v1[i].x - v1[j].x);

				var k;
				min1 = max1 = v1[0].dotProduct(perp);
				for (k = 1; k < v1.length; k++) {
					dp = v1[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// assume both poly's have at least one vertex (see Shape2D.Polygon constructor)
				min2 = max2 = v2[0].dotProduct(perp);
				for (k = 1; k < v2.length; k++) {
					dp = v2[k].dotProduct(perp);
					min2 = Math.min(min2, dp);
					max2 = Math.max(max2, dp);
				} // for( k )

				if (max1 < min2 || min1 > max2)
					return false;
			} // for( i )

			return true;
		}; // _verticesVsVertices( )

		// init shapeMap
		_shapeMap[_shapeID.Circle] = [];
		_shapeMap[_shapeID.Circle][_shapeID.Circle] = Intersect.circleVsCircle;
		_shapeMap[_shapeID.Circle][_shapeID.Polygon] = Intersect.circleVsPolygon;
		_shapeMap[_shapeID.Circle][_shapeID.Rect] = Intersect.circleVsRect;
		_shapeMap[_shapeID.Circle][_shapeID.Vector] = Intersect.circleVsVector;
		_shapeMap[_shapeID.Polygon] = [];
		_shapeMap[_shapeID.Polygon][_shapeID.Circle] = function(p, c) { return Intersect.circleVsPolygon(c, p); };
		_shapeMap[_shapeID.Polygon][_shapeID.Polygon] = Intersect.polygonVsPolygon;
		_shapeMap[_shapeID.Polygon][_shapeID.Rect] = Intersect.polygonVsRect;
		_shapeMap[_shapeID.Polygon][_shapeID.Vector] = Intersect.polygonVsVector;
		_shapeMap[_shapeID.Rect] = [];
		_shapeMap[_shapeID.Rect][_shapeID.Circle] = function(r, c) { return Intersect.circleVsRect(c, r); };
		_shapeMap[_shapeID.Rect][_shapeID.Polygon] = function(r, p) { return Intersect.polygonVsRect(p, r); };
		_shapeMap[_shapeID.Rect][_shapeID.Rect] = Intersect.rectVsRect;
		_shapeMap[_shapeID.Rect][_shapeID.Vector] = Intersect.rectVsVector;
		_shapeMap[_shapeID.Vector] = [];
		_shapeMap[_shapeID.Vector][_shapeID.Circle] = function(v, c) { return Intersect.circleVsVector(c, v); };
		_shapeMap[_shapeID.Vector][_shapeID.Polygon] = function(v, p) { return Intersect.polygonVsVector(p, v); };
		_shapeMap[_shapeID.Vector][_shapeID.Rect] = function(v, r) { return Intersect.rectVsVector(r, v); };
		_shapeMap[_shapeID.Vector][_shapeID.Vector] = Intersect.vectorVsVector;

		// init shapeMapSat
		_shapeMapSat[_shapeID.Circle] = [];
		_shapeMapSat[_shapeID.Circle][_shapeID.Circle] = Intersect.circleVsCircleSat;
		_shapeMapSat[_shapeID.Circle][_shapeID.Polygon] = Intersect.circleVsPolygonSat;
		_shapeMapSat[_shapeID.Circle][_shapeID.Rect] = Intersect.circleVsRectSat;
		_shapeMapSat[_shapeID.Circle][_shapeID.Vector] = Intersect.circleVsVectorSat;
		_shapeMapSat[_shapeID.Polygon] = [];
		_shapeMapSat[_shapeID.Polygon][_shapeID.Circle] = function(p, c) {
			var mtv = Intersect.circleVsPolygonSat(c, p);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Polygon][_shapeID.Polygon] = Intersect.polygonVsPolygonSat;
		_shapeMapSat[_shapeID.Polygon][_shapeID.Rect] = Intersect.polygonVsRectSat;
		_shapeMapSat[_shapeID.Polygon][_shapeID.Vector] = Intersect.polygonVsVectorSat;
		_shapeMapSat[_shapeID.Rect] = [];
		_shapeMapSat[_shapeID.Rect][_shapeID.Circle] = function(r, c) {
			var mtv = Intersect.circleVsRectSat(c, r);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Rect][_shapeID.Polygon] = function(r, p) {
			var mtv = Intersect.polygonVsRectSat(p, r);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Rect][_shapeID.Rect] = Intersect.rectVsRectSat;
		_shapeMapSat[_shapeID.Rect][_shapeID.Vector] = Intersect.rectVsVectorSat;
		_shapeMapSat[_shapeID.Vector] = [];
		_shapeMapSat[_shapeID.Vector][_shapeID.Circle] = function(v, c) {
			var mtv = Intersect.circleVsVectorSat(c, v);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Vector][_shapeID.Polygon] = function(v, p) {
			var mtv = Intersect.polygonVsVectorSat(p, v);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Vector][_shapeID.Rect] = function(v, r) {
			var mtv = Intersect.rectVsVectorSat(r, v);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Vector][_shapeID.Vector] = Intersect.vectorVsVectorSat;

		return Intersect;
	});

	Shape2D.IShape = (function() {
		/**
		 * @interface
		 */
		var IShape = function() { }; // class Shape

		// Shape applyTransform();
		IShape.prototype.applyTransform = function() { }; // applyTransform

		// Shape clone();
		IShape.prototype.clone = function() { }; // clone( )

		// Boolean equals();
		IShape.prototype.equals = function() { }; // equals( )

		// Vector getCenter();
		IShape.prototype.getCenter = function() { }; // getCenter( )

		// Number getShapeID();
		IShape.prototype.getShapeID = function() { }; // getShapeID( )

		// Shape setCenter();
		IShape.prototype.setCenter = function() { }; // setCenter( )

		// String toString();
		IShape.prototype.toString = function() { }; // toString( )

		return IShape;
	});

	Shape2D.Matrix = (function() {
		/**
		 * @class Matrix
		 *
		 * This is a 2D Matrix class. It is 3x3 to allow for affine transformations in 2D space.
		 * The third row is always assumed to be [0, 0, 1].
		 *
		 * Matrix uses the following form, as per the whatwg.org specifications for canvas.transform():
		 * [a, c, e]
		 * [b, d, f]
		 * [0, 0, 1]
		 *
		 * public {Matrix} new Matrix();
		 * public {Matrix} new Matrix(Matrix);
		 * public {Matrix} new Matrix(Number, Number, Number, Number, Number, Number);
		 *
		 * @public
		 * @constructor
		 * @param {Matrix|Number=1} a
		 * @param {Number=0} b
		 * @param {Number=0} c
		 * @param {Number=1} d
		 * @param {Number=0} e
		 * @param {Number=0} f
		 */
		var Matrix = function(a, b, c, d, e, f) {
			if (a instanceof Matrix) {
				this.a = a.a;
				this.b = a.b;
				this.c = a.c;
				this.d = a.d;
				this.e = a.e;
				this.f = a.f;
			} else if (arguments.length === 6) {
				this.a = a;
				this.b = b;
				this.c = c;
				this.d = d;
				this.e = e;
				this.f = f;
			} else if (arguments.length > 0)
				throw "Unexpected number of arguments for Matrix()";
		}; // class Matrix

		Matrix.prototype.a = 1;
		Matrix.prototype.b = 0;
		Matrix.prototype.c = 0;
		Matrix.prototype.d = 1;
		Matrix.prototype.e = 0;
		Matrix.prototype.f = 0;

		/**
		 * clone( )
		 *
		 * Creates an exact, numeric copy of the current matrix
		 *
		 * @public
		 * @sig public {Matrix} clone();
		 * @returns {Matrix}
		 */
		Matrix.prototype.clone = function() {
			return new Matrix(this);
		}; // clone( )

		/**
		 * combine( )
		 *
		 * Multiplies this matrix with another, overriding the values of this matrix.
		 * The passed matrix is assumed to be on the right-hand side.
		 *
		 * @public
		 * @sig public {Matrix} combine(Matrix);
		 * @param {Matrix} mtrxRH
		 * @returns {Matrix} this matrix after combination
		 */
		Matrix.prototype.combine = function(mtrxRH) {
			var tmp = this.a;
			this.a = tmp * mtrxRH.a + this.b * mtrxRH.c;
			this.b = tmp * mtrxRH.b + this.b * mtrxRH.d;
			tmp = this.c;
			this.c = tmp * mtrxRH.a + this.d * mtrxRH.c;
			this.d = tmp * mtrxRH.b + this.d * mtrxRH.d;
			tmp = this.e;
			this.e = tmp * mtrxRH.a + this.f * mtrxRH.c + mtrxRH.e;
			this.f = tmp * mtrxRH.b + this.f * mtrxRH.d + mtrxRH.f;
			return this;
		}; // combine( )

		/**
		 * equals( )
		 *
		 * Checks for the numeric equality of this matrix versus another.
		 *
		 * @public
		 * @sig public {Boolean} equals(Matrix);
		 * @param {Matrix} mtrxRH
		 * @returns {Boolean} true if the two matrices are numerically equal
		 */
		Matrix.prototype.equals = function(mtrxRH) {
			return mtrxRH instanceof Matrix &&
				this.a == mtrxRH.a && this.b == mtrxRH.b && this.c == mtrxRH.c &&
				this.d == mtrxRH.d && this.e == mtrxRH.e && this.f == mtrxRH.f;
		}; // equals( )

		/**
		 * getDeterminant( )
		 *
		 * Calculates the determinant of this matrix
		 *
		 * @public
		 * @sig public {Number} getDeterminant();
		 * @returns {Number} det(this matrix)
		 */
		Matrix.prototype.getDeterminant = function() {
			return this.a * this.d - this.b * this.c;
		}; // getDeterminant( )

		/**
		 * getRotation( )
		 *
		 * Gets the rotation applied to this matrix in radians as a scalar value.
		 * Angles returned have the range (−π, π].
		 *
		 * @public
		 * @sig public {Number} getRotation();
		 * @returns {Number} the rotation applied to this matrix in radians as a scalar value
		 */
		Matrix.prototype.getRotation = function() {
			return Math.atan2(this.b, this.a);
		}; // getRotation( )

		/**
		 * getScale( )
		 *
		 * Gets the scaling factors for each axis of this matrix as a 2D vector.
		 * 
		 * @public
		 * @sig public {Vector} getScale();
		 * @returns {Vector} 2D vector with the scaling factors for each axis
		 */
		Matrix.prototype.getScale = function() {
			return new Shape2D.Vector(
				Math.sqrt(this.a * this.a + this.b * this.b),
				Math.sqrt(this.c * this.c + this.d * this.d));
		}; // getScale( )

		/**
		 * getTranslation( )
		 *
		 * Gets the translation applied to this matrix as a 2D vector.
		 *
		 * @public
		 * @sig public {Vector} getTranslation();
		 * @returns {Vector} the translation applied to this vector as a 2D vector
		 */
		Matrix.prototype.getTranslation = function() {
			return new Shape2D.Vector(this.e, this.f);
		}; // getTranslation( )

		/**
		 * invert( )
		 *
		 * Inverts this matrix if possible
		 *
		 * @public
		 * @sig public {Matrix} invert();
		 * @returns {Matrix} this inverted matrix or the original matrix on failure
		 * @see Matrix.isInvertible( )
		 */
		Matrix.prototype.invert = function() {
			var det = this.getDeterminant();

			// matrix is invertible if its getDeterminant is non-zero
			if (det !== 0) {
				var old = {
					a: this.a,
					b: this.b,
					c: this.c,
					d: this.d,
					e: this.e,
					f: this.f
				};
				this.a = old.d / det;
				this.b = -old.b / det;
				this.c = -old.c / det;
				this.d = old.a / det;
				this.e = (old.c * old.f - old.e * old.d) / det;
				this.f = (old.e * old.b - old.a * old.f) / det;
			} // if

			return this;
		}; // invert( )

		/**
		 * isIdentity( )
		 *
		 * Returns true if this matrix is the identity matrix
		 *
		 * @public
		 * @sig public {Boolean} isIdentity();
		 * @returns {Boolean}
		 */
		Matrix.prototype.isIdentity = function() {
			return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
		}; // isIdentity( )

		/**
		 * isInvertible( )
		 *
		 * Determines is this matrix is invertible.
		 *
		 * @public
		 * @sig public {Boolean} isInvertible();
		 * @returns {Boolean} true if this matrix is invertible
		 * @see Matrix.invert( )
		 */
		Matrix.prototype.isInvertible = function() {
			return this.getDeterminant() !== 0;
		}; // isInvertible( )

		/**
		 * preRotate( )
		 *
		 * Applies a counter-clockwise pre-rotation to this matrix
		 *
		 * @public
		 * @sig public {Matrix} preRotate(Number);
		 * @param {number} rads - angle to rotate in radians
		 * @returns {Matrix} this matrix after pre-rotation
		 */
		Matrix.prototype.preRotate = function(rads) {
			var cos = Math.cos(rads);
			var sin = Math.sin(rads);

			var tmp = this.a;
			this.a = cos * tmp - sin * this.b;
			this.b = sin * tmp + cos * this.b;
			tmp = this.c;
			this.c = cos * tmp - sin * this.d;
			this.d = sin * tmp + cos * this.d;

			return this;
		}; // preRotate( )

		/**
		 * preScale( )
		 *
		 * Applies a pre-scaling to this matrix
		 *
		 * @public
		 * @sig public {Matrix} preScale(Number[, Number]);
		 * @param {Number} scalarX
		 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
		 * @returns {Matrix} this after pre-scaling
		 */
		Matrix.prototype.preScale = function(scalarX, scalarY) {
			if (scalarY === undefined)
				scalarY = scalarX;

			this.a *= scalarX;
			this.b *= scalarY;
			this.c *= scalarX;
			this.d *= scalarY;

			return this;
		}; // preScale( )

		/**
		 * preTranslate( )
		 *
		 * Applies a pre-translation to this matrix
		 *
		 * @public
		 * @sig public {Matrix} preTranslate(Vector);
		 * @sig public {Matrix} preTranslate(Number, Number);
		 * @param {Number|Vector} dx
		 * @param {Number} dy
		 * @returns {Matrix} this matrix after pre-translation
		 */
		Matrix.prototype.preTranslate = function(dx, dy) {
			if (typeof dx === "number") {
				this.e += dx;
				this.f += dy;
			} else {
				this.e += dx.x;
				this.f += dx.y;
			} // else

			return this;
		}; // preTranslate( )

		/**
		 * rotate( )
		 *
		 * Applies a counter-clockwise post-rotation to this matrix
		 *
		 * @public
		 * @sig public {Matrix} rotate(Number);
		 * @param {Number} rads - angle to rotate in radians
		 * @returns {Matrix} this matrix after rotation
		 */
		Matrix.prototype.rotate = function(rads) {
			var cos = Math.cos(rads);
			var sin = Math.sin(rads);

			var tmp = this.a;
			this.a = cos * tmp - sin * this.b;
			this.b = sin * tmp + cos * this.b;
			tmp = this.c;
			this.c = cos * tmp - sin * this.d;
			this.d = sin * tmp + cos * this.d;
			tmp = this.e;
			this.e = cos * tmp - sin * this.f;
			this.f = sin * tmp + cos * this.f;

			return this;
		}; // rotate( )

		/**
		 * scale( )
		 *
		 * Applies a post-scaling to this matrix
		 *
		 * @public
		 * @sig public {Matrix} scale(Number[, Number]);
		 * @param {Number} scalarX
		 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
		 * @returns {Matrix} this after post-scaling
		 */
		Matrix.prototype.scale = function(scalarX, scalarY) {
			if (scalarY === undefined)
				scalarY = scalarX;

			this.a *= scalarX;
			this.b *= scalarY;
			this.c *= scalarX;
			this.d *= scalarY;
			this.e *= scalarX;
			this.f *= scalarY;

			return this;
		}; // scale( )

		/**
		 * setValues( )
		 *
		 * Sets the values of this matrix
		 *
		 * @public
		 * @sig public {Matrix} setValues(Matrix);
		 * @sig public {Matrix} setValues(Number, Number, Number, Number, Number, Number);
		 * @param {Matrix|Number} a
		 * @param {Number} b
		 * @param {Number} c
		 * @param {Number} d
		 * @param {Number} e
		 * @param {Number} f
		 * @returns {Matrix} this matrix containing the new values
		 */
		Matrix.prototype.setValues = function(a, b, c, d, e, f) {
			if (a instanceof Matrix) {
				this.a = a.a;
				this.b = a.b;
				this.c = a.c;
				this.d = a.d;
				this.e = a.e;
				this.f = a.f;
			} else {
				this.a = a;
				this.b = b;
				this.c = c;
				this.d = d;
				this.e = e;
				this.f = f;
			} // else

			return this;
		}; // setValues( )

		/**
		 * toString( )
		 *
		 * Returns the string representation of this matrix.
		 *
		 * @public
		 * @sig public {String} toString();
		 * @returns {String}
		 */
		Matrix.prototype.toString = function() {
			return "Matrix([" + this.a + ", " + this.c + ", " + this.e +
				"] [" + this.b + ", " + this.d + ", " + this.f + "] [0, 0, 1])";
		}; // toString( )

		/**
		 * translate( )
		 *
		 * Applies a post-translation to this matrix
		 *
		 * @public
		 * @sig public {Matrix} translate(Vector);
		 * @sig public {Matrix} translate(Number, Number);
		 * @param {Number|Vector} dx
		 * @param {Number} dy
		 * @returns {Matrix} this matrix after post-translation
		 */
		Matrix.prototype.translate = function(dx, dy) {
			if (typeof dx === "number") {
				this.e += this.a * dx + this.c * dy;
				this.f += this.b * dx + this.d * dy;
			} else {
				this.e += this.a * dx.x + this.c * dx.y;
				this.f += this.b * dx.x + this.d * dx.y;
			} // else

			return this;
		}; // translate( )

		return Matrix;
	});

	Shape2D.Polygon = (function() {
		// Polygon(Polygon);
		// Polygon(Array<Vector>);
		var Polygon = function(polygon) {
			if (polygon instanceof Polygon) {
				if (polygon._center !== undefined)
					this._center = polygon._center.clone();
				this._r = polygon._r;
				polygon = polygon._vertices;
			} // if

			// make sure there are at least 3 vertices
			if (polygon.length < 3)
				throw "Cannot construct polygon with fewer than 3 vertices!";

			// deep copy vertex array
			this._vertices = [];
			for (var i = 0; i < polygon.length; i++) {
				this._vertices.push(new Shape2D.Vector(polygon[i]));
			} // for( i )
		}; // class Polygon

		Polygon.prototype = new Shape2D.IShape();
		Polygon.prototype._center = undefined;
		Polygon.prototype._r = -1;
		Polygon.prototype._vertices = undefined;

		// Polygon applyTransform();
		Polygon.prototype.applyTransform = function(matrix) {
			for (var i = 0; i < this._vertices.length; i++) {
				this._vertices[i].applyTransform(matrix);
			} // for( i )

			// invalidate caches
			this._center = undefined;
			this._r = -1;

			return this;
		}; // applyTransform

		Polygon.prototype.clone = function() {
			return new Polygon(this);
		}; // clone( )

		Polygon.prototype.equals = function(polygon) {
			if (!(polygon instanceof Polygon) || this._vertices.length != polygon._vertices.length)
				return false;

			for (var i = 0; i < this._vertices.length; i++) {
				if (!this._vertices[i].equals(polygon._vertices[i]))
					return false;
			} // for( i )

			return true;
		}; // equals( )

		Polygon.prototype.getBoundingCircle = function() {
			return new Shape2D.Circle(this.getCenter(), this._getRadius());
		};

		Polygon.prototype.getCenter = function() {
			if (this._center === undefined) {
				var x = 0;
				var y = 0;

				for (var i = 0; i < this._vertices.length; i ++) {
					x += this._vertices[i].x;
					y += this._vertices[i].y;
				} // for( i )

				this._center = new Shape2D.Vector(x / this._vertices.length, y / this._vertices.length);
			} // if

			return this._center.clone();
		}; // getCenter( )

		// Number _getRadius();
		Polygon.prototype._getRadius = function() {
			if (this._r === -1) {
				var c = this.getCenter();
				var r = 0;
				var tmp;
				var v;
				for (var i = 0; i < this._vertices.length; i++) {
					v = this._vertices[i];
					tmp = (v.x - c.x) * (v.x - c.x) + (v.y - c.y) * (v.y - c.y);
					if (tmp > r)
						r = tmp;
				} // for( i )

				// update cached radius
				this._r = Math.sqrt(r);
			} // if

			return this._r;
		}; // _getRadius( )

		// Number getShapeID();
		Polygon.prototype.getShapeID = function() {
			return _shapeID.Polygon;
		}; // getShapeID( )

		// Array<Vector> getVertices();
		Polygon.prototype.getVertices = function() {
			return this._vertices.slice();
		}; // getVertices( )

		// Polygon setCenter(Number, Number);
		// Polygon setCenter(Vector);
		Polygon.prototype.setCenter = function(x, y) {
			// calculate offset from old center
			var offset = this.getCenter();
			if (x instanceof Shape2D.Vector) {
				offset.x = x.x - offset.x;
				offset.y = x.y - offset.y;
				
				// update cached center point
				this._center = x;
			} else {
				offset.x = x - offset.x;
				offset.y = y - offset.y;
				
				// update cached center point
				this._center = new Shape2D.Vector(x, y);
			} // else

			// update polygon vertices with new offset
			for (var i = 0; i < this._vertices.length; i++) {
				this._vertices[i].x += offset.x;
				this._vertices[i].y += offset.y;
			} // for( i )

			return this;
		}; // setCenter( )

		Polygon.prototype.toString = function() {
			var s = "Polygon(";

			for (var i = 0; i < this._vertices.length; i++) {
				s += "<" + this._vertices[i].x + "," + this._vertices[i].y + ">,"
			} // for( i )

			return s.replace(/,$/, "") + ")";
		}; // toString( )

		return Polygon;
	});

	Shape2D.Rect = (function() {
		// Rect(Rect);
		// Rect(Number, Number, Number, Number);
		var Rect = function(x, y, w, h) {
			if (x instanceof Rect) {
				this.h = x.h;
				this.w = x.w;
				this.x = x.x;
				this.y = x.y;
			} else {
				this.h = h;
				this.w = w;
				this.x = x;
				this.y = y;
			} // else
		}; // class Rect

		Rect.prototype = new Shape2D.IShape();
		Rect.prototype.h = 1;
		Rect.prototype.w = 1;
		Rect.prototype.x = -0.5;
		Rect.prototype.y = 0.5;

		// Rect applyTransform(Matrix);
		Rect.prototype.applyTransform = function(matrix) {
			// transform center
			var tmp = this.getCenter();
			tmp.applyTransform(matrix);
			this.setCenter(tmp);

			// scale dimensions
			tmp = matrix.getScale();
			this.h *= tmp.y;
			this.w *= tmp.x;

			return this;
		}; // applyTransform( )

		// Rect clone();
		Rect.prototype.clone = function() {
			return new Rect(this);
		} // clone( )

		// Boolean equals(Rect);
		Rect.prototype.equals = function(rect) {
			return (rect instanceof Rect &&
				this.x == rect.x &&
				this.y == rect.y &&
				this.w == rect.w &&
				this.h == rect.h);
		} // equals( )

		// Vector getCenter();
		Rect.prototype.getCenter = function() {
			return new Shape2D.Vector(this.x + this.w/2, this.y - this.h/2);
		}; // getCenter( )

		// Number getShapeID();
		Rect.prototype.getShapeID = function() {
			return _shapeID.Rect;
		}; // getShapeID( )

		Rect.prototype.getVertices = function() {
			return [
				new Shape2D.Vector(this.x, this.y),
				new Shape2D.Vector(this.x + this.w, this.y),
				new Shape2D.Vector(this.x + this.w, this.y - this.h),
				new Shape2D.Vector(this.x, this.y - this.h)
			];
		}; // getVertices( )

		// Rect setCenter(Vector);
		Rect.prototype.setCenter = function(x, y) {
			if (x instanceof Shape2D.Vector) {
				this.x = x.x - this.w/2;
				this.y = x.y + this.h/2;
			} else {
				this.x = x - this.w/2;
				this.y = y + this.h/2;
			} // if/else

			return this;
		} // setCenter( )

		// String toString();
		Rect.prototype.toString = function() {
			return "Rect(" + this.x + ", " + this.y + ", " + this.w + ", " + this.h + ")";
		} // toString( )

		return Rect;
	});

	Shape2D.Vector = (function() {
		/**
		 * Vector
		 *
		 * @class This is a general purpose 2D vector class
		 *
		 * Vector uses the following form:
		 * <x, y>
		 *
		 * public {Vector} Vector();
		 * public {Vector} Vector(Vector);
		 * public {Vector} Vector(Number, Number);
		 *
		 * @public
		 * @constructor
		 * @param {Vector|Number=0} x
		 * @param {Number=0} y
		 */
		var Vector = function(x, y) {
			if (x instanceof Vector) {
				this.x = x.x;
				this.y = x.y;
			} else if (arguments.length === 2) {
				this.x = x;
				this.y = y;
			} else if (arguments.length > 0)
				throw "Unexpected number of arguments for Vector()";
		}; // class Vector

		Vector.shapeID = _shapeID.Vector;
		Vector.prototype = new Shape2D.IShape();
		Vector.prototype.x = 0;
		Vector.prototype.y = 0;

		/**
		 * add( )
		 *
		 * Adds the passed vector to this vector
		 *
		 * public {Vector} add(Vector);
		 *
		 * @public
		 * @param {Vector} vecRH
		 * @returns {Vector} this after adding
		 */
		Vector.prototype.add = function(vecRH) {
			this.x += vecRH.x;
			this.y += vecRH.y;
			return this;
		}; // add( )

		/**
		 * angleBetween( )
		 *
		 * Calculates the angle between the passed vector and this vector, using <0,0> as the point of reference.
		 * Angles returned have the range (−π, π].
		 *
		 * public {Number} angleBetween(Vector);
		 *
		 * @public
		 * @param {Vector} vecRH
		 * @returns {Number} the angle between the two vectors in radians
		 */
		Vector.prototype.angleBetween = function(vecRH) {
			return Math.atan2(this.x * vecRH.y - this.y * vecRH.x, this.x * vecRH.x + this.y * vecRH.y);
		}; // angleBetween( )

		/**
		 * angleTo( )
		 *
		 * Calculates the angle to the passed vector from this vector, using this vector as the point of reference.
		 *
		 * public {Number} angleTo(Vector);
		 *
		 * @public
		 * @param {Vector} vecRH
		 * @returns {Number} the angle to the passed vector in radians
		 */
		Vector.prototype.angleTo = function(vecRH) {
			return Math.atan2(vecRH.y - this.y, vecRH.x - this.x);
		};

		/**
		 * applyTransform( )
		 *
		 * Applies the given matrix transformation onto this Vector.
		 * Inherited from Shape2D.Shape.
		 *
		 * Vector applyTransform();
		 *
		 * @public
		 * @returns {Vector} this vector after applying the given transformation
		 */
		Vector.prototype.applyTransform = function(matrix) {
			var oldX = this.x;
			this.x = matrix.a * oldX + matrix.c * this.y + matrix.e;
			this.y = matrix.b * oldX + matrix.d * this.y + matrix.f;
			return this;
		}; // applyTransform( )

		/**
		 * clone( )
		 *
		 * Creates and exact, numeric copy of this vector
		 *
		 * public {Vector} clone();
		 *
		 * @public
		 * @returns {Vector} the new vector
		 */
		Vector.prototype.clone = function() {
			return new Vector(this);
		}; // clone( )

		/**
		 * distance( )
		 *
		 * Calculates the distance from this vector to the passed vector.
		 *
		 * public {Number} distance(Vector);
		 *
		 * @public
		 * @param {Vector} vecRH
		 * @returns {Number} the distance between the two vectors
		 */
		Vector.prototype.distance = function(vecRH) {
			return Math.sqrt((vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y));
		}; // distance( )

		/**
		 * distanceSq( )
		 *
		 * Calculates the squared distance from this vector to the passed vector.
		 * This function avoids calculating the square root, thus being slightly faster than .distance( ).
		 *
		 * public {Number} distanceSq(Vector);
		 *
		 * @public
		 * @param {Vector} vecRH
		 * @returns {Number} the squared distance between the two vectors
		 * @see Vector.distance( )
		 */
		Vector.prototype.distanceSq = function(vecRH) {
			return (vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y);
		}; // distanceSq( )

		/**
		 * divide( )
		 *
		 * Divides this vector by the passed vector.
		 *
		 * public {Vector} divide(Vector);
		 *
		 * @public
		 * @param {Vector} vecRH
		 * @returns {Vector} this vector after dividing
		 */
		Vector.prototype.divide = function(vecRH) {
			this.x /= vecRH.x;
			this.y /= vecRH.y;
			return this;
		}; // divide( )

		/**
		 * dotProduct( )
		 *
		 * Calculates the dot product of this and the passed vectors
		 *
		 * public {Number} dotProduct(Vector);
		 *
		 * @public
		 * @param {Vector} vecRH
		 * @returns {Number} the resultant dot product
		 */
		Vector.prototype.dotProduct = function(vecRH) {
			return this.x * vecRH.x + this.y * vecRH.y;
		}; // dotProduct( )

		/**
		 * equals( )
		 *
		 * Determines if this vector is numerically equivalent to the passed vector.
		 *
		 * public {Boolean} equals(Vector);
		 *
		 * @public
		 * @param {Vector} vecRH
		 * @returns {Boolean} true if the vectors are equivalent
		 */
		Vector.prototype.equals = function(vecRH) {
			return vecRH instanceof Vector &&
				this.x == vecRH.x && this.y == vecRH.y;
		}; // equals( )

		/**
		 * getCenter( )
		 *
		 * Gets the center of this Shape as a 2D Vector.
		 * Inherited from Shape2D.Shape.
		 *
		 * {Vector} getCenter();
		 *
		 * @public
		 * @returns {Vector} the center of this Shape as a 2D Vector
		 */
		Vector.prototype.getCenter = function() {
			return new Vector(this);
		}; // getCenter( )

		/**
		 * getNormal( )
		 *
		 * Calculates a new right-handed normal vector for the line created by this and the passed vectors.
		 *
		 * public {Vector} getNormal([Vector]);
		 *
		 * @public
		 * @param {Vector=<0,0>} [vecRH]
		 * @returns {Vector} the new normal vector
		 */
		Vector.prototype.getNormal = function(vecRH) {
			if (vecRH === undefined)
				return new Vector(-this.y, this.x); // assume vecRH is <0, 0>
			return new Vector(vecRH.y - this.y, this.x - vecRH.x).normalize();
		}; // getNormal( )

		/**
		 * getShapeID( )
		 *
		 * Gets the ShapeID associated with the Vector class
		 *
		 * @public
		 * @sig public {Number} getShapeID();
		 * @returns {Number} the ShapeID associated with the Vector class
		 */
		Vector.prototype.getShapeID = function() {
			return _shapeID.Vector;
		}; // getShapeID( )

		/**
		 * isZero( )
		 *
		 * Determines if this vector is equal to <0,0>
		 *
		 * @public
		 * @sig public {Boolean} isZero();
		 * @returns {Boolean} true if this vector is equal to <0,0>
		 */
		Vector.prototype.isZero = function() {
			return this.x === 0 && this.y ===0;
		}; // isZero( )

		/**
		 * magnitude( )
		 *
		 * Calculates the magnitude of this vector.
		 * Note: Function objects in JavaScript already have a 'length' member, hence the use of magnitude instead.
		 *
		 * @public
		 * @sig public {Number} magnitude();
		 * @returns {Number} the magnitude of this vector
		 */
		Vector.prototype.magnitude = function() {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		}; // magnitude( )

		/**
		 * magnitudeSq( )
		 *
		 * Calculates the square of the magnitude of this vector.
		 * This function avoids calculating the square root, thus being slightly faster than .magnitude( ).
		 *
		 * @public
		 * @sig public {Number} magnitudeSq();
		 * @returns {Number} the square of the magnitude of this vector
		 * @see Vector.magnitude( )
		 */
		Vector.prototype.magnitudeSq = function() {
			return this.x * this.x + this.y * this.y;
		}; // magnitudeSq( )

		/**
		 * multiply( )
		 *
		 * Multiplies this vector by the passed vector
		 *
		 * @public
		 * @sig public {Vector} multiply(Vector);
		 * @param {Vector} vecRH
		 * @returns {Vector} this vector after multiplying
		 */
		Vector.prototype.multiply = function(vecRH) {
			this.x *= vecRH.x;
			this.y *= vecRH.y;
			return this;
		}; // multiply( )

		/**
		 * negate( )
		 *
		 * Negates this vector (ie. <-x,-y>)
		 *
		 * @public
		 * @sig public {Vector} negate();
		 * @returns {Vector} this vector after negation
		 */
		Vector.prototype.negate = function() {
			this.x = -this.x;
			this.y = -this.y;
			return this;
		}; // negate( )

		/**
		 * normalize( )
		 *
		 * Normalizes this vector (scales the vector so that its new magnitude is 1)
		 * For vectors where magnitude is 0, <0,0> is returned.
		 *
		 * @public
		 * @sig public {Vector} normalize();
		 * @returns {Vector} this vector after normalization
		 */
		Vector.prototype.normalize = function() {
			var lng = Math.sqrt(this.x * this.x + this.y * this.y);

			if (lng !== 0) {
				this.x /= lng;
				this.y /= lng;
			} // else

			return this;
		}; // normalize( )

		/**
		 * perpendicular( )
		 *
		 * Rotates this vector 90°, making it perpendicular to its current orientation
		 *
		 * @public
		 * @sig public {Vector} perpendicular();
		 * @returns {Vector} this vector after rotating 90°
		 */
		Vector.prototype.perpendicular = function() {
			var x = this.x;
			this.x = -this.y;
			this.y = x;

			return this;
		}; // perpendicular( )

		/**
		 * projectOnto( )
		 *
		 * Projects this vector onto vecRH
		 *
		 * projection of a onto b:
		 *
		 * proj.x = (dp / (b.x * b.x + b.y * b.y)) * b.x;
		 * proj.y = (dp / (b.x * b.x + b.y * b.y)) * b.y;
		 *
		 * dp is the dot product of a and b
		 * (b.x * b.x + b.y * b.y) is the magnitude of b squared
		 *
		 * @public
		 * @sig public {Vector} projectOnto(Vector);
		 * @param {Vector} vecRH
		 * @returns {Vector} this vector after projection
		 */
		Vector.prototype.projectOnto = function(vecRH) {
			// projection of a onto b:
			//
			// proj.x = (dp / (b.x * b.x + b.y * b.y)) * b.x;
			// proj.y = (dp / (b.x * b.x + b.y * b.y)) * b.y;
			//
			// dp is the dot product of a and b
			// (b.x * b.x + b.y * b.y) is the magnitude of b squared

			var scalar = this.dotProduct(vecRH) / vecRH.magnitudeSq();

			this.x = scalar * vecRH.x;
			this.y = scalar * vecRH.y;

			return this;
		}; // projectOnto( )

		/**
		 * rotate( )
		 *
		 * Rotates this vector about its origin by 'rads' radians
		 *
		 * @public
		 * @sig public {Vector} rotate(Number);
		 * @param {Number} rads
		 * @returns {Vector} this vector after rotation
		 */
		Vector.prototype.rotate = function(rads) {
			var x = this.x;
			this.x = x * Math.cos(rads) - this.y * Math.sin(rads);
			this.y = x * Math.sin(rads) - this.y * Math.cos(rads);

			return this;
		}; // rotate( )

		/**
		 * scale( )
		 *
		 * Scales this vector by the passed amount(s)
		 * If scalarY is omitted, scalarX is used for both axes
		 *
		 * @public
		 * @sig public {Vector} scale(Number[, Number]);
		 * @param {Number} scalarX
		 * @param {Number} [scalarY]
		 * @returns {Vector} this after scaling
		 */
		Vector.prototype.scale = function(scalarX, scalarY) {
			if (scalarY === undefined)
				scalarY = scalarX;

			this.x *= scalarX;
			this.y *= scalarY;

			return this;
		}; // scale( )

		/**
		 * scaleToMagnitude( )
		 *
		 * Scales this vector such that its new magnitude is equal to the passed value.
		 *
		 * @public
		 * @sig public {Vector} scaleToMagnitude(Number);
		 * @param {Number} mag
		 * @returns {Vector} this vector after scaling
		 */
		Vector.prototype.scaleToMagnitude = function(mag) {
			var k = mag / this.magnitude();
			this.x *= k;
			this.y *= k;
			return this;
		}; // scaleToMagnitude( )

		/**
		 * setCenter( )
		 *
		 * Sets the values of this vector using a passed vector or pair of numbers.
		 *
		 * @public
		 * @sig public {Vector} setCenter(Vector);
		 * @sig public {Vector} setCenter(Number, Number);
		 * @param {Number|Vector} x
		 * @param {Number} y
		 * @returns {Vector} this vector after setting of values
		 */
		Vector.prototype.setCenter = function(x, y) {
			if (x instanceof Vector) {
				this.x = x.x;
				this.y = x.y;
			} else {
				this.x = x;
				this.y = y;
			} // else

			return this;
		}; // setCenter( )
		
		/**
		 * subtract( )
		 *
		 * Subtracts the passed vector from this vector.
		 *
		 * @public
		 * @sig public {Vector} subtract(Vector);
		 * @param {Vector} vecRH
		 * @returns {Vector} this vector after subtracting
		 */
		Vector.prototype.subtract = function(vecRH) {
			this.x -= vecRH.x;
			this.y -= vecRH.y;
			return this;
		}; // subtract( )

		/**
		 * toString( )
		 *
		 * Returns a string representation of this vector.
		 *
		 * @public
		 * @sig public {String} toString();
		 * @returns {String}
		 */
		Vector.prototype.toString = function() {
			return "Vector(" + this.x + ", " + this.y + ")";
		}; // toString( )

		/**
		 * translate( )
		 *
		 * Translates (moves) this vector by the passed amounts.
		 * If dy is omitted, dx is used for both axes.
		 *
		 * @public
		 * @sig public {Vector} translate(Number[, Number]);
		 * @param {Number} dx
		 * @param {Number} [dy]
		 * @returns {Vector} this vector after translating
		 */
		Vector.prototype.translate = function(dx, dy) {
			if (dy === undefined)
				dy = dx;

			this.x += dx;
			this.y += dy;

			return this;
		}; // translate( )

		/**
		 * longest( )
		 *
		 * Returns whichever vector is the longest
		 *
		 * @public
		 * @static
		 * @sig public {Vector} longest(Vector, Vector);
		 * @param {Vector} a
		 * @param {Vector} b
		 * @return {Vector} whichever vector is the longest. 'a' is returned if they are equal.
		 */
		Vector.longest = function(a, b) {
			if (a.x * a.x + a.y * a.y >= b.x * b.x + b.y * b.y)
				return a;
			return b;
		}; // longest( )

		/**
		 * shortest( )
		 *
		 * Returns whichever vector is the shortest
		 *
		 * @public
		 * @static
		 * @sig public {Vector} longest(Vector, Vector);
		 * @param {Vector} a
		 * @param {Vector} b
		 * @return {Vector} whichever vector is the shortest. 'a' is returned if they are equal.
		 */
		Vector.shortest = function(a, b) {
			if (a.x * a.x + a.y * a.y <= b.x * b.x + b.y * b.y)
				return a;
			return b;
		}; // shortest( )

		/**
		 * tripleProduct( )
		 *
		 * Calculates the triple product of three vectors.
		 * triple vector product = b(a•c) - a(b•c)
		 *
		 * @public
		 * @static
		 * @sig public {Vector} tripleProduct(Vector, Vector, Vector);
		 * @param {Vector} a
		 * @param {Vector} b
		 * @param {Vector} c
		 * @return {Vector} the triple product as a new vector
		 */
		Vector.tripleProduct = function(a, b, c) {
			var ac = a.dotProduct(c);
			var bc = b.dotProduct(c);
			return new Vector(b.x * ac - a.x * bc, b.y * ac - a.y * bc);
		};

		return Vector;
	});

	// init in the correct order
	Shape2D.IShape = Shape2D.IShape();
	Shape2D.Circle = Shape2D.Circle(); // requires IShape
	Shape2D.Rect = Shape2D.Rect(); // requires IShape
	Shape2D.Vector = Shape2D.Vector(); // requires IShape
	Shape2D.Polygon = Shape2D.Polygon(); // requires Vector
	Shape2D.Matrix = Shape2D.Matrix(); // requires Vector
	Shape2D.Intersect = Shape2D.Intersect(); // requires Circle, Polygon, Rect, Vector, Intersection

	return Shape2D;
});

Impulse.Util = (function() {
	var Util = {};

	Util.Collection = (function() {
		var Collection = function() {
			this._arr = Array.prototype.slice.call(arguments);
		}; // class Collection

		Collection.prototype._arr = undefined;

		Collection.prototype.add = function(item) {
			this._arr.push(item);
		};

		Collection.prototype.at = function(index) {
			return this._arr[index];
		}; // at( )

		Collection.prototype.clear = function() {
			this._arr.splice(0, this._arr.length);
		}; // clear( )

		Collection.prototype.contains = function(item) {
			return this._arr.indexOf(item) >=0;
		}; // contains( )

		Collection.prototype.insert = function(index, item) {
			this._arr.splice(index, 0, item);
		}; // insert( )

		Collection.prototype.length = function() {
			return this._arr.length;
		}; // length( )

		Collection.prototype.remove = function(item) {
			var index = this._arr.indexOf(item);
			if (index >= 0)
				this._arr.splice(index, 1);
		}; // remove( )

		Collection.prototype.removeAt = function(index) {
			this._arr.splice(index, 1);
		}; // removeAt( )

		Collection.prototype.toString = function() {
			return this._arr.toString();
		}; // toString( )

		return Collection;
	})();

	Util.EventDelegate = (function() {
		/**
		 * Creates a new EventDelegate object.
		 *
		 * @public
		 * @constructor
		 * @class A delegate class for easily managing custom event handling.
		 * @returns {EventDelegate} Returns a new EventDelegate.
		 */
		var EventDelegate = function() {
			this._handlers = [];
			this._removeQueue = [];
		}; // class EventDelegate

		EventDelegate.prototype._handlers = undefined;
		EventDelegate.prototype._isLocked = false;
		EventDelegate.prototype._removeQueue = undefined;

		/**
		 * Adds an event handler to this EventDelegate
		 *
		 * @public
		 * @param {function([Object])} handler
		 */
		EventDelegate.prototype.add = function(handler) {
			this._handlers.push(handler);
		}; // add( )

		/**
		 * Dispatches this EventDelegate, calling all the event handlers that have been previously added to this
		 * EventDelegate.
		 *
		 * @public
		 */
		EventDelegate.prototype.dispatch = function() {
			this._isLocked = true;
			for (var i = 0; i < this._handlers.length; i++) {
				this._handlers[i].apply(undefined, arguments);
			} // for( i )
			this._isLocked = false;

			// remove any handlers in the remove queue
			for (var i = 0; i < this._removeQueue.length; i++) {
				var index = this._handlers.indexOf(this._removeQueue[i]);
				if (index >= 0)
					this._handlers.splice(index, 1);
			} // for( i )
			this._removeQueue = [];
		}; // dispatch( )

		/**
		 * Removes an event handler from this EventDelegate.
		 *
		 * @public
		 * @param {function([object])} handler
		 */
		EventDelegate.prototype.remove = function(handler) {
			if (this._isLocked)
				this._removeQueue.push(handler);
			else {
				var index = this._handlers.indexOf(handler);
				if (index >= 0)
					this._handlers.splice(index, 1);
			} // else
		}; // remove( )

		return EventDelegate;
	})();

	Util.EventedCollection = (function() {
		var Collection = Util.Collection;
		var EventDelegate = Util.EventDelegate;

		var EventedCollection = function() {
			Collection.apply(this, arguments);
			this.added = new EventDelegate();
			this.removed = new EventDelegate();
		};

		EventedCollection.prototype = new Collection();

		EventedCollection.prototype.added = undefined;
		EventedCollection.prototype.removed = undefined;

		EventedCollection.prototype.add = function(item) {
			this._arr.push(item);
			this.added.dispatch(this, item);
		}; // add( )

		EventedCollection.prototype.clear = function() {
			var arr = this._arr.splice(0, this._arr.length);
			for (var i = 0; i < arr.length; i++) {
				this.removed.dispatch(this, arr[i]);
			} // for( i )
		}; // clear( )

		EventedCollection.prototype.insert = function(index, item) {
			this._arr.splice(index, 0, item);
			this.added.dispatch(this, item);
		}; // insert( )

		EventedCollection.prototype.remove = function(item) {
			var index = this._arr.indexOf(item);
			if (index >= 0)
			{
				this._arr.splice(index, 1);
				this.removed.dispatch(this, item);
			} // if
		}; // remove( )

		EventedCollection.prototype.removeAt = function(index) {
			var dispatch = this._arr.length > 0;
			var item = this._arr.splice(index, 1);
			if (dispatch)
				this.removed.dispatch(this, item);
		}; // removeAt( )

		return EventedCollection;
	})();

	Util.Timing = (function() {
		var Timing = {
			isHighResolution: false,
			now: undefined
		};

		// IE 9 has performance, but not performance.now
		if (window.performance !== undefined && performance.now !== undefined) {
			Timing.isHighResolution = true;
			Timing.now = function() {
				return performance.now();
			};
		} // if
		else {
			var start = new Date() | 0;
			Timing.now = function() { return (new Date() | 0) - start; };
		} // else

		return Timing;
	})();

	return Util;
});

// Init Impulse in the correct order
Impulse.Networking = Impulse.Networking();
Impulse.Util = Impulse.Util();
Impulse.Shape2D = Impulse.Shape2D();
Impulse.Input = Impulse.Input(); // depends Shape2D
Impulse.Model2D = Impulse.Model2D(); // depends Shape2D, Util
Impulse.Entity = Impulse.Entity(); // depends Model2D
Impulse.Scene2D = Impulse.Scene2D(); // depends Entity, Input, Shape2D

return Impulse;

})(this);

});