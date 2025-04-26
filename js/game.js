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
        
        // New properties for delay and timer
        this.gameStarted = false;
        this.countdownValue = 3;
        this.gameTime = 0; // Time in seconds
        this.gameTimeEl = document.getElementById('game-time');
        
        this.initGame();
        this.lastTimestamp = 0;

        this.fixedDeltaTime = 1000 / 60; // Target 60 FPS
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        this.animate = this.animate.bind(this);
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
    
    // New method to get a color that hasn't been used yet
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
            // This shouldn't happen with 20 colors and only 10 initial players
            console.warn("All colors have been used. Resetting color selection.");
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
    
    // Keep the original method as fallback
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
    
    // WORKS LIKE GAMELOOP()
    animate(timestamp) {
        // Calculate time delta for smooth animation
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        // Calculate speed multiplier for consistent movement
        const speedMultiplier = deltaTime / this.fixedDeltaTime;
        
        // Update FPS counter - add error handling
        try {
            this.updateFpsCounter(timestamp);
        } catch (error) {
            console.error("Error updating FPS counter:", error);
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw boundary
        this.drawBoundary();
        
        // Only update game logic if countdown is finished
        if (this.gameStarted) {
            // Update game time
            this.updateGameTime();
            
            // Update and draw all balls with speedMultiplier
            try {
                this.update(speedMultiplier);
            } catch (error) {
                console.error("Error in update:", error);
            }
            
            // Check if player just lost (but don't end the game)
            if (!this.playerLost && this.player && !this.player.active) {
                this.playerLost = true;
                this.showPlayerLostMessage();
                document.getElementById('player-name-display').textContent = this.playerName + " (Spectating)";
            }
            
            // Check for game over
            const activeBalls = this.balls.filter(ball => ball.active);
            if (!this.gameOver && activeBalls.length <= 1) {
                this.gameOver = true;
                if (activeBalls.length === 1) {
                    this.showGameOverMessage(activeBalls[0]);
                } else {
                    this.showGameOverMessage(null);
                }
            }
        } else {
            // When countdown is running, still draw balls but don't update positions
            for (let i = 0; i < this.balls.length; i++) {
                if (this.balls[i] && this.balls[i].active) {
                    this.balls[i].draw(this.ctx);
                }
            }
        }
        
        // IMPORTANT: Continue animation unless the game is completely over
        // Make sure this is always called to keep the game running
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
            
            // Get the FPS display element
            const fpsDisplay = document.getElementById('fps-display');
            
            if (fpsDisplay) {
                fpsDisplay.textContent = fps;
            } else {
                console.warn("FPS display element not found");
            }
            
            // Reset counters
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
            
            // Debug logging
            console.log(`FPS: ${fps}`);
        }
    }
    
    update(speedMultiplier = 1) {
        // Update all balls with speedMultiplier
        for (let i = 0; i < this.balls.length; i++) {
            if (this.balls[i] && this.balls[i].active) {
                // Add null check before calling update
                if (typeof this.balls[i].update === 'function') {
                    this.balls[i].update(speedMultiplier);
                }
                
                this.balls[i].draw(this.ctx);
            }
        }
        
        // Check for collisions
        this.checkCollisions();
    }
    
    checkCollisions() {
        for (let i = 0; i < this.balls.length; i++) {
            const ball1 = this.balls[i];
            if (!ball1.active) continue;
            
            for (let j = i + 1; j < this.balls.length; j++) {
                const ball2 = this.balls[j];
                if (!ball2.active) continue;
                
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
    
    addMergeAnimation(x, y, color, size) {
        // Create particle effects for merging
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'merge-particle';
            
            // Position at merge location
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // Set color based on the ball that was absorbed
            particle.style.backgroundColor = color;
            
            // Random size based on the ball size
            const particleSize = Math.random() * (size / 10) + 2;
            particle.style.width = `${particleSize}px`;
            particle.style.height = `${particleSize}px`;
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            const dirX = Math.cos(angle) * speed;
            const dirY = Math.sin(angle) * speed;
            
            // Animation
            particle.animate([
                { transform: `translate(0, 0) scale(1)`, opacity: 1 },
                { transform: `translate(${dirX * 50}px, ${dirY * 50}px) scale(0)`, opacity: 0 }
            ], {
                duration: Math.random() * 1000 + 500,
                easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                fill: 'forwards'
            });
            
            soundManager.play('merge'); // Play merge sound

            // Add to DOM
            document.querySelector('.game-container').appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                particle.remove();
            }, 1500);
        }
    }
    
    updatePlayerCount() {
        const activePlayers = this.balls.filter(ball => ball.active).length;
        this.playerCountEl.textContent = activePlayers;
    }
    
    updateLeaderboard() {
        // Create an array of all players (active and inactive) with scores
        const allPlayers = [...this.allPlayers];
        
        // Sort by score (descending)
        allPlayers.sort((a, b) => b.score - a.score);
        
        // Clear current leaderboard
        this.leaderboardEl.innerHTML = '';
        
        // Add top players to leaderboard (up to 10)
        const topPlayers = allPlayers.slice(0, 10);
        
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
            
            this.leaderboardEl.appendChild(listItem);
        });
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
            
            finalRankingsList.appendChild(li);
        });
        
        // Show the dialog
        gameOverDialog.style.display = 'flex';
        
        // Handle play again button
        playAgainBtn.addEventListener('click', () => {
            // Reload the page to restart the game
            location.reload();
        });
    }
    
    getFinalRankingsText() {
        // Sort all players by score
        const sortedPlayers = [...this.allPlayers].sort((a, b) => b.score - a.score);
        
        // Create ranking text
        return sortedPlayers.map((player, index) => {
            const rank = index + 1;
            const name = player === this.player ? `${this.playerName} (YOU)` : player.name;
            return `${rank}. ${name}: ${player.score} points`;
        }).join('\n');
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
        requestAnimationFrame(this.animate);
    }
}