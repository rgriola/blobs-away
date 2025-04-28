import { Player } from './player.js';
import { Bot } from './bot.js';
import { GameRenderer } from './GameRenderer.js';
import { GameUI } from './GameUI.js';
import { GamePhysics } from './GamePhysics.js';
import { SoundManager } from './SoundManager.js'; // Add this import

class Game {
    constructor(playerName) {
        // Existing properties
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.boundaryOffset = 100;
        this.balls = [];
        this.player = null;
        this.gameOver = false;
        this.playerLost = false;
        this.allPlayers = [];
        this.playerName = playerName || "Player";
        this.usedColors = [];
        
        // Make Bot class available to GamePhysics
        this.Bot = Bot;
        
        // Game timing properties
        this.gameStarted = false;
        this.countdownValue = 3;
        this.gameTime = 0; // Time in seconds
        
        // Performance optimization properties
        this.lastTimestamp = 0;
        this.fixedDeltaTime = 1000 / 60; // Target 60 FPS for physics
        this.frameCount = 0;
        this.fps = 0;
        
        // Fixed timestep properties
        this.accumulator = 0;
        this.timeStep = 1 / 60; // Fixed physics timestep in seconds
        
        // Object pools
        this.initObjectPools();
        
        // Create the sound manager
        this.soundManager = new SoundManager();
        
        // Create instances of the renderer and UI
        this.renderer = new GameRenderer(this);
        this.ui = new GameUI(this);
        this.physics = new GamePhysics(this); // Create physics instance
        
        // Initialize the game
        this.initGame();
        
        // Bind methods to preserve context
        this.animate = this.animate.bind(this);
    }
    
