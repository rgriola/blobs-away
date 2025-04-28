class GameUI {
    constructor(game) {
        this.game = game;
        
        // Cache DOM elements
        this.playerCountEl = document.getElementById('players-left');
        this.playerNameDisplay = document.getElementById('player-name-display');
        this.leaderboardEl = document.getElementById('leaderboard-list');
        this.gameTimeEl = document.getElementById('game-time');
        this.fpsDisplay = document.getElementById('fps-display');
        
        // FPS tracking
        this.lastFpsUpdate = 0;
        this.frameCount = 0;
        this.fps = 0;

        // Add sound controls to the UI
        this.addSoundControls();
    }
    
    startCountdown(onComplete) {
        // Create countdown overlay
        const countdownOverlay = document.createElement('div');
        countdownOverlay.className = 'countdown-overlay';
        document.querySelector('.game-container').appendChild(countdownOverlay);
        
        // Start countdown
        let countdownValue = this.game.countdownValue;
        const countdownInterval = setInterval(() => {
            if (countdownValue > 0) {
                countdownOverlay.textContent = countdownValue;
                countdownValue--;
            } else {
                countdownOverlay.textContent = 'GO!';
                
                // Remove countdown after a short delay
                setTimeout(() => {
                    countdownOverlay.remove();
                    if (onComplete) onComplete();
                }, 500);
                
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
    
    updateGameTime() {
        if (!this.game.gameStarted || this.game.gameOver) return;
        
        // Calculate time elapsed since start with higher precision
        const elapsedTime = Date.now() - this.game.gameStartTime;
        const elapsedSeconds = Math.floor(elapsedTime / 1000);
        const tenths = Math.floor((elapsedTime % 1000) / 100); // Get tenths of a second
        
        this.game.gameTime = elapsedSeconds;
        
        // Format time as MM:SS.T (minutes, seconds, tenths)
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
        
        // Update UI
        if (this.gameTimeEl) {
            this.gameTimeEl.textContent = formattedTime;
        }
    }
    
    updateFpsCounter(timestamp) {
        this.frameCount++;
        
        if (timestamp - this.lastFpsUpdate >= 1000) {
            const fps = Math.round(this.frameCount * 1000 / (timestamp - this.lastFpsUpdate));
            this.fps = fps;
            
            if (this.fpsDisplay) {
                this.fpsDisplay.textContent = fps;
            }
            
            // Reset counters
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
        }
    }
    
    updatePlayerCount() {
        const activePlayers = this.game.balls.filter(ball => ball.active).length;
        if (this.playerCountEl) {
            this.playerCountEl.textContent = activePlayers;
        }
    }
    
    updatePlayerDisplay(text) {
        if (this.playerNameDisplay) {
            this.playerNameDisplay.textContent = text;
        }
    }
    
    updateLeaderboard() {
        // Skip if leaderboard doesn't exist
        if (!this.leaderboardEl) return;
        
        // Only update UI every few frames to reduce DOM manipulation
        if (this.frameCount % 5 !== 0) return;
        
        // Create an array of all players (active and inactive) with scores
        const allPlayers = [...this.game.allPlayers];
        
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
            const playerName = player === this.game.player ? this.game.playerName : player.name;
            const score = player.score || 0;
            
            const listItem = document.createElement('li');
            
            // Add classes for styling
            listItem.classList.add(player.active ? 'active-player' : 'inactive-player');
            if (player === this.game.player) {
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
            if (winner === this.game.player) {
                gameOverTitle.textContent = 'Victory!';
                gameOverMessage.textContent = `Congratulations, ${this.game.playerName}! You dominated the arena with a score of ${this.game.player.score}.`;
            } else {
                gameOverTitle.textContent = 'Game Over';
                gameOverMessage.textContent = `${winner.name} won the game with a score of ${winner.score}.`;
            }
        } else {
            gameOverTitle.textContent = 'Game Over';
            gameOverMessage.textContent = 'The game has ended with no survivors.';
        }
        
        // Add elapsed time to game over message
        if (this.gameTimeEl) {
            gameOverMessage.textContent += ` Game duration: ${this.gameTimeEl.textContent}`;
        }
        
        // Populate final rankings
        finalRankingsList.innerHTML = '';
        
        // Sort all players by score
        const sortedPlayers = [...this.game.allPlayers].sort((a, b) => b.score - a.score);
        
        // Create document fragment for batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // Add each player to the rankings list
        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            const isPlayer = player === this.game.player;
            const isWinner = player === winner;
            
            const li = document.createElement('li');
            if (isWinner) li.classList.add('winner');
            if (isPlayer) li.classList.add('player');
            
            const rankSpan = document.createElement('span');
            rankSpan.textContent = `${rank}.`;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = isPlayer ? `${this.game.playerName} (YOU)` : player.name;
            
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
        if (gameOverDialog) {
            gameOverDialog.style.display = 'flex';
        }
        
        // Handle play again button
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                // Reload the page to restart the game
                location.reload();
            });
        }
    }

    addSoundControls() {
        const soundControls = document.createElement('div');
        soundControls.className = 'sound-controls';
        
        // Create mute toggle button
        const muteBtn = document.createElement('button');
        muteBtn.className = 'mute-btn';
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>'; // Requires FontAwesome
        muteBtn.addEventListener('click', () => {
            const isMuted = this.game.soundManager.toggleMute();
            muteBtn.innerHTML = isMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        });
        
        // Create volume slider
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = this.game.soundManager.masterVolume * 100;
        volumeSlider.className = 'volume-slider';
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.game.soundManager.setVolume(volume);
        });
        
        // Add elements to controls
        soundControls.appendChild(muteBtn);
        soundControls.appendChild(volumeSlider);
        
        // Add to the game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(soundControls);
        }
    }
}

export { GameUI };