document.addEventListener('DOMContentLoaded', function() {
    const playerDialog = document.getElementById('player-dialog');
    const playerNameInput = document.getElementById('player-name-input');
    const startGameBtn = document.getElementById('start-game-btn');
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
        }
        
        // Hide the dialog
        playerDialog.style.display = 'none';
        
        // Start the game with the player name
        const game = new Game(playerName);
        game.start();
    }
});