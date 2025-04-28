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
        // Defensively check if balls array exists and has elements
        if (!this.game.balls || !this.game.balls.length) {
            console.warn("No balls to render");
            return;
        }
        
        // Render balls with interpolation for smooth movement
        for (let i = 0; i < this.game.balls.length; i++) {
            const ball = this.game.balls[i];
            if (ball && ball.active) {
                // Calculate interpolated position
                const renderX = ball.prevX + (ball.x - ball.prevX) * interpolation;
                const renderY = ball.prevY + (ball.y - ball.prevY) * interpolation;
                
                // Draw ball at interpolated position
                if (typeof ball.drawAt === 'function') {
                    ball.drawAt(this.ctx, renderX, renderY);
                } else {
                    // Fallback if drawAt not available
                    ball.draw(this.ctx);
                }
            }
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