    initObjectPools() {
        // Particle pool
        this.particlePool = [];
        for (let i = 0; i < 500; i++) {
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
                }
            });
        }
    }
    
    initGame() {
        // Create player with a unique color
        const playerPosition = this.physics.getRandomPosition(15);
        const playerColor = this.getUniqueColor();
        this.player = new Player(playerPosition.x, playerPosition.y, 15, playerColor, this.playerName, this.canvas);
        this.balls.push(this.player);
        this.allPlayers.push(this.player);
        
        // Update player name in display using UI
        this.ui.updatePlayerDisplay(this.playerName);
        
        // Create bots with unique colors
        for (let i = 0; i < 9; i++) {
            const position = this.physics.getRandomPosition(15);
            const botColor = this.getUniqueColor();
            const bot = new Bot(position.x, position.y, 15, botColor, this.canvas);
            
            // Store previous position for interpolation
            bot.prevX = bot.x;
            bot.prevY = bot.y;
            
            this.balls.push(bot);
            this.allPlayers.push(bot);
        }
        
        // Update UI elements
        this.ui.updatePlayerCount();
        this.ui.updateLeaderboard();
    }
    
    // Get a color that hasn't been used yet
    getUniqueColor() {
        // All available colors with their corresponding names
        const allColors = [
            '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', 
            '#7B68EE', '#20BF55', '#EF476F', '#118AB2', '#06D6A0',
            '#800000', '#9932CC', '#FF8C00', '#008080', '#4B0082',
            '#FF1493', '#FFD700', '#00CED1', '#8B4513', '#2E8B57'
        ];
        
        // Find colors that haven't been used yet
        const availableColors = allColors.filter(color => !this.usedColors.includes(color));
        
        if (availableColors.length === 0) {
            // If all colors have been used, reset the used colors
            this.usedColors = [];
            return this.getRandomColor();
        }
        
        // Pick a random available color
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        const selectedColor = availableColors[randomIndex];
        
        // Mark this color as used
        this.usedColors.push(selectedColor);
        
        return selectedColor;
    }
    
    // Fallback color method
    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', 
            '#7B68EE', '#20BF55', '#EF476F', '#118AB2', '#06D6A0',
            '#800000', '#9932CC', '#FF8C00', '#008080', '#4B0082',
            '#FF1493', '#FFD700', '#00CED1', '#8B4513', '#2E8B57'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Use UI to handle countdown
    startCountdown() {
        this.soundManager.play('countdown'); // Play countdown sound
        
        this.ui.startCountdown(() => {
            this.gameStarted = true;
            this.gameStartTime = Date.now(); // Record start time for timer
            this.soundManager.play('start'); // Play start sound when countdown ends
        });
    }
    
    // Improved game loop with fixed timestep
    animate(timestamp) {
        // Calculate the actual delta time since last frame
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const frameTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        // Cap the delta time to avoid spiral of death on slow devices
        const cappedFrameTime = Math.min(frameTime, 200); // Cap at 200ms (5fps minimum)
        
        // Convert to seconds for physics calculations
        const deltaTime = cappedFrameTime / 1000;
        
        // Update FPS counter using UI
        this.ui.updateFpsCounter(timestamp);
        
        // Clear canvas and draw boundary using renderer
        this.renderer.clear();
        this.renderer.drawBoundary();
        
        // Only update game logic if countdown is finished
        if (this.gameStarted) {
            // Update game time using UI
            this.ui.updateGameTime();
            
            // Accumulate time for fixed physics updates
            this.accumulator += deltaTime;
            
            // Run physics updates at fixed timestep intervals
            while (this.accumulator >= this.timeStep) {
                try {
                    // Use GamePhysics for physics updates
                    this.physics.update(this.timeStep);
                } catch (error) {
                    console.error("Error in physics update:", error);
                }
                this.accumulator -= this.timeStep;
            }
            
            // Calculate interpolation factor for smooth rendering
            const interpolation = this.accumulator / this.timeStep;
            
            // Render with interpolation
            this.renderer.render(interpolation);
            
            // Check if player just lost (but don't end the game)
            if (!this.playerLost && this.player && !this.player.active) {
                this.playerLost = true;
                this.ui.showPlayerLostMessage();
                this.ui.updatePlayerDisplay(this.playerName + " (Spectating)");
                this.soundManager.play('playerLost'); // Play player lost sound
            }
            
            // Check for game over
            const activeBalls = this.balls.filter(ball => ball.active).length;
            if (!this.gameOver && activeBalls <= 1) {
                this.gameOver = true;
                this.soundManager.play('gameOver'); // Play game over sound
                
                if (activeBalls === 1) {
                    this.ui.showGameOverMessage(this.balls.find(ball => ball.active));
                } else {
                    this.ui.showGameOverMessage(null);
                }
            }
        } else {
            // Just render static objects during countdown
            this.renderer.renderStatic();
        }
        
        // Update particles using physics
        this.physics.updateParticles(deltaTime);
        this.renderer.renderParticles();
        
        // Continue animation unless the game is completely over
        if (!this.gameOver) {
            requestAnimationFrame(this.animate);
        } else {
            console.log("Game over - animation stopped");
        }
    }
    
    // Object pooling for particles - keep this in Game since it's creation
    // rather than physics simulation
    createParticle(x, y, color, size = 3, maxLife = 1.0) {
        // Find an available particle from the pool
        const particle = this.particlePool.find(p => !p.active);
        if (!particle) return; // Pool exhausted
        
        // Set up the particle
        particle.active = true;
        particle.x = x;
        particle.y = y;
        particle.dirX = (Math.random() - 0.5) * 2;
        particle.dirY = (Math.random() - 0.5) * 2;
        particle.size = size;
        particle.color = color;
        particle.life = maxLife;
        particle.maxLife = maxLife;
        particle.speedX = Math.random() * 3 + 2;
        particle.speedY = Math.random() * 3 + 2;
        
        return particle;
    }
    
    // Add merge animation effect - kept in Game since it's object creation
    addMergeAnimation(x, y, color, size) {
        // Create particles for merging effect
        for (let i = 0; i < 20; i++) {
            const particleSize = Math.random() * (size / 10) + 2;
            const lifespan = Math.random() * 1 + 0.5;
            this.createParticle(x, y, color, particleSize, lifespan);
        }
        
        // Play merge sound
        //this.soundManager.play('merge.mp3');
                // Play merge sound with debug info
            if (this.soundManager) {
                console.log("Calling sound manager for merge sound");
                this.soundManager.playWithDebug('merge');
               // ./sounds/merge.mp3
            } else {
                console.error("No soundManager available");
            }
    }
    
    start() {
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

// Add these methods to your Game class
// Call this whenever a player scores points
updatePlayerScore(player, points) {
    // Update the player's score
    player.score += points;
    
    // Force leaderboard update
    if (this.ui) {
        this.ui.updateLeaderboard(true);
    }
}

// Call this when a player absorbs another player
handlePlayerAbsorption(eaterPlayer, eatenPlayer) {
    // Set the eaten player as inactive
    console.log("Eaten player:", eatenPlayer);
    console.log("Eaten player active:", eatenPlayer.active);

    eatenPlayer.active = false;
    
    // Award points to the eater
    eaterPlayer.score += Math.floor(eatenPlayer.radius);
    
    // Force update the leaderboard
    if (this.ui) {
        this.ui.updateLeaderboard(true);
    }
    
    // Play appropriate sound
    if (eatenPlayer === this.player) {
        this.soundManager.play('playerLost');
    } else if (this.soundManager) {
        this.soundManager.play('merge');
    }
}


} // Close the Game class definition
    
// Export the Game class OUTSIDE the class definition
export { Game };