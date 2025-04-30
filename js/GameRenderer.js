class GameRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.width = game.width;
        this.height = game.height;
        this.boundaryOffset = game.boundaryOffset;
    }

    // Clear the canvas
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // Draw the boundary
    drawBoundary() {
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

    // Render all game objects with interpolation
    render(interpolation) {
             // Clear the entire canvas first
             this.clear();
        
             // Draw game boundary
             this.drawBoundary();
        
         // Draw all active balls with interpolation
         for (const ball of this.game.balls) {
            if (ball && ball.active) {
                // Use ball's own drawAt method instead of drawBall
                const x = ball.prevX + (ball.x - ball.prevX) * interpolation;
                const y = ball.prevY + (ball.y - ball.prevY) * interpolation;
                ball.drawAt(this.ctx, x, y);
            }
        }
        
           // Draw particles if any
           if (this.game.particleManager) {
            this.renderParticles();
        }
    }


    // Render static scene (used during countdown)
    renderStatic() {
        // Defensively check if balls array exists
        if (!this.game.balls || !this.game.balls.length) {
            console.warn("No balls to render");
            return;
        }
        
        for (let i = 0; i < this.game.balls.length; i++) {
            const ball = this.game.balls[i];
            if (ball && ball.active) {
                ball.draw(this.ctx);
            }
        }
    }

    // Render particles
    renderParticles() {
        // Defensively check if particlePool exists
        if (!this.game.particlePool) {
            console.warn("Particle pool is undefined");
            return;
        }
        
        for (let i = 0; i < this.game.particlePool.length; i++) {
            const particle = this.game.particlePool[i];
            if (particle && particle.active) {
                // Calculate opacity based on remaining life
                const opacity = particle.life / particle.maxLife;
                
                this.ctx.globalAlpha = opacity;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Reset global alpha
        this.ctx.globalAlpha = 1;
    }
}

export { GameRenderer };