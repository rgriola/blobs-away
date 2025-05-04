import { Game } from './game.js';
import { GameConfig } from './GameConfig.js';
import { LogoAnimation } from './LogoAnimation.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize logo animation
  //  const logoAnim = new LogoAnimation('logoCanvas');
   const logoAnim = new LogoAnimation('logo-canvas');
    logoAnim.start();
    
    // Get DOM elements
    const playerDialog = document.getElementById('player-dialog');
    const gameContainer = document.querySelector('.game-container');
    const gameCanvas = document.getElementById('gameCanvas');
    const startButton = document.getElementById('start-game-btn');
    const nameInput = document.getElementById('player-name-input');
    const boardSelector = document.getElementById('board-type');
    const obstacleSelector = document.getElementById('obstacle-set');
    const restartButton = document.getElementById('play-again-btn');
    
    // Game instance
    let game = null;

    // Check if start button exists, add event listeners
    if (startButton) {
        startButton.addEventListener('click', startGame);
    } else {
        console.error('Start button not found! Check the ID "start-game-btn" exists in your HTML.');
        }
    
    // Check if restart button exists,
    if (restartButton) {
        restartButton.addEventListener('click', restartGame);
        }
    
    // Only populate selectors if they exist
    if (boardSelector) {
        populateBoardSelector();
    } else {
        console.error('Board selector not found! Check the ID "board-type" exists in your HTML.');
        }

    if (obstacleSelector) {
        populateObstacleSelector();
    } else {
        console.error('Obstacle selector not found! Check the ID "obstacle-set" exists in your HTML.');
        }      

    // Add all board types from GameConfig to the selector
    populateBoardSelector();
    
    // Add obstacle sets from GameConfig to the selector
    populateObstacleSelector();
    
    /**
     * Populate the board type selector with available board types
     */
    function populateBoardSelector() {
        // Clear existing options
        boardSelector.innerHTML = '';
        
        // Add option for each board type
        const boardTypes = GameConfig.BOARD_TYPES;
        for (const [key, value] of Object.entries(boardTypes)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
            boardSelector.appendChild(option);
        }
        
        // Set default selection
        boardSelector.value = GameConfig.DEFAULT_BOARD_TYPE;
    }
    
    /**
     * Populate the obstacle set selector
     */
    function populateObstacleSelector() {
        // Clear existing options
        obstacleSelector.innerHTML = '';
        
        // Add option for each obstacle set
        if (GameConfig.OBSTACLE_SETS) {
            for (const setName of Object.keys(GameConfig.OBSTACLE_SETS)) {
                const option = document.createElement('option');
                option.value = setName;
                option.textContent = setName.charAt(0).toUpperCase() + setName.slice(1);
                obstacleSelector.appendChild(option);
            }
        } else {
            // Fallback options if no obstacle sets defined
            const fallbackOptions = ['none', 'random'];
            for (const option of fallbackOptions) {
                const optElem = document.createElement('option');
                optElem.value = option;
                optElem.textContent = option.charAt(0).toUpperCase() + option.slice(1);
                obstacleSelector.appendChild(optElem);
            }
        }
        
        // Set default selection
        obstacleSelector.value = GameConfig.DEFAULT_OBSTACLE_SET;
    }
    
    /**
     * Start a new game
     */
    function startGame() {
        // Get player name (use default if empty)
        const playerName = nameInput.value.trim() || 'Player';
        
        // Get selected board type
        const boardType = boardSelector.value;
        
        // Get selected obstacle set
        const obstacleSet = obstacleSelector.value;
        

         // Hide player dialog (instead of mainMenu)
       // const playerDialog = document.getElementById('player-dialog');
        if (playerDialog) {
            playerDialog.style.display = 'none';
            }
        
        // Show game container
        //const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }

        // Create and start game
    try {
        game = new Game(playerName, boardType, obstacleSet);
        game.start();
        
        // Focus canvas for keyboard input
        if (gameCanvas) {
            gameCanvas.focus();
            }
        
        console.log("Game started with:", {playerName, boardType, obstacleSet});
    } catch (error) {
        console.error("Failed to start game:", error);
        console.error(error.stack); // Log the full stack trace
        }
    }
    
    /**
     * Restart the current game
     */
    function restartGame() {
        if (game) {
            game.restart();
        }
    }
    
});