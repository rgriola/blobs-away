import { Player } from './player.js';
import { Bot } from './bot.js';
import { GameRenderer } from './GameRenderer.js';
import { GameUI } from './GameUI.js';
import { GamePhysics } from './GamePhysics.js';
import { SoundManager } from './SoundManager.js';
import { GameConfig, getRandomBallColor } from './GameConfig.js';
import { BoardManager } from './BoardManager.js';
import { ObstacleManager } from './ObstacleManager.js';

class Game {
    constructor(playerName, boardType = GameConfig.DEFAULT_BOARD_TYPE, obstacleSet = GameConfig.DEFAULT_OBSTACLE_SET) {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.boundaryOffset = GameConfig.BOUNDARY_OFFSET;
        
        // Set up board and obstacle managers
        this.boardType = boardType;
        this.obstacleSet = obstacleSet;
        this.boardManager = new BoardManager(this.width, this.height, boardType);
        // Make sure to pass the canvas element, not just the width/height
        
        this.obstacleManager = new ObstacleManager(
            this.canvas,  // Pass the actual canvas element
            this.width,
            this.height,
            obstacleSet,
            this.boardManager
            );
        
        this.boardManager.setObstacleManager(this.obstacleManager);
        
        // Game state
        this.balls = [];
        this.player = null;
        this.gameOver = false;
        this.playerLost = false;
        this.allPlayers = [];
        this.playerName = playerName || "Player";
        this.usedColors = [];
        this.Bot = Bot;
        
        // Game timing properties
        this.gameStarted = false;
        this.countdownValue = GameConfig.COUNTDOWN_TIME;
        this.gameTime = 0;
        this.lastTimestamp = 0;
        this.fixedDeltaTime = 1000 / GameConfig.FPS;
        this.frameCount = 0;
        this.fps = 0;
        
        // Game mechanics
        this.countdownComplete = false;
        this.absorbCooldownTime = GameConfig.ABSORB_COOLDOWN;
        
        // Fixed timestep properties
        this.accumulator = 0;
        this.timeStep = GameConfig.TIMESTEP;
        
        // Initialize systems
        this.initObjectPools();
        
        // Create managers and subsystems
        this.soundManager = new SoundManager();
        this.soundManager.playMusic('music', GameConfig.MUSIC_VOLUME);
        
        this.renderer = new GameRenderer(this);
        this.ui = new GameUI(this);
        this.physics = new GamePhysics(this);
        
        // Initialize game
        this.initGame();
        
        // Bind animation method
        this.animate = this.animate.bind(this);
    }
    ///// Particle Pools. 
    initObjectPools() {
        // Initialize particle pool
        this.particlePool = [];
        for (let i = 0; i < GameConfig.PARTICLE_POOL_SIZE; i++) {
            this.particlePool.push({
                active: false,
                x: 0,
                y: 0,
                dirX: 0,
                dirY: 0,
                size: 0,
                color: '',
                life: 0,
                maxLife: 0,
                speedX: 0,
                speedY: 0,
                reset: function() {
                    this.active = false;
                    this.size = 0;
                    this.life = 0;
                    this.maxLife = 0;
                    this.speedX = 0;
                    this.speedY = 0;
                }
            });
        }
    }
    
    /**
     * Initialize a new ball with common properties
     * @param {Ball} ball - Ball instance to initialize
     * @param {Object} position - Starting position {x, y}
     * @param {number} initialSpeed - Initial velocity multiplier
     */
    initializeBall(ball, position, initialSpeed = 5) {
        // Set initial position
        ball.x = position.x;
        ball.y = position.y;
        
        // Store previous position for interpolation
        ball.prevX = position.x;
        ball.prevY = position.y;
        
        // Set initial random velocity
        ball.velocityX = (Math.random() - 0.5) * initialSpeed;
        ball.velocityY = (Math.random() - 0.5) * initialSpeed;
        
        // Initialize absorption properties - explicitly set to false at start
        ball.canAbsorb = false;
        ball.absorbCooldown = 0;
        
        // Add to collections
        this.balls.push(ball);
        this.allPlayers.push(ball);
    }

    /**
     * Initialize game state and create initial players
     */
    initGame() {
        // Create player with a unique color
        const playerPosition = this.physics.getRandomPosition(GameConfig.INITIAL_RADIUS);
        const playerColor = this.getColor();
        
        // Initialize player with initial movement disabled
        this.player = new Player(
            playerPosition.x,
            playerPosition.y,
            GameConfig.INITIAL_RADIUS,
            playerColor,
            this.playerName,
            this.canvas
        );
        this.initializeBall(this.player, playerPosition, GameConfig.INITIAL_VELOCITY);
        
        // Update player name in display
        this.ui.updatePlayerDisplay(this.playerName);
        
        // Create bots with unique colors
        for (let i = 0; i < GameConfig.BOT_COUNT; i++) {
            const position = this.physics.getRandomPosition(GameConfig.INITIAL_RADIUS);
            const botColor = this.getColor();
            const bot = new Bot(
                position.x,
                position.y,
                GameConfig.INITIAL_RADIUS,
                botColor,
                this.canvas
            );
            this.initializeBall(bot, position, GameConfig.INITIAL_VELOCITY);
        }
        
        // Update UI elements
        this.ui.updatePlayerCount();
        this.ui.updateLeaderboard();
        
        // Set initial game state
        this.gameOver = false;
        this.playerLost = false;
        this.gameStarted = false;
        this.isCountingDown = true;
        this.countdownValue = GameConfig.COUNTDOWN_TIME;
        
        // Start physics immediately but without absorption
        this.physics.enabled = true;
        this.startCountdown();
    }
    
