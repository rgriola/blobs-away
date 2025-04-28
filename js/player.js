import { Ball } from './ball.js';

// Update the Player class to handle all input types
class Player extends Ball {
    constructor(x, y, radius, color, name, canvas) {
        super(x, y, radius, color, canvas);
        this.isHuman = true;
        this.name = name || "Player";
        this.score = 0;
        
        // Use the same base parameters as bots
        this.speed = 2; // Same speed as bots
        
        // Target to move towards when player clicks
        this.targetX = null;
        this.targetY = null;
        this.targetActive = false; // Flag to track if we're moving to a target
        
        // Store previous position for interpolation
        this.prevX = x;
        this.prevY = y;
        
        // Input states for more responsive controls
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        // Set initial random direction like bots
        this.setRandomDirection();
        
        // Setup input listeners
        this.setupEventListeners();
        
        // Cache DOM references
        this.scoreElement = document.getElementById('player-score');
    }

    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.velocityX = Math.cos(angle);
        this.velocityY = Math.sin(angle);
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Mouse/Trackpad events
        if (this.canvas) {
            this.canvas.addEventListener('click', this.handleClick.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            
            // Touch events for mobile
            this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
            this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        }
    }
    
    // Keyboard Controls
    handleKeyDown(e) {
        if (this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = true;
            // When using keyboard, disable targeting
            this.targetActive = false;
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        if (this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = false;
            e.preventDefault();
        }
    }
    
    // Mouse Controls
    handleClick(e) {
        if (!this.active) return;
        
        // Convert screen coordinates to canvas coordinates
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.targetX = (e.clientX - rect.left) * scaleX;
        this.targetY = (e.clientY - rect.top) * scaleY;
        this.targetActive = true;
        
        console.log("Click target set:", this.targetX, this.targetY);
    }
    
    // Optional - use for hover effects
    handleMouseMove(e) {
        // Currently not used, but available for future features
    }
    
    // Touch Controls
    handleTouch(e) {
        if (!this.active) return;
        
        // Prevent scrolling
        e.preventDefault();
        
        if (e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const touch = e.touches[0];
            this.targetX = (touch.clientX - rect.left) * scaleX;
            this.targetY = (touch.clientY - rect.top) * scaleY;
            this.targetActive = true;
            
            console.log("Touch target set:", this.targetX, this.targetY);
        }
    }
    
    // Process keyboard input and set velocity
    handleKeyboardInput() {
        // Calculate direction based on key states
        let dirX = 0;
        let dirY = 0;
        
        if (this.keys.ArrowUp || this.keys.w) dirY -= 1;
        if (this.keys.ArrowDown || this.keys.s) dirY += 1;
        if (this.keys.ArrowLeft || this.keys.a) dirX -= 1;
        if (this.keys.ArrowRight || this.keys.d) dirX += 1;
        
        // If we have input, update velocity
        if (dirX !== 0 || dirY !== 0) {
            // Normalize for diagonal movement
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            this.velocityX = dirX / length;
            this.velocityY = dirY / length;
        }
    }
    
    // Process targeting (mouse/touch input)
    handleTargeting() {
        if (!this.targetActive || !this.targetX || !this.targetY) return;
        
        // Calculate direction to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If we're close enough to target, stop moving
        if (distance < 5) {
            this.targetActive = false;
            return;
        }
        
        // Set velocity to move toward target
        this.velocityX = dx / distance;
        this.velocityY = dy / distance;
    }

    // Update method overrides Ball's update
    update(deltaTime) {
        if (!this.active) return;
        
        // Store previous position for interpolation
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Process input based on active input method
        if (this.targetActive) {
            this.handleTargeting();
        } else {
            this.handleKeyboardInput();
        }
        
        // Update position using parent method
        super.update(deltaTime);
        
        // Update score display if available
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
    }
    
    // Override addScore to update UI
    addScore(points) {
        super.addScore(points);
        
        // Update score display if available
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
    }
}

export { Player };