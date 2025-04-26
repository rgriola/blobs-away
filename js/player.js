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
        
        // Set initial random direction like bots do
        this.setRandomDirection();
        
        // Setup input listeners
        this.setupInputListeners();
    }

    // Same as bot's random direction
    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.velocityX = Math.cos(angle);
        this.velocityY = Math.sin(angle);
    }

    // Simple input listener - just track where the player clicked
    setupInputListeners() {
        // Click to set target location
        window.addEventListener('click', (e) => {
            const canvas = this.canvas;
            const rect = canvas.getBoundingClientRect();
            
            // Store click position as target
            this.targetX = e.clientX - rect.left;
            this.targetY = e.clientY - rect.top;
        });
        
        // Allow for keyboard input too
        window.addEventListener('keydown', (e) => {
            // Current position
            let targetX = this.x;
            let targetY = this.y;
            
            // Move target based on key press
            const moveDistance = 100; // How far to move the target
            
            switch (e.key) {
                case 'ArrowUp':
                    targetY -= moveDistance;
                    break;
                case 'ArrowDown':
                    targetY += moveDistance;
                    break;
                case 'ArrowLeft':
                    targetX -= moveDistance;
                    break;
                case 'ArrowRight':
                    targetX += moveDistance;
                    break;
                default:
                    return; // Exit if not an arrow key
            }
            
            // Set new target
            this.targetX = targetX;
            this.targetY = targetY;
        });
    }

    // Update method - behaves like a bot that moves toward clicked positions
    update() {
        if (!this.active) return;
        
        // If we have a target, adjust velocity to move toward it
        if (this.targetX !== null && this.targetY !== null) {
            // Calculate direction to target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If we're close to target, clear it (like reaching the clicked point)
            if (distance < this.radius) {
                this.targetX = null;
                this.targetY = null;
            }
            // Otherwise adjust direction toward target
            else {
                // Only change direction occasionally (like bots)
                if (Math.random() < 0.05) {
                    // Set new velocity toward target
                    this.velocityX = dx / distance;
                    this.velocityY = dy / distance;
                }
            }
        }
        
        // Occasionally change direction randomly (just like bots)
        if (this.targetX === null && this.targetY === null && Math.random() < 0.005) {
            this.setRandomDirection();
        }
        
        // Let the parent Ball class handle movement
        super.update();
    }

    draw(ctx) {
        super.draw(ctx);
        
        // Draw player name above the ball
        if (this.active) {
            ctx.font = Math.max(12, Math.min(14, this.radius / 2.5)) + "px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            
            // Add text shadow for better visibility
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeText(this.name, this.x, this.y - this.radius - 10);
            ctx.fillText(this.name, this.x, this.y - this.radius - 10);
            
            // Optionally draw target location if exists
            if (this.targetX !== null && this.targetY !== null) {
                ctx.beginPath();
                ctx.arc(this.targetX, this.targetY, 5, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.fill();
            }
        }
    }

    addScore(points) {
        this.score += points;
        document.getElementById('player-score').textContent = this.score;
    }
    
    // Use the parent Ball class merge without overriding
    // This ensures player behaves exactly like bots when merging
}