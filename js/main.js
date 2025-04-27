document.addEventListener('DOMContentLoaded', function() {
    const playerDialog = document.getElementById('player-dialog');
    const playerNameInput = document.getElementById('player-name-input');
    const startGameBtn = document.getElementById('start-game-btn'); // Fixed variable name
    const gameContainer = document.querySelector('.game-container');
    const gameOverDialog = document.getElementById('game-over-dialog');
    const playAgainBtn = document.getElementById('play-again-btn');
    // Explicitly set the dialog to be visible
    playerDialog.style.display = 'flex';
    
    // Hide the game container until player enters name
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    
    // Set focus on the input field
    playerNameInput.focus();
    
    // Input validation for letters only
    playerNameInput.addEventListener('input', function(event) {
        // Remove any non-letter characters
        this.value = this.value.replace(/[^A-Za-z]/g, '');
        
        // Ensure max length of 12
        if (this.value.length > 12) {
            this.value = this.value.substring(0, 12);
        }
    });
    
    // Start game when button is clicked
    startGameBtn.addEventListener('click', function() {
        if (validatePlayerName()) {
            startGame();
        }
    });
    
    // Allow pressing Enter to start the game
    playerNameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && validatePlayerName()) {
            startGame();
        }
    });
    
    // Play again functionality
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', function() {
            // Hide the game over dialog
            gameOverDialog.style.display = 'none';
            
            // Show the player dialog
            playerDialog.style.display = 'flex';
            
            // Focus on the input field
            playerNameInput.focus();
        });
    }
    
    // Validate player name
    function validatePlayerName() {
        const name = playerNameInput.value.trim();
        
        // Check if name contains only letters
        const validNameRegex = /^[A-Za-z]+$/;
        
        if (!validNameRegex.test(name) && name !== '') {
            // Show error message
            alert('Please use only letters for your name.');
            return false;
        }
        
        return true;
    }
    
// Start the game
function startGame() {
    let playerName = playerNameInput.value.trim();
    
    // Use default name if empty
    if (!playerName) {
        playerName = "Player";
    }
    
    // Show the game container
    if (gameContainer) {
        gameContainer.style.display = 'block';
        
        // Add a brief delay before adding the active class for transition
        setTimeout(() => {
            gameContainer.classList.add('active');
            
            // Add game-active class to body for positioning the title
            document.body.classList.add('game-active');
            
            // Create canvas if it doesn't exist
            if (!document.getElementById('gameCanvas')) {
                const canvas = document.createElement('canvas');
                canvas.id = 'gameCanvas';
                canvas.width = 800;  // Set appropriate size
                canvas.height = 600;
                gameContainer.appendChild(canvas);
            }
            
            // Start the game with the player name
            const game = new Game(playerName);
            
            // Store game instance on window to prevent garbage collection
            window.gameInstance = game;
            
            // Start monitoring performance
            setupPerformanceMonitoring();
            
            // Start the game
            game.start();
        }, 100);
    }
    
    // Hide the dialog
    playerDialog.style.display = 'none';
}

// Add performance monitoring
function setupPerformanceMonitoring() {
    let lastFrameTime = performance.now();
    let frameHistory = [];
    let frameHistorySize = 60; // Keep track of 60 frames
    
    function checkPerformance() {
        const now = performance.now();
        const frameDuration = now - lastFrameTime;
        lastFrameTime = now;
        
        // Store frame duration
        frameHistory.push(frameDuration);
        if (frameHistory.length > frameHistorySize) {
            frameHistory.shift();
        }
        
        // Calculate average FPS over recorded frames
        if (frameHistory.length === frameHistorySize) {
            const avgDuration = frameHistory.reduce((sum, val) => sum + val, 0) / frameHistory.length;
            const avgFps = 1000 / avgDuration;
            
            // Log to console if poor performance detected
            if (avgFps < 45) {
                console.warn(`Performance warning: Average FPS: ${avgFps.toFixed(1)}`);
            }
        }
        
        requestAnimationFrame(checkPerformance);
    }
    
    requestAnimationFrame(checkPerformance);
}


});