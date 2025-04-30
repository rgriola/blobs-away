/**
 * GamePhysics handles all physics-related calculations and updates
 * including ball movement, collisions, and particle effects
 */
class GamePhysics {
    /**
     * Initialize the physics system
     * @param {Game} game - Reference to the main game instance
     */
    constructor(game) {
        this.debug = false;

        this.game = game;
        this.width = game.width;
        this.height = game.height;
        this.boundaryOffset = game.boundaryOffset;
        
        // Core physics constants
        this.timeStep = 1/60;           // Fixed timestep (60 FPS)
        this.BASE_VELOCITY = 1.5;         // Normal ball speed (px/frame)
        this.MAX_VELOCITY = 2;          // Speed cap after bounces
        this.MIN_VELOCITY = 1;        // Minimum allowed speed
        this.BOUNCE_MULTIPLIER = 1.05;   // Velocity increase on bounce
        this.VELOCITY_DECAY = 0.97;     // Speed decay rate
    }
    
    /**
     * Main update loop for physics calculations
     * Called every frame from the game loop
     * @param {number} timeStep - Time since last update
     */
    update(timeStep) {
        this.updatePreviousPositions();  // For interpolation
        this.updateBalls(timeStep);      // Move balls
        this.checkCollisions();          // Handle collisions
        this.enforceBoundaries();        // Keep balls in bounds
        this.validateBallPositions();    // Ensure valid states
    }
    
    /**
     * Store previous positions for smooth rendering interpolation
     */
    updatePreviousPositions() {
        for (let ball of this.game.balls) {
            if (ball?.active) {
                ball.prevX = ball.x;
                ball.prevY = ball.y;
            }
        }
    }
    
    /**
     * Update positions of all active balls
     * @param {number} timeStep - Delta time for movement
     */
    
    updateBalls(timeStep) {
        for (let ball of this.game.balls) {
            if (ball.active && typeof ball.update === 'function') {
                // Update absorption cooldown
                if (!this.game.isCountingDown && !ball.canAbsorb) {
                    ball.absorbCooldown -= timeStep;
                    if (ball.absorbCooldown <= 0) {
                        ball.canAbsorb = true;
                        ball.absorbCooldown = 0;
                    }
                }
                this.normalizeVelocity(ball);
                ball.update(timeStep);
                this.handleBoundaryCollision(ball);
            }
        }
    }
    
    /**
     * Normalize ball velocity to maintain consistent speed
     * @param {Ball} ball - Ball to normalize
     */
    normalizeVelocity(ball) {
        const currentVelocity = Math.sqrt(
            ball.velocityX * ball.velocityX + 
            ball.velocityY * ball.velocityY
        );
        
        if (currentVelocity > this.BASE_VELOCITY) {
            // Decay higher velocities back to base
            ball.velocityX *= this.VELOCITY_DECAY;
            ball.velocityY *= this.VELOCITY_DECAY;
        } else if (currentVelocity < this.MIN_VELOCITY) {
            // Speed up if too slow
            const scale = this.BASE_VELOCITY / currentVelocity;
            ball.velocityX *= scale;
            ball.velocityY *= scale;
        }
    }
    
     /**
     * Get a random valid position within game boundaries
     * @param {number} radius - Radius of ball to position
     * @returns {{x: number, y: number}} Random valid position
     */
     getRandomPosition(radius) {
        const bottomOffset = this.boundaryOffset + 50;
        return {
            x: this.boundaryOffset + radius + 
               Math.random() * (this.width - this.boundaryOffset * 2 - radius * 2),
            y: this.boundaryOffset + radius + 
               Math.random() * (this.height - this.boundaryOffset - bottomOffset - radius * 2)
        };
    }

    /**
     * Check and handle collisions between all active balls
     */
    checkCollisions() {
        for (let i = 0; i < this.game.balls.length; i++) {
            const ball1 = this.game.balls[i];
            if (!ball1?.active) continue;
            
            for (let j = i + 1; j < this.game.balls.length; j++) {
                const ball2 = this.game.balls[j];
                if (!ball2?.active) continue;
                
                if (ball1.collidesWith(ball2)) {
                    this.resolveCollision(ball1, ball2);
                    this.game.ui.updateLeaderboard(true);
                }
            }
        }
    }
    
    /**
     * Handle collision between two balls
     * Either absorb smaller ball or bounce off each other
     * @param {Ball} ballA - First colliding ball
     * @param {Ball} ballB - Second colliding ball
     */
    
    resolveCollision(ballA, ballB) {
       if(this.debug){
       console.log("Is Counting Down: ",
            !this.game.isCountingDown,
            " ballA.canAbsord:", 
            ballA.canAbsorb, 
            " ballB.canAbsord: ",
            ballB.canAbsorb
        );
        }

        if (!this.game.isCountingDown && ballA.canAbsorb && ballB.canAbsorb) {
            // Handle absorption based on size
            if (ballA.radius > ballB.radius) {
                this.finalAct(ballA, ballB);
            } else if (ballB.radius > ballA.radius) {
                this.finalAct(ballB, ballA);
            } else {
                console.log("Equal size balls collided");
                // Equal size balls - 50/50 chance remove to watch the balls just bounce. 
                if (Math.random() < 0.5) {
                    this.finalAct(ballA, ballB);
                } else {
                    this.finalAct(ballB, ballA);
                }
            }
        } else {
            this.handleElasticCollision(ballA, ballB);
        }
    }

