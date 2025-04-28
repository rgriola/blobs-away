import { Ball } from './ball.js';

class Bot extends Ball {
    constructor(x, y, radius, color, canvas) {
        super(x, y, radius, color, canvas);
        this.isHuman = false;
        this.decisionCooldown = 0;
        this.score = 0; // Initialize score
        
        // Generate name based on color
        this.name = this.generateNameFromColor(color) + " Bot";
        
        this.setRandomDirection();
    }
    
    // Add the score method for bots
    addScore(points) {
        this.score += points;
    }

    generateNameFromColor(hexColor) {
        // Map of hex colors to color names (20 colors)
        const colorNames = {
            // Original colors
            '#FF6B6B': 'Red',
            '#4ECDC4': 'Teal',
            '#FFE66D': 'Yellow',
            '#1A535C': 'Forest',
            '#FF9F1C': 'Orange',
            '#7B68EE': 'Purple',
            '#20BF55': 'Lime',
            '#EF476F': 'Pink',
            '#118AB2': 'Blue',
            '#06D6A0': 'Mint',
            '#800000': 'Maroon',
            '#9932CC': 'Orchid',
            '#FF8C00': 'Tangerine',
            '#008080': 'Turquoise',
            '#4B0082': 'Indigo',
            '#FF1493': 'Magenta',
            '#FFD700': 'Gold',
            '#00CED1': 'Cyan',
            '#8B4513': 'Brown',
            '#2E8B57': 'Emerald'
        };
        
        // Return the name from the map or use a fallback based on hex value
        if (colorNames[hexColor]) {
            return colorNames[hexColor];
        } else {
            // Extract RGB components for an alternative name
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            
            // Determine a general color category based on RGB values
            if (r > 200 && g < 100 && b < 100) return "Red";
            if (r < 100 && g > 200 && b < 100) return "Green";
            if (r < 100 && g < 100 && b > 200) return "Blue";
            if (r > 200 && g > 200 && b < 100) return "Yellow";
            if (r > 200 && g < 100 && b > 200) return "Purple";
            
            return "Mystery"; // Fallback
        }
    }

    update(players) {
        if (!this.active) return;
        
        // Occasionally change direction randomly
        this.decisionCooldown--;
        if (this.decisionCooldown <= 0) {
            // Random direction change
            if (Math.random() < 0.05) {
                this.setRandomDirection();
            }
            
            // Reset cooldown
            this.decisionCooldown = Math.floor(Math.random() * 60) + 30;
        }
        
        super.update();
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw bot name above the ball
        if (this.active) {
            ctx.font = Math.max(10, Math.min(14, this.radius / 2.5)) + "px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            
            // Add text shadow for better visibility
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeText(this.name, this.x, this.y - this.radius - 10);
            ctx.fillText(this.name, this.x, this.y - this.radius - 10);
        }
    }
}

export { Bot };