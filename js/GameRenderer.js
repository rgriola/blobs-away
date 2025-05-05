class GameRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.width = game.width;
        this.height = game.height;
        this.boundaryOffset = game.boundaryOffset;
        this.boardManager = game.boardManager;
        this.obstacleManager = game.obstacleManager;
    }

    // Clear the canvas
    clear() {
        // Draw a stylish gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(1, '#2a5298');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draw the boundary using BoardManager
    // thhis is initialized in the game constructor
    // and is used to draw the game boundary
    drawBoundary() {
        if (this.boardManager) {
            this.boardManager.drawBoundary(this.ctx);
        } else {
            // Fallback to original rectangular boundary if no BoardManager
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.boundaryOffset, this.boundaryOffset);
            this.ctx.lineTo(this.width - this.boundaryOffset, this.boundaryOffset);
            this.ctx.lineTo(this.width - this.boundaryOffset, this.height - this.boundaryOffset - 50);
            this.ctx.lineTo(this.boundaryOffset, this.height - this.boundaryOffset - 50);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    // Render all game objects with interpolation
    render(interpolation) {
        // Clear the entire canvas first
        this.clear();
        
        // Draw game boundary
        this.drawBoundary();
        
        // Render balls
        this.renderBalls(interpolation);
        
        // Draw particles if any
        if (this.game.particleManager) {
            this.renderParticles();
        }
    }

    // Render static scene (used during countdown)
    renderStatic() {
        // Used for rendering balls without interpolation
        this.game.balls.forEach(ball => {
            if (ball.active) {
                ball.draw(this.ctx);
            }
        });
    }

    // Render balls with interpolation
    renderBalls(interpolation) {
        // Render all balls with interpolation for smooth movement
        this.game.balls.forEach(ball => {
            if (!ball.active) return;
            
            // Calculate interpolated position
            const x = ball.prevX + (ball.x - ball.prevX) * interpolation;
            const y = ball.prevY + (ball.y - ball.prevY) * interpolation;
            
            // Render at interpolated position
            ball.drawAt(this.ctx, x, y);
        });
    }

    // Render particles
    renderParticles() {
        // Render active particles
        this.game.particlePool.forEach(particle => {
            if (!particle.active) return;
            
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(
                particle.x - particle.size / 2, 
                particle.y - particle.size / 2, 
                particle.size, 
                particle.size
            );
        });
        
        // Reset alpha
        this.ctx.globalAlpha = 1;
    }
}

export { GameRenderer };