    startCountdown() {
        // Initialize countdown state
        this.countdownValue = GameConfig.COUNTDOWN_TIME;
        this.isCountingDown = true;
        this.countdownComplete = false; // Explicitly set to false at start
        
        console.log("Starting countdown with value:", this.countdownValue);
        console.log("Countdown status - isCountingDown:", this.isCountingDown, "countdownComplete:", this.countdownComplete);
        
        // Play countdown sound
        this.soundManager.play('countdown');
        
        // Start movement immediately
        requestAnimationFrame(this.animate);

        // Use UI to handle visual countdown
        this.ui.startCountdown(() => {
            // Update game state
            this.isCountingDown = false;
            this.countdownComplete = true; // Set to true when complete
            this.gameStarted = true;
            this.gameStartTime = Date.now();
            
            console.log("Countdown complete! Setting game state:");
            console.log("isCountingDown:", this.isCountingDown);
            console.log("countdownComplete:", this.countdownComplete);
            console.log("gameStarted:", this.gameStarted);
            
            // Enable absorption for all balls - make sure this works by logging each ball's state
            this.balls.forEach((ball, index) => {
                ball.canAbsorb = true;
                ball.absorbCooldown = 0;
                console.log(`Ball ${index} (${ball.name || 'unnamed'}): canAbsorb=${ball.canAbsorb}, cooldown=${ball.absorbCooldown}`);
            });
            
            console.log("Countdown complete! Absorption enabled for all balls.");
            
            try {
                // Play start sound (with error handling)
                this.soundManager.play('start');
            } catch (e) {
                console.warn("Could not play start sound:", e);
            }
        });
    }

    /**
     * Unified color management
     * @returns {string} A hex color code
     */
    getColor() {
        // Using the helper function from GameConfig
        const color = getRandomBallColor(this.usedColors);
        this.usedColors.push(color);
        return color;
    }

    /**
     * Handles core game update logic
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateGame(deltaTime) {
        try {
            // Physics updates happen regardless of game state
            this.physics.update(deltaTime);
            
            // Update cooldowns only during active gameplay
            if (this.gameStarted && !this.isCountingDown) {
                this.updateCooldowns(deltaTime);
            }

            // Always update particles
            this.physics.updateParticles(deltaTime);
        } catch (error) {
            console.error("Error in game update:", error);
        }
    }

    /**
     * Updates absorption cooldowns for all balls
     * @param {number} deltaTime - Time since last update
     */
    updateCooldowns(deltaTime) {
        this.balls.forEach(ball => {
            if (ball.updateCooldown) {
                ball.updateCooldown(deltaTime);
            }
        });
    }

    /**
     * Checks and handles game over conditions
     */
    checkGameOver() {
        if (this.gameOver) return;

        const activeBalls = this.balls.filter(ball => ball.active).length;
        if (activeBalls <= 1) {
            this.gameOver = true;
            const winner = activeBalls === 1 ? this.balls.find(ball => ball.active) : null;
            this.ui.showGameOverMessage(winner);
            this.soundManager.play('gameOver');
            this.soundManager.fadeSound('music', 0, GameConfig.FADE_DURATION);
        }
    }

    /**
     * Main animation loop
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    animate = (timestamp) => {
        try {
            // Initialize timestamp on first frame
            if (!this.lastTimestamp) {
                this.lastTimestamp = timestamp;
            }
            
            // Calculate and cap delta time
            const frameTime = Math.min(
                timestamp - this.lastTimestamp, 
                GameConfig.MAX_FRAME_TIME
            );
            const deltaTime = frameTime / 1000;
            this.lastTimestamp = timestamp;
            
            // Update FPS counter
            this.ui.updateFpsCounter(timestamp);
            
            // Fixed timestep accumulation
            this.accumulator += deltaTime;
            
            // Update physics at fixed timestep
            while (this.accumulator >= this.timeStep) {
                this.updateGame(this.timeStep);
                this.accumulator -= this.timeStep;
            }
            
            // Calculate interpolation for smooth rendering
            const interpolation = this.accumulator / this.timeStep;
            
            // Render frame
            this.renderFrame(interpolation);
            
            // Continue animation if game is not over
            if (!this.gameOver) {
                this.animationFrameId = requestAnimationFrame(this.animate);
            }
        } catch (error) {
            console.error('Animation loop error:', error);
            this.handleAnimationError();
        }
    }

    /**
     * Handles rendering for current frame
     * @param {number} interpolation - Interpolation factor for smooth rendering
     */
    renderFrame(interpolation) {
        this.renderer.clear();
        this.renderer.drawBoundary();
        
        if (this.gameStarted) {
            this.ui.updateGameTime();
            this.renderer.render(interpolation);
            this.checkGameOver();
        } else {
            this.renderer.renderStatic();
        }
        
        this.renderer.renderParticles();
    }

