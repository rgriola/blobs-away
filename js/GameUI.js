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
    
    updateLeaderboard(forceUpdate = false) {
        // Skip if leaderboard doesn't exist or game is over
        if (!this.leaderboardEl || this.game.gameOver) return;
        
        // Only update UI every few frames to reduce DOM manipulation
        // But allow force update to bypass the frame check
        if (!forceUpdate && this.frameCount % 5 !== 0) return;
        
        // Create an array of all players
        const allPlayers = [...this.game.allPlayers];
        
        // Sort by score (descending)
        allPlayers.sort((a, b) => b.score - a.score);
        
        // Clear current leaderboard
        this.leaderboardEl.innerHTML = '';
        
        // Create document fragment for batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // Add up to 10 players to the leaderboard
        const topPlayers = allPlayers.slice(0, 10);
        
        topPlayers.forEach((player, index) => {
            const rank = index + 1;
            
            // Use different class for active vs inactive players
            const listItem = document.createElement('li');
            
            // Add styles based on player status
            if (!player.active) {
                listItem.classList.add('inactive-player');
            } else {
                listItem.classList.add('active-player');
            }
            
            // Highlight current player
            if (player === this.game.player) {
                listItem.classList.add('current-player');
            }
            
            // Create rank span
            const rankSpan = document.createElement('span');
            rankSpan.classList.add('player-rank');
            rankSpan.textContent = `${rank}.`;
            
            // Create name span
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('player-name');
            nameSpan.textContent = player === this.game.player ? 
                this.game.playerName : player.name;
            
            // Create score span
            const scoreSpan = document.createElement('span');
            scoreSpan.classList.add('player-score');
            scoreSpan.textContent = player.score;
            
            // Assemble the list item
            listItem.appendChild(rankSpan);
            listItem.appendChild(nameSpan);
            listItem.appendChild(scoreSpan);
            
            fragment.appendChild(listItem);
        });
        
        // Batch DOM update
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
    
    resetLeaderboard() {
        // Clear the leaderboard element
        if (this.leaderboardEl) {
            this.leaderboardEl.innerHTML = '';
        }
        
        // Reset any stored scores or rankings
        if (this.game.allPlayers) {
            this.game.allPlayers.forEach(player => {
                player.score = 0;
            });
        }
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
        
        // Clear and populate final rankings
        this.updateFinalRankings(finalRankingsList, winner);
        
        // Show the dialog
        if (gameOverDialog) {
            gameOverDialog.style.display = 'flex';
        }
        
        // Handle play again button
        if (playAgainBtn) {
            // Remove any existing click listeners
            const newPlayAgainBtn = playAgainBtn.cloneNode(true);
            playAgainBtn.parentNode.replaceChild(newPlayAgainBtn, playAgainBtn);
            
            // Add new click listener for restart
            newPlayAgainBtn.addEventListener('click', () => {
                // Hide the game over dialog
                gameOverDialog.style.display = 'none';
                
                // Restart the game directly
                this.game.restart();
            });
        }

    }

    // Helper method to update final rankings
    updateFinalRankings(finalRankingsList, winner) {
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
    }

    //////// SOUND CONTROLS ///////////
    addSoundControls() {
        const soundControls = document.createElement('div');
        soundControls.className = 'sound-controls';
        
        // Create a label for the sound controls
        const controlsLabel = document.createElement('span');
        controlsLabel.className = 'controls-label';
        controlsLabel.textContent = 'Sound';
        
        // Create mute toggle button
        const muteBtn = document.createElement('button');
        muteBtn.className = 'mute-btn';
        muteBtn.setAttribute('aria-label', 'Toggle sound');
        muteBtn.setAttribute('title', 'Toggle sound');
        
        // Set initial mute button state based on sound manager
        const isMuted = !this.game.soundManager.soundEnabled;
        muteBtn.innerHTML = isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
        
        // Create volume slider
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = this.game.soundManager.masterVolume * 100;
        volumeSlider.className = 'volume-slider';
        
        // Create volume level indicator (visual feedback)
        const volumeLevel = document.createElement('div');
        volumeLevel.className = 'volume-level';
        volumeLevel.style.width = `${volumeSlider.value}%`;
        if (isMuted) {
            volumeLevel.classList.add('muted');
        }
        
        // Make the mute button more reliable with direct state management
        muteBtn.addEventListener('click', () => {
            // Explicitly access and toggle the sound state
            const soundManager = this.game.soundManager;
            
            // Toggle the sound state
            soundManager.soundEnabled = !soundManager.soundEnabled;
            
            // Update the button icon based on the new state
            const isMuted = !soundManager.soundEnabled;
            muteBtn.innerHTML = isMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
            
            // Update volume slider appearance
            if (isMuted) {
                volumeLevel.classList.add('muted');
            } else {
                volumeLevel.classList.remove('muted');
            }
            
            console.log(`Sound is now ${soundManager.soundEnabled ? 'enabled' : 'muted'}`);
        });
        
        // Handle volume changes
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.game.soundManager.setVolume(volume);
            
            // Update volume level indicator
            volumeLevel.style.width = `${e.target.value}%`;
            
            // If volume is set to 0, update the mute button
            if (volume === 0) {
                muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                // If volume is changed from 0, enable sound and update icon
                if (volumeLevel.classList.contains('muted')) {
                    this.game.soundManager.soundEnabled = true;
                    volumeLevel.classList.remove('muted');
                    muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                }
                
                // Change icon based on volume level
                if (volume < 0.5) {
                    muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
                } else {
                    muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                }
            }
        });
        
        // Create a container for the volume slider and level
        const volumeSliderContainer = document.createElement('div');
        volumeSliderContainer.className = 'volume-slider-container';
        volumeSliderContainer.appendChild(volumeLevel);
        volumeSliderContainer.appendChild(volumeSlider);
        
        // Add elements to controls
        soundControls.appendChild(controlsLabel);
        soundControls.appendChild(muteBtn);
        soundControls.appendChild(volumeSliderContainer);
        
        // Add to the game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(soundControls);
        }
    }
}

export { GameUI };