    // AFTER:
/**
 * Handles final merge action between two balls
 * @param {Ball} ballA - The absorbing ball
 * @param {Ball} ballB - The ball being absorbed
 */
    finalAct(ballA, ballB){
        // Create merge particles scaled with ball size
        const particleCount = Math.floor(ballB.radius * 2);
        for (let i = 0; i < particleCount; i++) {
            const particle = this.game.particlePool.find(p => !p.active);
            if (particle) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 2;
                
                Object.assign(particle, {
                    active: true,
                    x: ballB.x,
                    y: ballB.y,
                    dirX: Math.cos(angle),
                    dirY: Math.sin(angle),
                    speedX: speed,
                    speedY: speed,
                    color: ballB.color,
                    size: 2 + Math.random() * 2,
                    life: 0.5 + Math.random() * 0.5
                });
                particle.maxLife = particle.life;
            }
        }

        // Handle merge and cooldown
        ballA.merge(ballB);
        ballA.canAbsorb = false;
        ballA.absorbCooldown = this.game.absorbCooldownTime;
    }

    /**
     * Handle elastic collision physics between two balls
     * @param {Ball} ballA - First ball in collision
     * @param {Ball} ballB - Second ball in collision
     */
    handleElasticCollision(ballA, ballB) {
        // Calculate collision normal
        const dx = ballB.x - ballA.x;
        const dy = ballB.y - ballA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Prevent division by zero
        if (distance < 0.1) {
            ballB.x += 0.1;
            ballB.y += 0.1;
            return;
        }
        
        // Normalize collision vectors
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate relative velocity
        const relativeVX = ballB.velocityX - ballA.velocityX;
        const relativeVY = ballB.velocityY - ballA.velocityY;
        const velocityNormal = relativeVX * nx + relativeVY * ny;
        
        // Skip if balls are moving apart
        if (velocityNormal > 0) return;
        
        // Calculate collision response
        const restitution = 0.85;
        const j = -(1 + restitution) * velocityNormal;
        const impulseX = j * nx;
        const impulseY = j * ny;
        
        // Apply impulse with velocity limits
        ballA.velocityX = this.limitVelocity(ballA.velocityX - impulseX);
        ballA.velocityY = this.limitVelocity(ballA.velocityY - impulseY);
        ballB.velocityX = this.limitVelocity(ballB.velocityX + impulseX);
        ballB.velocityY = this.limitVelocity(ballB.velocityY + impulseY);
    }
    
    /**
     * Handle collision with boundary walls
     * @param {Ball} ball - Ball to check for boundary collision
     * @returns {boolean} True if collision occurred
     */
    handleBoundaryCollision(ball) {
        const bottomOffset = this.boundaryOffset + 50;
        let bounced = false;

        // Check all boundaries and handle collisions
        if (ball.x + ball.radius > this.width - this.boundaryOffset) {
            ball.x = this.width - this.boundaryOffset - ball.radius;
            ball.velocityX *= -this.BOUNCE_MULTIPLIER;
            bounced = true;
        } else if (ball.x - ball.radius < this.boundaryOffset) {
            ball.x = this.boundaryOffset + ball.radius;
            ball.velocityX *= -this.BOUNCE_MULTIPLIER;
            bounced = true;
        }

        if (ball.y + ball.radius > this.height - bottomOffset) {
            ball.y = this.height - bottomOffset - ball.radius;
            ball.velocityY *= -this.BOUNCE_MULTIPLIER;
            bounced = true;
        } else if (ball.y - ball.radius < this.boundaryOffset) {
            ball.y = this.boundaryOffset + ball.radius;
            ball.velocityY *= -this.BOUNCE_MULTIPLIER;
            bounced = true;
        }

        if (bounced) {
            // Add slight randomness to prevent patterns
            ball.velocityX += (Math.random() - 0.5) * 0.1;
            ball.velocityY += (Math.random() - 0.5) * 0.1;
            
            // Play bounce sound
            const velocity = Math.sqrt(ball.velocityX * ball.velocityX + 
                                    ball.velocityY * ball.velocityY);
            if (velocity > 1.0) {
                this.game.soundManager.play('bounce', 
                    Math.min(0.3 + (ball.radius / 100), 1.0));
            }
        }

        return bounced;
    }
    
    /**
     * Ensure all balls stay within game boundaries
     */
    enforceBoundaries() {
        for (let ball of this.game.balls) {
            if (ball?.active) {
                this.handleBoundaryCollision(ball);
            }
        }
    }
    
    /**
     * Update particle effects physics
     * @param {number} deltaTime - Time since last update
     */
    updateParticles(deltaTime) {
        // 
        if (!this.game.particlePool) return;
        
        for (let particle of this.game.particlePool) {
            if (!particle.active) continue;
            
            particle.life -= deltaTime;
            if (particle.life <= 0) {
                particle.reset();
                continue;
            }
            
            particle.x += particle.dirX * particle.speedX;
            particle.y += particle.dirY * particle.speedY;
            particle.speedX *= 0.99;  // Decay speed
            particle.speedY *= 0.99;
        }
    }

    /**
     * Validate and fix any invalid ball states
     */
    validateBallPositions() {
        for (let ball of this.game.balls) {
            if (!ball?.active) continue;
            
            if (isNaN(ball.x) || isNaN(ball.y)) {
                const pos = this.getRandomPosition(ball.radius);
                ball.x = pos.x;
                ball.y = pos.y;
            }
            
            ball.velocityX = this.limitVelocity(ball.velocityX);
            ball.velocityY = this.limitVelocity(ball.velocityY);
        }
    }
    
    /**
     * Limit velocity to prevent excessive speeds
     * @param {number} velocity - Current velocity component
     * @returns {number} Capped velocity value
     */
    limitVelocity(velocity) {
        if (isNaN(velocity)) return 0;
        return Math.max(Math.min(velocity, this.MAX_VELOCITY), -this.MAX_VELOCITY);
    }
}

export { GamePhysics };