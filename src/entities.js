// This file defines all of the game engine Entity classes. These are used by
// Impulse to position and draw the graphical representations of in-game objects

define(['../lib/impulse', '../lib/underscore', 'models', 'animation-names'], function(Impulse, _, Models, AnimationNames) {
	
	// Imports

	var Entity = Impulse.Entity;
	var Rect = Impulse.Shape2D.Rect;
	var Vector = Impulse.Shape2D.Vector;

	// BlockEntity base class

	var BlockEntity = function(model, position, parent, flags) {
		var collidable = new Rect(-60, 60, 120, 120);
		Entity.call(this, model, position, collidable, parent, flags);
	};

	_.extend(BlockEntity.prototype, Entity.prototype);

	// BerryEntity Entity Class

	var BerryEntity = function(position) {
		BlockEntity.call(this, Models.berry, position);
		this.modelState.playAnimation(AnimationNames.normal);
	};

	_.extend(BerryEntity.prototype, BlockEntity.prototype);

	// SegmentEntity Entity Class

	var SegmentEntity = function(position) {
		BlockEntity.call(this, Models.segment, position);
		this.modelState.playAnimation(AnimationNames['normal' + (Math.random() * 5 | 0)]);
	};

	_.extend(SegmentEntity.prototype, BlockEntity.prototype);

	// Export entity classes

	return {
		Berry: BerryEntity,
		Segment: SegmentEntity
	};
});