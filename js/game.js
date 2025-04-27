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
        this.playerCountEl = document.getElementById('players-left');
        this.playerName = playerName || "Player";
        this.leaderboardEl = document.getElementById('leaderboard-list');
        this.usedColors = [];
        
        // Game timing properties
        this.gameStarted = false;
        this.countdownValue = 3;
        this.gameTime = 0; // Time in seconds
        this.gameTimeEl = document.getElementById('game-time');

        // Performance optimization properties
        this.lastTimestamp = 0;
        this.fixedDeltaTime = 1000 / 60; // Target 60 FPS for physics
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
        
        // Fixed timestep properties
        this.accumulator = 0;
        this.timeStep = 1 / 60; // Fixed physics timestep in seconds
        
        // Object pools
        this.initObjectPools();
        
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
        const playerPosition = this.getRandomPosition(15);
        const playerColor = this.getUniqueColor();
        this.player = new Player(playerPosition.x, playerPosition.y, 15, playerColor, this.playerName, this.canvas);
        this.balls.push(this.player);
        this.allPlayers.push(this.player);
        
        // Update player name in display
        document.getElementById('player-name-display').textContent = this.playerName;
        
        // Create bots with unique colors
        for (let i = 0; i < 9; i++) {
            const position = this.getRandomPosition(15);
            const botColor = this.getUniqueColor();
            const bot = new Bot(position.x, position.y, 15, botColor, this.canvas);
            
            // Store previous position for interpolation
            bot.prevX = bot.x;
            bot.prevY = bot.y;
            
            this.balls.push(bot);
            this.allPlayers.push(bot);
        }
        
        this.updatePlayerCount();
        this.updateLeaderboard();
        
        // After initialization, start countdown timer
        this.startCountdown();
    }
    
    getRandomPosition(radius) {
        const bottomOffset = this.boundaryOffset + 50; // Extra 50px for bottom boundary
        
        return {
            x: this.boundaryOffset + radius + Math.random() * (this.width - this.boundaryOffset * 2 - radius * 2),
            y: this.boundaryOffset + radius + Math.random() * (this.height - this.boundaryOffset - bottomOffset - radius * 2)
        };
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
    
    startCountdown() {
        // Create countdown overlay
        const countdownOverlay = document.createElement('div');
        countdownOverlay.className = 'countdown-overlay';
        document.querySelector('.game-container').appendChild(countdownOverlay);
        
        // Start countdown
        const countdownInterval = setInterval(() => {
            if (this.countdownValue > 0) {
                countdownOverlay.textContent = this.countdownValue;
                this.countdownValue--;
            } else {
                countdownOverlay.textContent = 'GO!';
                
                // Remove countdown after a short delay
                setTimeout(() => {
                    countdownOverlay.remove();
                    this.gameStarted = true;
                    this.gameStartTime = Date.now(); // Record start time for timer
                }, 500);
                
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
    
    updateGameTime() {
        if (this.gameStarted && !this.gameOver) {
            // Calculate time elapsed since start with higher precision
            const elapsedTime = Date.now() - this.gameStartTime;
            const elapsedSeconds = Math.floor(elapsedTime / 1000);
            const tenths = Math.floor((elapsedTime % 1000) / 100); // Get tenths of a second
            
            this.gameTime = elapsedSeconds;
            
            // Format time as MM:SS.T (minutes, seconds, tenths)
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
            
            // Update UI
            this.gameTimeEl.textContent = formattedTime;
        }
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
        
        // Update FPS counter
        this.updateFpsCounter(timestamp);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw boundary
        this.drawBoundary();
        
        // Only update game logic if countdown is finished
        if (this.gameStarted) {
            // Update game time
            this.updateGameTime();
            
            // Accumulate time for fixed physics updates
            this.accumulator += deltaTime;
            
            // Run physics updates at fixed timestep intervals
            while (this.accumulator >= this.timeStep) {
                try {
                    this.updatePhysics(this.timeStep);
                } catch (error) {
                    console.error("Error in physics update:", error);
                }
                this.accumulator -= this.timeStep;
            }
            
            // Calculate interpolation factor for smooth rendering
            const interpolation = this.accumulator / this.timeStep;
            
            // Render with interpolation
            this.render(interpolation);
            
            // Check if player just lost (but don't end the game)
            if (!this.playerLost && this.player && !this.player.active) {
                this.playerLost = true;
                this.showPlayerLostMessage();
                document.getElementById('player-name-display').textContent = this.playerName + " (Spectating)";
            }
            
            // Check for game over
            const activeBalls = this.balls.filter(ball => ball.active).length;
            if (!this.gameOver && activeBalls <= 1) {
                this.gameOver = true;
                if (activeBalls === 1) {
                    this.showGameOverMessage(this.balls.find(ball => ball.active));
                } else {
                    this.showGameOverMessage(null);
                }
            }
        } else {
            // When countdown is running, just render balls without physics
            this.renderBallsStatic();
        }
        
        // Update particles
        this.updateParticles(deltaTime);
        this.renderParticles();
        
        // Continue animation unless the game is completely over
        if (!this.gameOver) {
            requestAnimationFrame(this.animate);
        } else {
            console.log("Game over - animation stopped");
        }
    }
    
    updateFpsCounter(timestamp) {
        this.frameCount++;
        if (timestamp - this.lastFpsUpdate >= 1000) {
            const fps = Math.round(this.frameCount * 1000 / (timestamp - this.lastFpsUpdate));
            this.fps = fps;
            
            // Get the FPS display element
            const fpsDisplay = document.getElementById('fps-display');
            
            if (fpsDisplay) {
                fpsDisplay.textContent = fps;
            }
            
            // Reset counters
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
        }
    }
    
    // Fixed timestep physics update
    updatePhysics(timeStep) {
        // Store previous positions for all balls
        for (let ball of this.balls) {
            if (ball && ball.active) {
                ball.prevX = ball.x;
                ball.prevY = ball.y;
            }
        }
        
        // Update all active balls
        for (let ball of this.balls) {
            if (ball && ball.active && typeof ball.update === 'function') {
                ball.update(1.0); // Using fixed timestep
            }
        }
        
        // Check for collisions
        this.checkCollisions();
    }
    
    // Render with interpolation for smooth visuals
    render(interpolation) {
        for (let ball of this.balls) {
            if (ball && ball.active) {
                // Calculate interpolated position
                const renderX = ball.prevX + (ball.x - ball.prevX) * interpolation;
                const renderY = ball.prevY + (ball.y - ball.prevY) * interpolation;
                
                // Draw at interpolated position
                ball.drawAt(this.ctx, renderX, renderY);
            }
        }
    }
    
    // Simple rendering for countdown phase
    renderBallsStatic() {
        for (let ball of this.balls) {
            if (ball && ball.active) {
                ball.draw(this.ctx);
            }
        }
    }
    
    // Object pooling for particles
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
    
    updateParticles(deltaTime) {
        for (let particle of this.particlePool) {
            if (!particle.active) continue;
            
            // Update life
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                particle.reset();
                continue;
            }
            
            // Update position
            particle.x += particle.dirX * particle.speedX;
            particle.y += particle.dirY * particle.speedY;
            
            // Slow down
            particle.speedX *= 0.99;
            particle.speedY *= 0.99;
        }
    }
    
    renderParticles() {
        for (let particle of this.particlePool) {
            if (!particle.active) continue;
            
            // Calculate opacity based on remaining life
            const opacity = particle.life / particle.maxLife;
            
            this.ctx.globalAlpha = opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Reset global alpha
        this.ctx.globalAlpha = 1;
    }
    
    addMergeAnimation(x, y, color, size) {
        // Create particle effects for merging using object pool
        for (let i = 0; i < 20; i++) {
            const particleSize = Math.random() * (size / 10) + 2;
            const lifespan = Math.random() * 1 + 0.5;
            this.createParticle(x, y, color, particleSize, lifespan);
        }
        
        // Play sound effect
        if (typeof soundManager !== 'undefined' && soundManager.play) {
            soundManager.play('merge');
        }
    }
    
    checkCollisions() {
        for (let i = 0; i < this.balls.length; i++) {
            const ball1 = this.balls[i];
            if (!ball1 || !ball1.active) continue;
            
            for (let j = i + 1; j < this.balls.length; j++) {
                const ball2 = this.balls[j];
                if (!ball2 || !ball2.active) continue;
                
                if (ball1.collidesWith(ball2)) {
                    // Handle collision
                    this.resolveCollision(ball1, ball2);
                    // Update leaderboard after collision
                    this.updateLeaderboard();
                }
            }
        }
    }
    
    resolveCollision(ball1, ball2) {
        // Determine which ball is larger
        let winner, loser;
        
        if (ball1.radius > ball2.radius) {
            winner = ball1;
            loser = ball2;
        } else if (ball2.radius > ball1.radius) {
            winner = ball2;
            loser = ball1;
        } else {
            // Same size - random winner
            if (Math.random() < 0.5) {
                winner = ball1;
                loser = ball2;
            } else {
                winner = ball2;
                loser = ball1;
            }
        }
        
        // Add merge animation at loser position
        this.addMergeAnimation(loser.x, loser.y, loser.color, loser.radius);
        
        // Merge the balls
        winner.merge(loser);
        loser.active = false;
        
        // Add score if player or bot wins
        if (winner === this.player) {
            this.player.addScore(2);
        } else if (winner instanceof Bot) {
            winner.addScore(2);
        }
        
        this.updatePlayerCount();
        this.updateLeaderboard();
    }
    
    updatePlayerCount() {
        const activePlayers = this.balls.filter(ball => ball.active).length;
        this.playerCountEl.textContent = activePlayers;
    }
    
    updateLeaderboard() {
        // Only update UI every few frames to reduce DOM manipulation
        if (this.frameCount % 5 !== 0) return;
        
        // Create an array of all players (active and inactive) with scores
        const allPlayers = [...this.allPlayers];
        
        // Sort by score (descending)
        allPlayers.sort((a, b) => b.score - a.score);
        
        // Clear current leaderboard
        this.leaderboardEl.innerHTML = '';
        
        // Add top players to leaderboard (up to 10)
        const topPlayers = allPlayers.slice(0, 10);
        
        // Create document fragment for batch DOM manipulation
        const fragment = document.createDocumentFragment();
        
        topPlayers.forEach((player, index) => {
            const rank = index + 1;
            const playerName = player === this.player ? this.playerName : player.name;
            const score = player.score || 0;
            
            const listItem = document.createElement('li');
            
            // Add classes for styling
            listItem.classList.add(player.active ? 'active-player' : 'inactive-player');
            if (player === this.player) {
                listItem.classList.add('current-player');
            }
            
            // Create span elements with appropriate classes
            const rankSpan = document.createElement('span');
            rankSpan.classList.add('player-rank');
            rankSpan.textContent = `${rank}.`;
            
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('player-name');
            nameSpan.textContent = playerName;
            
            const scoreSpan = document.createElement('span');
            scoreSpan.classList.add('player-score');
            scoreSpan.textContent = score;
            
            listItem.appendChild(rankSpan);
            listItem.appendChild(nameSpan);
            listItem.appendChild(scoreSpan);
            
            fragment.appendChild(listItem);
        });
        
        // Batch append to minimize reflows
        this.leaderboardEl.appendChild(fragment);
    }
    
    showPlayerLostMessage() {
        // Create a non-blocking notification
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.textContent = 'You were absorbed! Spectating...';
        document.querySelector('.game-container').appendChild(notification);
        
        // Remove the notification after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    showGameOverMessage(winner) {
        // Get dialog elements
        const gameOverDialog = document.getElementById('game-over-dialog');
        const gameOverTitle = document.getElementById('game-over-title');
        const gameOverMessage = document.getElementById('game-over-message');
        const finalRankingsList = document.getElementById('final-rankings-list');
        const playAgainBtn = document.getElementById('play-again-btn');
        
        // Set the title and message
        if (winner) {
            if (winner === this.player) {
                gameOverTitle.textContent = 'Victory!';
                gameOverMessage.textContent = `Congratulations, ${this.playerName}! You dominated the arena with a score of ${this.player.score}.`;
            } else {
                gameOverTitle.textContent = 'Game Over';
                gameOverMessage.textContent = `${winner.name} won the game with a score of ${winner.score}.`;
            }
        } else {
            gameOverTitle.textContent = 'Game Over';
            gameOverMessage.textContent = 'The game has ended with no survivors.';
        }
        
        // Add elapsed time to game over message
        gameOverMessage.textContent += ` Game duration: ${document.getElementById('game-time').textContent}`;
        
        // Populate final rankings
        finalRankingsList.innerHTML = '';
        
        // Sort all players by score
        const sortedPlayers = [...this.allPlayers].sort((a, b) => b.score - a.score);
        
        // Create document fragment for batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // Add each player to the rankings list
        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            const isPlayer = player === this.player;
            const isWinner = player === winner;
            
            const li = document.createElement('li');
            if (isWinner) li.classList.add('winner');
            if (isPlayer) li.classList.add('player');
            
            const rankSpan = document.createElement('span');
            rankSpan.textContent = `${rank}.`;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = isPlayer ? `${this.playerName} (YOU)` : player.name;
            
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = `${player.score} points`;
            
            li.appendChild(rankSpan);
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            
            fragment.appendChild(li);
        });
        
        // Batch DOM update
        finalRankingsList.appendChild(fragment);
        
        // Show the dialog
        gameOverDialog.style.display = 'flex';
        
        // Handle play again button
        playAgainBtn.addEventListener('click', () => {
            // Reload the page to restart the game
            location.reload();
        });
    }
    
    drawBoundary() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        
        // Left, top, and right boundaries remain at 100px from edges
        // But bottom boundary is now 150px from bottom (100px standard + 50px extra)
        this.ctx.beginPath();
        
        // Start from top-left
        this.ctx.moveTo(this.boundaryOffset, this.boundaryOffset);
        
        // Line to top-right
        this.ctx.lineTo(this.width - this.boundaryOffset, this.boundaryOffset);
        
        // Line to bottom-right
        this.ctx.lineTo(this.width - this.boundaryOffset, this.height - this.boundaryOffset - 50);
        
        // Line to bottom-left
        this.ctx.lineTo(this.boundaryOffset, this.height - this.boundaryOffset - 50);
        
        // Close the rectangle
        this.ctx.lineTo(this.boundaryOffset, this.boundaryOffset);
        
        this.ctx.stroke();
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
}