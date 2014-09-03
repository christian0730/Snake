// requirejs configuration here
// make sure to include 3rd party libs in the 'shim' block
requirejs.config({
	shim: {
		// use jquery for registering events and getting element references
		'../lib/jquery-2.1.1': {
			exports: '$'
		},
		// used keymaster for easily binding keys
		'../lib/keymaster': {
			exports: 'key'
		},
		// use underscore for function binding and extending prototypes
		'../lib/underscore': {
			exports: '_'
		}
	}
});

require(['../lib/jquery-2.1.1', 'snake-game'], function($, SnakeGame) {
	function OnResize() {
		var layer1 = $('#layer1')[0];

		// resize the canvas to the largest possible size, locking aspect ratio
		var w = window.innerWidth;
		var h = window.innerHeight;
		layer1.width = Math.min(w, h * 1.387);
		layer1.height = Math.min(h, w / 1.387);

		// center the canvas
		layer1.style.marginLeft = (w - layer1.width) / 2 + "px";
		layer1.style.marginTop = (h - layer1.height) / 2 + "px";
	} // OnResize( )

	$(function() {
		// make sure to resize the canvas when the window resizes
		window.addEventListener("resize", OnResize);
		OnResize();

		var game = null;
		var reset = null;

		$('#btn_play').click(function() {
			// hide the menu HTML
			$('#ui_menu').toggleClass('hidden');

			// if no game instance exists, create a new one
			if (game === null) {
				// initialize using an HTML canvas as the render target
				game = new SnakeGame($('#layer1')[0]);

				// hook into the score changed event for updating the UI
				game.onScoreChanged.add(function(score, highScore) {
					// update the UI's current score and high score
					$('#ui_score_value').text(score | 0);
					$('#ui_highScore_value').text(highScore | 0);
				});

				// hook into the paused event for updating the UI
				game.onPaused.add(function(isPaused) {
					// the game is paused on reset, make sure to hide 'you lost' banner
					$('#ui_lost').addClass('hidden');

					// show/hide 'paused' banner depending on game pause state
					if (isPaused)
						$('#ui_paused').removeClass('hidden');
					else
						$('#ui_paused').addClass('hidden');
				});

				// hook into the lost event for updating the UI
				game.onLost.add(function() {
					// the game pauses when the player loses, hide the banner
					$('#ui_paused').addClass('hidden');

					// show the 'you lost' banner instead
					$('#ui_lost').removeClass('hidden');
				});
			} // if

			// detach old reset function form canvas
			$('#layer1').off('click', reset);

			// build new reset function, using latest config options
			reset = function() {
				var diff = $('input[name=difficulty]:checked').val();
				var dims = $('input[name=size]:checked').val().split(',');
				game.reset(parseInt(dims[0]), parseInt(dims[1]), parseFloat(diff));
			};

			// attach new reset function to canvas
			$('#layer1').on('click', reset);

			// 'reset' the game, initializing the simulation for the first time
			reset();
		});

		// show the menu if the user click the 'Exit' button.
		$('#quit').click(function() {
			game.isPaused = true;
			$('#ui_menu').toggleClass('hidden');
		});
	});
});