    /**
     * Handles animation loop errors
     */
    handleAnimationError() {
        this.gameOver = true;
        this.soundManager?.fadeSound('music', 0, GameConfig.FADE_DURATION);
        this.ui?.showError('Game error occurred. Please restart.');
    }

    start() { // this is where the game is actually started. 
        console.log("Game starting...");
    
        // Make sure the canvas exists
        if (!this.canvas) {
            console.error("Canvas element not found!");
            return;
        }
        
        console.log("Canvas dimensions:", this.width, "x", this.height);
        console.log("Initial players:", this.balls.length);
        
        // Reset animation state
        this.lastTimestamp = 0;
        this.accumulator = 0;
        
        // Start the countdown (which will trigger the game loop)
        this.startCountdown();
    
        // Start the game loop
        requestAnimationFrame(this.animate);
    } 

    /**
     * Reset all game state properties
     * @param {boolean} [fullReset=true] - If true, also resets event listeners
     */
    resetGameState(fullReset = true) {
        // Stop animation
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Reset game flags
        this.gameOver = false;
        this.playerLost = false;
        this.gameStarted = false;
        this.balls = [];
        this.usedColors = [];
        
        // Reset timing
        this.lastTimestamp = 0;
        this.accumulator = 0;
        this.gameTime = 0;
        
        // Reset scores
        if (this.player) {
            this.player.score = 0;
        }
        
        // Handle sound
        if (this.soundManager) {
            this.soundManager.fadeSound('music', 0, 1000);
        }
        
        // Clean up events if needed
        if (fullReset) {
            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('keyup', this.handleKeyUp);
        }
    }

    /**
     * Handles absorption between two players/balls
     * @param {Player|Bot} eaterPlayer - The ball doing the absorbing
     * @param {Player|Bot} eatenPlayer - The ball being absorbed
     */
    handlePlayerAbsorption(eaterPlayer, eatenPlayer) {
        // Skip if either ball is not active
        if (!eaterPlayer.active || !eatenPlayer.active) {
            console.log("Skipping absorption - one of the balls is not active");
            return;
        }
        
        // Log detailed absorption information
        console.log(`ABSORPTION: ${eaterPlayer.name || 'Player'} (size: ${eaterPlayer.radius.toFixed(2)}) absorbing ${eatenPlayer.name || 'Bot'} (size: ${eatenPlayer.radius.toFixed(2)})`);
        
        // Set the eaten player as inactive immediately to prevent double absorptions
        eatenPlayer.active = false;
        
        // Award points to the eater
        const Bot = this.Bot;
        if (eaterPlayer === this.player) {
            this.player.addScore(2);
            console.log(`Player score increased to ${this.player.score}`);
        } else if (Bot && eaterPlayer instanceof Bot) {
            eaterPlayer.addScore(2);
        }
        
        // Merge the balls
        if (typeof eaterPlayer.merge === 'function') {
            eaterPlayer.merge(eatenPlayer);
            console.log(`Merge complete: ${eaterPlayer.name || 'Player'} new size: ${eaterPlayer.radius.toFixed(2)}`);
        } else {
            console.warn("Merge function not found on eater player");
        }
        
        // Force update the leaderboard
        if (this.ui) {
            this.ui.updateLeaderboard(true);
            this.ui.updatePlayerCount();
        }
        
        // Play appropriate sound
        if (eatenPlayer === this.player) {
            console.log("PLAYER WAS EATEN!");
            try {
                this.soundManager.play('playerLost');
            } catch (e) {
                console.warn("Could not play playerLost sound:", e);
            }
            // Show player lost message when player is absorbed
            this.playerLost = true;
            if (this.ui) {
                console.log("Calling showPlayerLostMessage");
                this.ui.showPlayerLostMessage();
                console.log("Called showPlayerLostMessage");
            } else {
                console.error("UI reference is missing!");
            }
        } else if (this.soundManager) {
            try {
                this.soundManager.play('merge');
            } catch (e) {
                console.warn("Could not play merge sound:", e);
            }
        }
    }

    restart() {
        this.resetGameState(false);  // Don't reset event listeners on restart
        this.initGame();
        this.start();
    }

    cleanup() {
        this.resetGameState(true);  // Full reset including event listeners
    }

    // Add method to change board type
    changeBoard(boardType) {
        if (GameConfig.BOARD_TYPES[boardType.toUpperCase()]) {
            this.boardType = GameConfig.BOARD_TYPES[boardType.toUpperCase()];
            // Recreate board manager
            this.boardManager = new BoardManager(this.width, this.height, this.boardType);
            
            // Update references
            this.renderer.boardManager = this.boardManager;
            this.physics.boardManager = this.boardManager;
            
            // Reset game with new board
            this.restart();
            return true;
        }
        return false;
    }
} // Close the Game class definition
    
// Export the Game class OUTSIDE the class definition
export { Game };