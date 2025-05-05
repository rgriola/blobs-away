import { lightenColor } from './utils/ColorUtils.js'; // Import the helper function
import { GameConfig } from './GameConfig.js'; // Import GameConfig for constants

class Ball {
    constructor(x, y, radius, color, canvas) {
        this.deBug = GameConfig.DEBUG_MODE; // Use GameConfig's debug mode setting
        
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.originalColor = color; // Store original color for restoration after cooldown
        this.darkenedColor = this.darkenColor(color, 50); // Prepare darkened version for cooldown
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = GameConfig.INITIAL_VELOCITY / 2.5; // Use GameConfig's velocity setting with scaling
        this.active = true;
        this.name = ""; // Default empty name
        this.canvas = canvas; // Store reference to canvas
        this.score = 0;  // Add score property
        
        // For interpolation - add these without changing other functionality
        this.prevX = x;
        this.prevY = y;

        this.canAbsorb = false; // Initially can't absorb during countdown
        this.absorbCooldown = 0; // Cooldown timer

        this.lightenColor = lightenColor; // Store the function for later use
    }

    // Add method to darken color (opposite of lightenColor)
    darkenColor(hexColor, percent) {
        // Convert hex to RGB
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate darkness factor
        const factor = (100 - percent) / 100;
        
        // Apply darkening
        const darkerR = Math.floor(r * factor);
        const darkerG = Math.floor(g * factor);
        const darkerB = Math.floor(b * factor);
        
        // Convert back to hex
        return `#${(darkerR).toString(16).padStart(2, '0')}${(darkerG).toString(16).padStart(2, '0')}${(darkerB).toString(16).padStart(2, '0')}`;
    }

    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.velocityX = Math.cos(angle);
        this.velocityY = Math.sin(angle);
    }

    // Original draw method preserved
    draw(ctx) {
        
    if (!this.active) return;     
        // Use drawAt with the current position
        this.drawAt(ctx, this.x, this.y);

        // Add debug visualization if debug mode is enabled
        if (this.canvas.debugMode) {
        this.drawDebug(ctx);
        }
    } 


    // Add drawAt method for interpolation compatibility without breaking existing code
    drawAt(ctx, x, y) {
        if (!this.active) return;
        
        // Validate coordinates to prevent non-finite values
        if (!isFinite(x) || !isFinite(y) || !isFinite(this.radius)) {
            console.warn('Invalid coordinates in drawAt:', { x, y, radius: this.radius });
            return;
        }
        
        // Save current context state
        ctx.save();
        
        try {
            // Create the ball with gradient
            ctx.beginPath();
            ctx.arc(x, y, this.radius, 0, Math.PI * 2);
            
            // Get the current color based on cooldown state
            const currentColor = this.canAbsorb ? this.originalColor : this.darkenedColor;
            
            // Create gradient with validated coordinates
            const gradX = isFinite(x - this.radius/3) ? x - this.radius/3 : x;
            const gradY = isFinite(y - this.radius/3) ? y - this.radius/3 : y;
            
            const gradient = ctx.createRadialGradient(
                gradX, gradY, 0,
                x, y, this.radius
            );
            gradient.addColorStop(0, this.lightenColor(currentColor, 50));
            gradient.addColorStop(1, currentColor);
            
            // Add shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // Fill with gradient
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add a subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } catch (error) {
            console.error('Error drawing ball:', error, { x, y, radius: this.radius });
        }
        
        // Restore context state before text rendering
        ctx.restore();
        
        // Draw name if exists (base implementation, overridden in subclasses)
        if (this.name) {
            try {
                ctx.font = Math.max(10, Math.min(14, this.radius / 2.5)) + "px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                
                // Add text shadow for better visibility
                ctx.shadowColor = "black";
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                
                ctx.fillText(this.name, x, y - this.radius - 10);
                
                // Reset shadows after drawing text
                ctx.shadowColor = "transparent";
            } catch (error) {
                console.error('Error drawing ball name:', error);
            }
        }
        
        // Optionally show cooldown indicator
        if (!this.canAbsorb && this.absorbCooldown > 0) {
            try {
                this.drawCooldownIndicator(ctx, x, y);
            } catch (error) {
                console.error('Error drawing cooldown indicator:', error);
            }
        }
    }

    // Draw a visual indicator of cooldown time remaining
    drawCooldownIndicator(ctx, x, y) {
        // Draw cooldown progress arc
        const cooldownProgress = this.absorbCooldown / GameConfig.ABSORB_COOLDOWN;
        const startAngle = -Math.PI / 2; // Start at the top
        const endAngle = startAngle + (Math.PI * 2 * cooldownProgress);
        
        ctx.save();
        
        // Draw an arc showing remaining cooldown
        ctx.beginPath();
        ctx.arc(x, y, this.radius * 1.2, startAngle, endAngle);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.stroke();
        
        ctx.restore();
    }

    // Make sure your Ball class update method looks something like this:
    update(deltaTime) {
        // If not active, don't update
        if (!this.active) return;

        // Store previous position for interpolation
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Update position based on velocity
        this.x += this.velocityX * this.speed;
        this.y += this.velocityY * this.speed;

        // Validate position after movement
        this.validatePosition();
    
        // Do not handle boundary collisions here - 
        // GamePhysics will handle that
    }

    // Add compatibility method for Game class
    handleBoundaryCollision() {
        // Use canvas dimensions instead of hardcoded values
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const boundaryOffset = GameConfig.BOUNDARY_OFFSET;
        const bottomOffset = boundaryOffset + 50; // Extra 50px for bottom boundary
        
        // Left boundary
        if (this.x - this.radius < boundaryOffset) {
            this.x = boundaryOffset + this.radius;
            this.velocityX = -this.velocityX;
        }
        
        // Right boundary
        if (this.x + this.radius > canvasWidth - boundaryOffset) {
            this.x = canvasWidth - boundaryOffset - this.radius;
            this.velocityX = -this.velocityX;
        }
        
        // Top boundary
        if (this.y - this.radius < boundaryOffset) {
            this.y = boundaryOffset + this.radius;
            this.velocityY = -this.velocityY;
        }
        
        // Bottom boundary (now 50px higher than before)
        if (this.y + this.radius > canvasHeight - bottomOffset) {
            this.y = canvasHeight - bottomOffset - this.radius;
            this.velocityY = -this.velocityY;
        }
    }

    collidesWith(otherBall) {
        if (!this.active || !otherBall.active) return false;
        
        const dx = this.x - otherBall.x;
        const dy = this.y - otherBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < this.radius + otherBall.radius;
    }

    merge(otherBall) {
        if (!otherBall || !otherBall.active) {
            console.warn("Attempted to merge with inactive or null ball");
            return;
        }
        
        console.log(`Merging balls: ${this.name || 'Unnamed'} (${this.radius.toFixed(2)}) + ${otherBall.name || 'Unnamed'} (${otherBall.radius.toFixed(2)})`);
        
        try {
            // Calculate the new size based on area
            const thisArea = Math.PI * this.radius * this.radius;
            const otherArea = Math.PI * otherBall.radius * otherBall.radius;
            const combinedArea = thisArea + otherArea;
            
            // Set new radius based on combined area
            this.radius = Math.sqrt(combinedArea / Math.PI);
            
            // Adjust speed as ball gets larger - cap at minimum speed
            this.speed = Math.max(0.5, 2 - (this.radius - 15) / 30);
            
            // Add score from the other ball
            this.addScore(otherBall.score || 1);
    
            // Deactivate the absorbed ball
            otherBall.active = false;
            
            // Trigger cooldown after absorbing
            this.canAbsorb = false;
            this.absorbCooldown = GameConfig.ABSORB_COOLDOWN;
            
            console.log(`Merge successful! ${this.name || 'Ball'} now has radius ${this.radius.toFixed(2)} and score ${this.score}`);
            console.log(`Absorption cooldown set for ${this.absorbCooldown}s`);
        } catch (error) {
            console.error("Error during ball merge:", error);
        }
    }
    
    // Add helper method for score - makes the Ball class self-contained
    addScore(points) {
        this.score += points;
    }

    // Add this method after the draw methods
    drawDebug(ctx) {
        if (!this.active) return;
        
        // Draw velocity vector
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x + this.velocityX * 10,
            this.y + this.velocityY * 10
        );
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw boundary circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw center point
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    // Add method to handle absorption cooldown
    updateCooldown(deltaTime) {
        if (this.absorbCooldown > 0) {
            this.absorbCooldown -= deltaTime;
            
            // When cooldown is over, restore color and set canAbsorb to true
            if (this.absorbCooldown <= 0) {
                this.absorbCooldown = 0;
                this.canAbsorb = true;
                // Ensure color is restored
                this.color = this.originalColor;
                console.log(`${this.name || 'Ball'} cooldown expired, can absorb now`);
            } else {
                // Ensure color shows as darkened during cooldown
                this.color = this.darkenedColor;
            }
        }
    }

    // Add this method after checkBoundaryCollisions()
    validatePosition() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const boundaryOffset = GameConfig.BOUNDARY_OFFSET;
        const bottomOffset = boundaryOffset + 50;
        
        // Check for invalid positions
        if (isNaN(this.x) || isNaN(this.y)) {
            console.warn('Invalid ball position detected:', this);
            this.x = canvasWidth / 2;
            this.y = canvasHeight / 2;
            this.velocityX = 0;
            this.velocityY = 0;
            return false;
        }
        
        // Check for stuck balls
        if (this.x - this.radius <= boundaryOffset || 
            this.x + this.radius >= canvasWidth - boundaryOffset ||
            this.y - this.radius <= boundaryOffset ||
            this.y + this.radius >= canvasHeight - bottomOffset) {
            
            // Log the issue
            if(this.deBug){
            console.log('Ball touching boundary:', {
                x: this.x,
                y: this.y,
                radius: this.radius,
                velocity: {x: this.velocityX, y: this.velocityY}
            });
         }
            
            // Add a small impulse if velocity is very low
            const minVelocity = 0.5;
            if (Math.abs(this.velocityX) < minVelocity && Math.abs(this.velocityY) < minVelocity) {
                this.velocityX += (Math.random() - 0.5) * 2;
                this.velocityY += (Math.random() - 0.5) * 2;
            }
        }
        return true;
    }

}
export { Ball };