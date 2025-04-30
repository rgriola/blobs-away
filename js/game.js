import { Player } from './player.js';
import { Bot } from './bot.js';
import { GameRenderer } from './GameRenderer.js';
import { GameUI } from './GameUI.js';
import { GamePhysics } from './GamePhysics.js';
import { SoundManager } from './SoundManager.js'; // Add this import

class Game {
    // Class-level constants
    static CONSTANTS = {
        // Game setup
        BOUNDARY_OFFSET: 100,
        INITIAL_RADIUS: 15,
        BOT_COUNT: 19,
        
        // Timing
        FPS: 60,
        TIMESTEP: 1/60,
        MAX_FRAME_TIME: 200,
        COUNTDOWN_TIME: 3,
        
        // Gameplay
        ABSORB_COOLDOWN: 3,
        INITIAL_VELOCITY: 5,
        BASE_SCORE: 2,
        
        // Particles
        PARTICLE_POOL_SIZE: 500,
        PARTICLE_MIN_SIZE: 2,
        PARTICLE_MAX_SIZE: 4,
        PARTICLE_MIN_LIFE: 0.5,
        PARTICLE_MAX_LIFE: 1.0,
        
        // Audio
        MUSIC_VOLUME: 0.3,
        FADE_DURATION: 2000
    };

    constructor(playerName) {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.boundaryOffset = Game.CONSTANTS.BOUNDARY_OFFSET;
        
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
        this.countdownValue = Game.CONSTANTS.COUNTDOWN_TIME;
        this.gameTime = 0;
        this.lastTimestamp = 0;
        this.fixedDeltaTime = 1000 / Game.CONSTANTS.FPS;
        this.frameCount = 0;
        this.fps = 0;
        
        // Game mechanics
        this.countdownComplete = false;
        this.absorbCooldownTime = Game.CONSTANTS.ABSORB_COOLDOWN;
        
        // Fixed timestep properties
        this.accumulator = 0;
        this.timeStep = Game.CONSTANTS.TIMESTEP;
        
        // Initialize systems
        this.initObjectPools();
        
        // Create managers and subsystems
        this.soundManager = new SoundManager();
        this.soundManager.playMusic('music', Game.CONSTANTS.MUSIC_VOLUME);
        
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
        for (let i = 0; i < Game.CONSTANTS.PARTICLE_POOL_SIZE; i++) {
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
        
        // Initialize absorption properties
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
    const playerPosition = this.physics.getRandomPosition(Game.CONSTANTS.INITIAL_RADIUS);
    const playerColor = this.getColor();
    
    // Initialize player with initial movement disabled
    this.player = new Player(
        playerPosition.x,
        playerPosition.y,
        Game.CONSTANTS.INITIAL_RADIUS,
        playerColor,
        this.playerName,
        this.canvas
    );
    this.initializeBall(this.player, playerPosition, Game.CONSTANTS.INITIAL_VELOCITY);
    
    // Update player name in display
    this.ui.updatePlayerDisplay(this.playerName);
    
    // Create bots with unique colors
    for (let i = 0; i < Game.CONSTANTS.BOT_COUNT; i++) {
        const position = this.physics.getRandomPosition(Game.CONSTANTS.INITIAL_RADIUS);
        const botColor = this.getColor();
        const bot = new Bot(
            position.x,
            position.y,
            Game.CONSTANTS.INITIAL_RADIUS,
            botColor,
            this.canvas
        );
        this.initializeBall(bot, position, Game.CONSTANTS.INITIAL_VELOCITY);
    }
    
    // Update UI elements
    this.ui.updatePlayerCount();
    this.ui.updateLeaderboard();
    
    // Set initial game state
    this.gameOver = false;
    this.playerLost = false;
    this.gameStarted = false;
    this.isCountingDown = true;
    this.countdownValue = Game.CONSTANTS.COUNTDOWN_TIME;
    
    // Start physics immediately but without absorption
    this.physics.enabled = true;
    this.startCountdown();
}
    
    startCountdown() {
        // Initialize countdown state
        this.countdownValue = 3;
        this.isCountingDown = true;
        
        // Play countdown sound
        this.soundManager.play('countdown');
        
        // Start movement immediately
        requestAnimationFrame(this.animate);

        // Use UI to handle visual countdown
        this.ui.startCountdown(() => {
            // Update game state
            this.isCountingDown = false;
            this.countdownComplete = true;
            this.gameStarted = true;
            this.gameStartTime = Date.now();
            
            // Enable absorption for all balls
            this.balls.forEach(ball => {
                ball.canAbsorb = true;
                ball.absorbCooldown = 0;
            });
            
            // Play start sound
            this.soundManager.play('start');
        });
    }

        /**
     * Unified color management
     * @returns {string} A hex color code
     */
    getColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', 
            '#7B68EE', '#20BF55', '#EF476F', '#118AB2', '#06D6A0',
            '#800000', '#9932CC', '#FF8C00', '#008080', '#4B0082',
            '#FF1493', '#FFD700', '#00CED1', '#8B4513', '#2E8B57'
        ];
        
        // Try to get unique color first
        const availableColors = colors.filter(color => !this.usedColors.includes(color));
        if (availableColors.length > 0) {
            const color = availableColors[Math.floor(Math.random() * availableColors.length)];
            this.usedColors.push(color);
            return color;
        }
        
        // If no unique colors left, reset and get random
        this.usedColors = [];
        return colors[Math.floor(Math.random() * colors.length)];
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
        this.soundManager.fadeSound('music', 0, 2000);
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
            Game.CONSTANTS.MAX_FRAME_TIME
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
    this.soundManager?.fadeSound('music', 0, Game.CONSTANTS.FADE_DURATION);
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
    // Updated handlePlayerAbsorption method in game.js
    handlePlayerAbsorption(eaterPlayer, eatenPlayer) {
        // called in gamePhysics.resolveCollision
        
        // Set the eaten player as inactive
        eatenPlayer.active = false;
        
        // Award points to the eater - use your scoring system
        // Option 1: Keep flat points system from GamePhysics
        const Bot = this.Bot;
        if (eaterPlayer === this.player) {
            this.player.addScore(2);
        } else if (Bot && eaterPlayer instanceof Bot) {
            eaterPlayer.addScore(2);
            }
        
        // Option 2: Score based on radius
        // eaterPlayer.score += Math.floor(eatenPlayer.radius);
        
        // Merge the balls
        if (typeof eaterPlayer.merge === 'function') {
            eaterPlayer.merge(eatenPlayer);
        }
        
        // Force update the leaderboard
        if (this.ui) {
            this.ui.updateLeaderboard(true);
            this.ui.updatePlayerCount();
        }
        
        // Play appropriate sound
        if (eatenPlayer === this.player) {
            this.soundManager.play('playerLost');
        } else if (this.soundManager) {
            this.soundManager.play('merge');
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
} // Close the Game class definition
    
// Export the Game class OUTSIDE the class definition
export { Game };