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
        // called in game.handlePlayerAbsorption
        super.addScore(points);
        // Update score display if available
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
    }

// Override the drawAt method in Player class
    drawAt(ctx, x, y) {
        // First call the parent's drawAt to render the ball with all its effects
        super.drawAt(ctx, x, y);
        
        // Then add the heart on top
        if (this.active) {
            this.drawHeart(ctx, x, y);
        }
    }
    // Replace your current drawHeart method with this enhanced version
    drawHeart(ctx, x, y) {
        const heartSize = this.radius * 0.5;
        
        // More pronounced pulsing effect
        const now = performance.now();
        const pulseAmount = Math.sin(now * 0.003) * 0.15 + 1;
        const adjustedSize = heartSize * pulseAmount;
        
        // Extract player color components for contrast adaptation
        let heartColor = 'white';
        let glowColor = 'rgba(255, 255, 255, 0.8)';
        
        // Determine if player color is light or dark to adjust heart color
        if (this.color.startsWith('#')) {
            // Handle hex color
            const r = parseInt(this.color.slice(1, 3), 16);
            const g = parseInt(this.color.slice(3, 5), 16);
            const b = parseInt(this.color.slice(5, 7), 16);
            
            // If the ball color is light, use a darker heart
            if ((r + g + b) / 3 > 170) {
                heartColor = '#ff3366';  // Pinkish-red heart
                glowColor = 'rgba(255, 51, 102, 0.8)';
            }
        } else if (this.color.startsWith('rgb')) {
            // Handle RGB color string
            const rgbMatch = this.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
            if (rgbMatch) {
                const [_, r, g, b] = rgbMatch;
                if ((parseInt(r) + parseInt(g) + parseInt(b)) / 3 > 170) {
                    heartColor = '#ff3366';
                    glowColor = 'rgba(255, 51, 102, 0.8)';
                }
            }
        }
        
        // Draw glow effect first (multiple layers for stronger effect)
        ctx.save();
        
        // Outer glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw heart shape with glow
        this.drawHeartPath(ctx, x, y, adjustedSize * 1.1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        // Inner heart
        ctx.shadowBlur = 8;
        this.drawHeartPath(ctx, x, y, adjustedSize);
        ctx.fillStyle = heartColor;
        ctx.fill();
        
        // Add outline for definition
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.restore();
    }

    // Helper method to avoid repeating the heart path code
    drawHeartPath(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.3);
        ctx.bezierCurveTo(
            x - size / 2, y - size / 2,
            x - size, y + size / 4,
            x, y + size / 2
        );
        ctx.bezierCurveTo(
            x + size, y + size / 4,
            x + size / 2, y - size / 2,
            x, y - size * 0.3
        );
    }

}

export { Player };