// This file defines all the models used in the game. This includes references to sprite
// images and animation definitions

define(['../lib/impulse', 'animation-names'], function(Impulse, AnimationNames) {
	
	// imports

	var Animation = Impulse.Model2D.Animation;
	var Matrix = Impulse.Shape2D.Matrix;
	var Model = Impulse.Model2D.Model;
	var Rect = Impulse.Shape2D.Rect;

	// define berry model
	var berrySprite = new Image();
	berrySprite.src = "assets/optimize/berry.png";
	var berryModel = new Model(berrySprite);
	berryModel.animations[AnimationNames.normal] = new Animation(new Rect(0, 0, 44, 44), 6, 1200, (new Matrix()).translate(-22, 22));

	// define segment model
	var segmentSprite = new Image();
	segmentSprite.src = "assets/optimize/segment.png";
	var segmentModel = new Model(segmentSprite);
	segmentModel.animations[AnimationNames.normal0] = new Animation(new Rect(0, 0, 130, 130), 5, 1000, (new Matrix()).translate(-60, 60));
	segmentModel.animations[AnimationNames.normal1] = new Animation(new Rect(0, 130, 130, 130), 5, 1000, (new Matrix()).translate(-60, 60));
	segmentModel.animations[AnimationNames.normal2] = new Animation(new Rect(0, 260, 130, 130), 5, 1000, (new Matrix()).translate(-60, 60));
	segmentModel.animations[AnimationNames.normal3] = new Animation(new Rect(0, 390, 130, 130), 5, 1000, (new Matrix()).translate(-60, 60));
	segmentModel.animations[AnimationNames.normal4] = new Animation(new Rect(0, 520, 130, 130), 5, 1000, (new Matrix()).translate(-60, 60));

	return {
		berry: berryModel,
		segment: segmentModel
	};
});