# Snake!

A Snake clone using HTML5 and Impulse.js

## Requirements

Musts:  
**[✓]** Use JavaScript  
**[✓]** Run on latest versions of Chrome, Safari, and FireFox  
**[✓]** Use Canvas 2D  
**[✓]** Use requestAnimationFrame  
**[✓]** Support different screen pixel ratios (densities)  
**[✓]** Use arrow keys to change direction of the Snake  
**[✓]** Increase the length of the Snake by one block for each block it "eats"  
**[✓]** Increase the speed of the Snake by a small percentage for each block it "eats"  
**[✓]** When the snake "eats" a block, randomly place a new block on the board that is a certain distance from the snake's current position and the walls.  
**[✓]** End the game if the Snake "bites its own tail" or runs into a wall  

Shoulds:  
**[✓]** Use underscore  
**[✓]** Keep score  
**[✓]** Pause the game with SPACE key  
**[✓]** Reset the game by clicking on the Canvas  
**[✓]** Design the game using JavaScript objects and inheritance (use _.extend)  

Coulds:  
**[✓]** Use jquery for DOM manipulation and event binding (though not really needed for this exercise)  
**[✓]** Use requirejs for dependency injection  
**[✓]** Deploy the game to Heroku using Node.js  
**[✓]** Save highscores in browser localstorage  
**[✓]** Provide different difficulty levels  
**[✓]** Provide different board sizes  
**[✓]** Support the fullscreen API  
**[✓]** Write unit tests using Mocha  
**[✓]** Surprise us with something cool  

Something Cool:  
**[✓]** Require.js optimized  
**[✓]** Frame-based animations using Impulse.js  

## Project Folders  
**assets:** raw and exported graphics assets  
**css:** css files  
**dist:** require.js optimized source files  
**lib:** 3rd party library source  
**src:** javascript source files for Snake!  
**tests:** mocha test files  

## 3rd Party Libraries  
**[Impulse](https://github.com/dubrowgn/Impulse.js):** Used for graphics rendering (written by me)  
**[jQuery](http://jquery.com/):** Used for registering events and getting element references  
**[Keymaster](https://github.com/madrobby/keymaster):** Used for easily binding keys  
**[Underscore](http://underscorejs.org/):** Used for function binding and extending prototypes

## Project Hierarchy  

* SnakeGame
    * Field
    * Berry
    * Snake
    * SnakeEntity < BlockEntity < Impulse.Entity
        * Impulse.Model
            * Impulse.Animation
    * BerryEntity < BlockEntity < Impulse.Entity
        * Impulse.Model
            * Impulse.Animation

## Things I Learned
* Using Require.js for dynamic module loading in the browser
* Using Require.js server-side and having it play nice with node's require
* Using Require.js optimizer and debugging opimization issues
* Writing and running Mocha unit tests
* Setting up and pushing to Heroku
* Using the HTML fullscreen API
* How to be better at Snake

## Things That Could Be Done
* Build process using grunt
* Use Less or Sass
* Minify CSS
* Write more unit tests
