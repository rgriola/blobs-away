class GamePhysics {
    constructor(game) {
        this.game = game;
        this.width = game.width;
        this.height = game.height;
        this.boundaryOffset = game.boundaryOffset;
        
        // Physics parameters
        this.timeStep = 1/60; // Fixed physics timestep in seconds
    }
    
    // Main physics update function called from the game loop
    update(timeStep) {
        // Store previous positions for all balls (for interpolation)
        this.updatePreviousPositions();
        
        // Update all active balls
        this.updateBalls(timeStep);
        
        // Check for collisions between balls
        this.checkCollisions();
        
        // Add an extra boundary check for all balls to ensure they stay in bounds
        this.enforceBoundaries();
    }
    
    // Store previous positions for interpolation
    updatePreviousPositions() {
        for (let ball of this.game.balls) {
            if (ball && ball.active) {
                ball.prevX = ball.x;
                ball.prevY = ball.y;
            }
        }
    }
    
    // Update all active balls
    updateBalls(timeStep) {
        for (let ball of this.game.balls) {
            if (ball && ball.active && typeof ball.update === 'function') {
                // First update the ball's position
                ball.update(timeStep);
                
                // Then handle boundary collisions
                this.handleBoundaryCollision(ball);
            }
        }
    }
    
    // Check for collisions between all active balls
    checkCollisions() {
        for (let i = 0; i < this.game.balls.length; i++) {
            // called in update()
            const ball1 = this.game.balls[i];
            
            if (!ball1 || !ball1.active) continue;
            
            for (let j = i + 1; j < this.game.balls.length; j++) {
                const ball2 = this.game.balls[j];
                if (!ball2 || !ball2.active) continue;
                
                if (ball1.collidesWith(ball2)) {
                    // Handle collision
                    this.resolveCollision(ball1, ball2);
                    // Update leaderboard after collision
                    this.game.ui.updateLeaderboard(true);
                }
            }
        }
    }
    
    // Handle collision between two balls
    resolveCollision(ball1, ball2) {
        // Determine which ball is larger
        let winner, loser;
        
        if (ball1.radius > ball2.radius) {
            winner = ball1;
            loser = ball2;
        } else if (ball2.radius > ball1.radius) {
            winner = ball2;
            loser = ball1;
        } else {
            // Same size - random winner
            winner = Math.random() < 0.5 ? ball1 : ball2;
            loser = winner === ball1 ? ball2 : ball1;
        }
        
        // Add merge animation at loser position
        this.game.addMergeAnimation(loser.x, loser.y, loser.color, loser.radius);
        
        // Handle player absorption (manages score, merging, sound, and UI updates)
        this.game.handlePlayerAbsorption(winner, loser);
    }
    
    // Check if coordinates are within game boundary
    isWithinBoundary(x, y, radius) {
        const bottomOffset = this.boundaryOffset + 50; // Extra 50px for bottom boundary
        return x - radius >= this.boundaryOffset && 
               x + radius <= this.width - this.boundaryOffset &&
               y - radius >= this.boundaryOffset &&
               y + radius <= this.height - bottomOffset;
    }
    
    // Find random position within boundary
    getRandomPosition(radius) {
        const bottomOffset = this.boundaryOffset + 50; // Extra 50px for bottom boundary
        
        return {
            x: this.boundaryOffset + radius + Math.random() * (this.width - this.boundaryOffset * 2 - radius * 2),
            y: this.boundaryOffset + radius + Math.random() * (this.height - this.boundaryOffset - bottomOffset - radius * 2)
        };
    }
    
    // Modify your handleBoundaryCollision method to play a sound
    handleBoundaryCollision(ball) {
        const bottomOffset = this.boundaryOffset + 50; // Extra 50px for bottom boundary
        let bounced = false;
        
        // Right boundary
        if (ball.x + ball.radius > this.width - this.boundaryOffset) {
            ball.x = this.width - this.boundaryOffset - ball.radius;
            ball.velocityX *= -1;
            bounced = true;
        }
        // Left boundary
        else if (ball.x - ball.radius < this.boundaryOffset) {
            ball.x = this.boundaryOffset + ball.radius;
            ball.velocityX *= -1;
            bounced = true;
        }
        
        // Bottom boundary
        if (ball.y + ball.radius > this.height - bottomOffset) {
            ball.y = this.height - bottomOffset - ball.radius;
            ball.velocityY *= -1;
            bounced = true;
        }
        // Top boundary
        else if (ball.y - ball.radius < this.boundaryOffset) {
            ball.y = this.boundaryOffset + ball.radius;
            ball.velocityY *= -1;
            bounced = true;
        }
        
        // Play bounce sound on collision
        if (bounced) {
            // Play sound, but only sometimes to avoid sound spam
            // Only play for larger balls or at a reduced rate
            if (ball.radius > 25 || Math.random() < 0.1) {
                this.game.soundManager.play('bounce');
            }
        }
        
        return bounced;
    }
    
    // Add this new method to double check all balls are within boundaries
    enforceBoundaries() {
        for (let ball of this.game.balls) {
            if (ball && ball.active) {
                this.handleBoundaryCollision(ball);
            }
        }
    }
    
    // Update particles (physics part)
    updateParticles(deltaTime) {
        if (!this.game.particlePool) return;
        
        for (let particle of this.game.particlePool) {
            if (!particle.active) continue;
            // Update life
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                particle.reset();
                continue;
            }
            
            // Update position
            particle.x += particle.dirX * particle.speedX;
            particle.y += particle.dirY * particle.speedY;
            
            // Slow down
            particle.speedX *= 0.99;
            particle.speedY *= 0.99;
        }
    }
}
export { GamePhysics };