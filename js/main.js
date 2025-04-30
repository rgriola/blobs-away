import { Game } from './game.js';

class GameInitializer {
    constructor() {
        // Cache DOM elements
        this.playerDialog = document.getElementById('player-dialog');
        this.playerNameInput = document.getElementById('player-name-input');
        this.startGameBtn = document.getElementById('start-game-btn');
        this.gameContainer = document.querySelector('.game-container');
        this.gameOverDialog = document.getElementById('game-over-dialog');
        this.playAgainBtn = document.getElementById('play-again-btn');
        
        // Game canvas settings
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        // Initialize the game setup
        this.init();
    }

    init() {
        // Set initial UI state
        this.setupInitialUI();
        // Bind event listeners
        this.setupEventListeners();
    }

    setupInitialUI() {
        // Show player dialog
        this.playerDialog.style.display = 'flex';
        // Hide game container initially
        if (this.gameContainer) {
            this.gameContainer.style.display = 'none';
        }
        // Focus on name input
        this.playerNameInput.focus();
    }

    setupEventListeners() {
        // Input validation for player name
        this.playerNameInput.addEventListener('input', this.handleNameInput.bind(this));
        // Start game button click
        this.startGameBtn.addEventListener('click', this.handleStartClick.bind(this));
        // Enter key to start game
        this.playerNameInput.addEventListener('keypress', this.handleEnterKey.bind(this));
    }

    handleNameInput(event) {
        // Remove non-letter characters and limit length
        const input = event.target;
        input.value = input.value.replace(/[^A-Za-z]/g, '').substring(0, 12);
    }

    handleStartClick() {
        if (this.validatePlayerName()) {
            this.startGame();
        }
    }

    handleEnterKey(event) {
        if (event.key === 'Enter' && this.validatePlayerName()) {
            this.startGame();
        }
    }

    validatePlayerName() {
        const name = this.playerNameInput.value.trim();
        const validNameRegex = /^[A-Za-z]+$/;
        
        // Allow empty name (will use default) or valid name
        if (!validNameRegex.test(name) && name !== '') {
            alert('Please use only letters for your name.');
            return false;
        }
        return true;
    }

    createGameCanvas() {
        // Create canvas element if it doesn't exist
        if (!document.getElementById('gameCanvas')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
            this.gameContainer.appendChild(canvas);
            return canvas;
        }
    }

    setupAudio(game) {
        // Enable audio with user interaction
        const enableAudio = () => {
            if (game.soundManager) {
                game.soundManager.playMusic('game-music', 0.3);
                // Remove listeners after first interaction
                ['click', 'keydown', 'touchstart'].forEach(event => 
                    document.removeEventListener(event, enableAudio));
            }
        };

        // Add listeners for user interaction
        ['click', 'keydown', 'touchstart'].forEach(event => 
            document.addEventListener(event, enableAudio));
    }

    setupPerformanceMonitoring() {
        const frameHistory = [];
        const frameHistorySize = 60; // Monitor 60 frames
        let lastFrameTime = performance.now();

        const checkPerformance = () => {
            const now = performance.now();
            const frameDuration = now - lastFrameTime;
            lastFrameTime = now;
            
            // Track frame durations
            frameHistory.push(frameDuration);
            if (frameHistory.length > frameHistorySize) {
                frameHistory.shift();
            }
            
            // Calculate and check average FPS
            if (frameHistory.length === frameHistorySize) {
                const avgDuration = frameHistory.reduce((sum, val) => sum + val, 0) / frameHistorySize;
                const avgFps = 1000 / avgDuration;
                
                if (avgFps < 45) {
                    console.warn(`Performance warning: Average FPS: ${avgFps.toFixed(1)}`);
                }
            }
            
            requestAnimationFrame(checkPerformance);
        };

        requestAnimationFrame(checkPerformance);
    }

    startGame() {
        // Get player name or use default
        const playerName = this.playerNameInput.value.trim() || 'Player';
        
        if (this.gameContainer) {
            // Show game container
            this.gameContainer.style.display = 'block';
            
            // Add slight delay for transitions
            setTimeout(() => {
                this.gameContainer.classList.add('active');
                document.body.classList.add('game-active');
                
                // Setup game canvas
                this.createGameCanvas();
                
                // Initialize game
                const game = new Game(playerName);
                window.gameInstance = game;
                
                // Setup audio and performance monitoring
                this.setupAudio(game);
                this.setupPerformanceMonitoring();
                
                // Start the game
                game.start();
            }, 100);
        }
        
        // Hide the player dialog
        this.playerDialog.style.display = 'none';
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => new GameInitializer());