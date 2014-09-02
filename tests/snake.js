var assert = require("assert");
var requirejs = require("requirejs");



requirejs.config({
    baseUrl: __dirname + "/../src",
    nodeRequire: require
});



describe('Snake', function(){
	var Snake = requirejs('../src/snake');
	describe('#set direction()', function(){
		it('should throw \'unknown direction\' error', function(){
			var s = new Snake(0, 0, 'right');
			assert.throws(function() { s.direction = 'East'; }, /Unknown direction/);
		})
	})
	describe('#down()', function(){
		it('should move to {x:0, y:1}', function(){
			var s = new Snake(0, 0, 'right');
			s.down();
			assert.equal(s.head.x, 0);
			assert.equal(s.head.y, 1);
		})
	})
	describe('#grow()', function(){
		it('length should be 4', function(){
			var s = new Snake(0, 0, 'right');
			s.grow();
			assert.equal(s.length, 4);
		})
	})
	describe('#left()', function(){
		it('should move to {x:-1, y:0}', function(){
			var s = new Snake(0, 0, 'down');
			s.left();
			assert.equal(s.head.x, -1);
			assert.equal(s.head.y, 0);
		})
	})
	describe('#right()', function(){
		it('should move to {x:1, y:0}', function(){
			var s = new Snake(0, 0, 'up');
			s.right();
			assert.equal(s.head.x, 1);
			assert.equal(s.head.y, 0);
		})
	})
	describe('#up()', function(){
		it('should move to {x:0, y:0} (snake can\'t double back on itself)', function(){
			var s = new Snake(0, 0, 'down');
			s.up();
			assert.equal(s.head.x, 0);
			assert.equal(s.head.y, 0);
		})
		it('should move to {x:0, y:-1}', function(){
			var s = new Snake(0, 0, 'left');
			s.up();
			assert.equal(s.head.x, 0);
			assert.equal(s.head.y, -1);
		})
	})
})