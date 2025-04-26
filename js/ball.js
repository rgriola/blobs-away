// Add this helper function at the top of the file, outside the class
function lightenColor(hexColor, percent) {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Lighten
    const lightenedR = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    const lightenedG = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    const lightenedB = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
    
    // Convert back to hex
    return '#' + 
        lightenedR.toString(16).padStart(2, '0') +
        lightenedG.toString(16).padStart(2, '0') +
        lightenedB.toString(16).padStart(2, '0');
}

class Ball {
    constructor(x, y, radius, color, canvas) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 2; // pixels per second
        this.active = true;
        this.name = ""; // Default empty name
        this.canvas = canvas; // Store reference to canvas
    }

    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.velocityX = Math.cos(angle);
        this.velocityY = Math.sin(angle);
    }

    draw(ctx) {
        if (!this.active) return;
        
        // Save current context state
        ctx.save();
        
        // Create the ball with gradient
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Create gradient
        const gradient = ctx.createRadialGradient(
            this.x - this.radius/3, this.y - this.radius/3, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, lightenColor(this.color, 50));
        gradient.addColorStop(1, this.color);
        
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
        
        // Restore context state before text rendering
        ctx.restore();
        
        // Draw name if exists (base implementation, overridden in subclasses)
        if (this.name) {
            ctx.font = Math.max(10, Math.min(14, this.radius / 2.5)) + "px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            
            // Add text shadow for better visibility
            ctx.shadowColor = "black";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillText(this.name, this.x, this.y - this.radius - 10);
            
            // Reset shadows after drawing text
            ctx.shadowColor = "transparent";
        }
    }

    update(speedMultiplier = 1) {
        // Apply speedMultiplier to all movement calculations
        this.x += this.velocityX * speedMultiplier;
        this.y += this.velocityY * speedMultiplier;
        
        // Apply friction with proper time scaling
        if (this.friction) {
            this.velocityX *= Math.pow(this.friction, speedMultiplier);
            this.velocityY *= Math.pow(this.friction, speedMultiplier);
        }
        
        // Fix: Call checkBoundaryCollisions instead of handleBoundaryCollision
        this.checkBoundaryCollisions();
    }

    checkBoundaryCollisions() {
        // Use canvas dimensions instead of hardcoded values
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const boundaryOffset = 100;
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
        // Calculate the new size based on area
        const thisArea = Math.PI * this.radius * this.radius;
        const otherArea = Math.PI * otherBall.radius * otherBall.radius;
        const combinedArea = thisArea + otherArea;
        
        this.radius = Math.sqrt(combinedArea / Math.PI);
        
        // Adjust speed as ball gets larger
        this.speed = Math.max(1, 2 - (this.radius - 15) / 30);
    }
}