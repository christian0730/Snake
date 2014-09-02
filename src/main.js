requirejs.config({
	shim: {
		'../lib/jquery-2.1.1': {
			exports: '$'
		},
		'../lib/keymaster': {
			exports: 'key'
		},
		'../lib/underscore': {
			exports: '_'
		}
	}
});

require(['../lib/jquery-2.1.1', 'snake-game'], function($, SnakeGame) {
	function OnResize() {
		var layer1 = $('#layer1')[0];
		var w = window.innerWidth;
		var h = window.innerHeight;
		layer1.width = Math.min(w, h * 1.387);
		layer1.height = Math.min(h, w / 1.387);
		layer1.style.marginLeft = (w - layer1.width) / 2 + "px";
		layer1.style.marginTop = (h - layer1.height) / 2 + "px";
	} // OnResize( )

	$(function() {
		window.addEventListener("resize", OnResize);
		OnResize();

		var game = null;

		$('#btn_play').click(function() {
			$('#ui_menu').toggleClass('hidden');

			var diff = $('input[name=difficulty]:checked').val();
			var dims = $('input[name=size]:checked').val().split(',');
			console.log(dims[0] + ', ' + dims[1] + ', ' + diff);

			if (game === null) {
				game = new SnakeGame($('#layer1')[0]);
				game.onScoreChanged.add(function(score, highScore) {
					$('#ui_score_value').text(score | 0);
					$('#ui_highScore_value').text(highScore | 0);
				});
				game.onPaused.add(function(isPaused) {
					$('#ui_lost').addClass('hidden');
					if (isPaused)
						$('#ui_paused').removeClass('hidden');
					else
						$('#ui_paused').addClass('hidden');
				});
				game.onLost.add(function() {
					$('#ui_paused').addClass('hidden');
					$('#ui_lost').removeClass('hidden');
				});
				$('#layer1').click(function() {
					game.reset(parseInt(dims[0]), parseInt(dims[1]), parseFloat(diff));
				});
			} // if

			game.reset(parseInt(dims[0]), parseInt(dims[1]), parseFloat(diff));
		});

		$('#quit').click(function() {
			$('#ui_menu').toggleClass('hidden');
		});
	});
});