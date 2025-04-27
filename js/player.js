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
        
        // Set initial random direction like bots do
        this.setRandomDirection();
        
        // Setup input listeners
        this.setupInputListeners();
        
        // Cache DOM references to avoid repeated lookups
        this.scoreElement = document.getElementById('player-score');
    }

    // Same as bot's random direction
    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.velocityX = Math.cos(angle);
        this.velocityY = Math.sin(angle);
    }

    // Improved input listener with key state tracking
    setupInputListeners() {
        // Click/touch to set target location
        window.addEventListener('click', (e) => {
            if (!this.active) return;
            const canvas = this.canvas;
            const rect = canvas.getBoundingClientRect();
            
            // Compute canvas scale if it's been resized via CSS
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            // Store click position as target, adjusted for canvas scaling
            this.targetX = (e.clientX - rect.left) * scaleX;
            this.targetY = (e.clientY - rect.top) * scaleY;
        });
        
        // Add touch support for mobile
        window.addEventListener('touchstart', (e) => {
            if (!this.active || !e.touches[0]) return;
            const canvas = this.canvas;
            const rect = canvas.getBoundingClientRect();
            
            // Prevent default to avoid scrolling
            e.preventDefault();
            
            // Compute canvas scale
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            // Use first touch point
            this.targetX = (e.touches[0].clientX - rect.left) * scaleX;
            this.targetY = (e.touches[0].clientY - rect.top) * scaleY;
        });
        
        // Improved keyboard controls using key state tracking
        window.addEventListener('keydown', (e) => {
            if (!this.active) return;
            
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
                // Clear target when using keyboard
                this.targetX = null;
                this.targetY = null;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });
    }

    // Update method to match Bot behavior exactly
    update(timeStep = 1.0) {
        if (!this.active) return;
        
        // Store previous position for interpolation
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Handle keyboard input - allows multiple keys at once
        let dx = 0;
        let dy = 0;
        
        if (this.keys.ArrowUp || this.keys.w) dy -= 1;
        if (this.keys.ArrowDown || this.keys.s) dy += 1;
        if (this.keys.ArrowLeft || this.keys.a) dx -= 1;
        if (this.keys.ArrowRight || this.keys.d) dx += 1;
        
        // If keyboard input detected, override target
        if (dx !== 0 || dy !== 0) {
            // Calculate magnitude for normalized movement
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            if (magnitude > 0) {
                // Normalize and set velocity
                this.velocityX = dx / magnitude;
                this.velocityY = dy / magnitude;
            }
        }
        // If no keyboard input but we have a target from click/touch
        else if (this.targetX !== null && this.targetY !== null) {
            // Calculate direction to target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If we're close to target, clear it
            if (distance < 3) { // Smaller threshold for better stopping
                this.targetX = null;
                this.targetY = null;
                // Add slight deceleration at target
                this.velocityX *= 0.8;
                this.velocityY *= 0.8;
            }
            // Otherwise adjust direction toward target
            else {
                this.velocityX = dx / distance;
                this.velocityY = dy / distance;
            }
        }
        // Keep the random direction change from original code when idle
        else if (Math.random() < 0.005) {
            this.setRandomDirection();
        }
        
        // Apply movement using the same formula as Bot class
        // This is the key change to make movement identical
        this.x += this.velocityX * this.speed * timeStep;
        this.y += this.velocityY * this.speed * timeStep;
        
        // Boundary checking from the parent class
        this.handleBoundaryCollision();
    }
    
    // Boundary collision method (from Ball class, included for completeness)
    handleBoundaryCollision() {
        const boundaryOffset = 100;
        const bottomExtra = 50;
        
        // Left boundary
        if (this.x - this.radius < boundaryOffset) {
            this.x = boundaryOffset + this.radius;
            this.velocityX *= -1;
        }
        // Right boundary
        else if (this.x + this.radius > this.canvas.width - boundaryOffset) {
            this.x = this.canvas.width - boundaryOffset - this.radius;
            this.velocityX *= -1;
        }
        
        // Top boundary
        if (this.y - this.radius < boundaryOffset) {
            this.y = boundaryOffset + this.radius;
            this.velocityY *= -1;
        }
        // Bottom boundary (with extra offset)
        else if (this.y + this.radius > this.canvas.height - boundaryOffset - bottomExtra) {
            this.y = this.canvas.height - boundaryOffset - bottomExtra - this.radius;
            this.velocityY *= -1;
        }
    }

    // Draw at interpolated position
    drawAt(ctx, x, y) {
        // Draw the ball
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw player name above the ball
        if (this.active) {
            ctx.font = Math.max(12, Math.min(14, this.radius / 2.5)) + "px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            
            // Add text shadow for better visibility
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeText(this.name, x, y - this.radius - 10);
            ctx.fillText(this.name, x, y - this.radius - 10);
            
            // Draw target indicator
            if (this.targetX !== null && this.targetY !== null) {
                // Draw target circle
                ctx.beginPath();
                ctx.arc(this.targetX, this.targetY, 4, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.fill();
                
                // Draw line from ball to target
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(this.targetX, this.targetY);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 3]); // Dotted line
                ctx.stroke();
                ctx.setLineDash([]); // Reset line style
            }
        }
    }
    
    // Original draw method (used during countdown)
    draw(ctx) {
        this.drawAt(ctx, this.x, this.y);
    }

    // Optimized score update
    addScore(points) {
        this.score += points;
        // Use cached DOM reference
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
    }
    
    // Merge with another ball - absorb its size and score
    merge(otherBall) {
        // Calculate new radius based on area
        const thisArea = Math.PI * this.radius * this.radius;
        const otherArea = Math.PI * otherBall.radius * otherBall.radius;
        const combinedArea = thisArea + otherArea;
        
        // Update radius
        this.radius = Math.sqrt(combinedArea / Math.PI);
        
        // Absorb the other ball's score
        this.addScore(otherBall.score || 1);
        
        // Adjust speed based on new size (larger = slower)
        this.speed = Math.max(0.8, 2 - (this.radius / 100));
    }
}