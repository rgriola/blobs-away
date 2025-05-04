/**
 * GamePhysics handles all physics-related calculations and updates
 * including ball movement, collisions, and particle effects
 */
import { GameConfig } from './GameConfig.js';

class GamePhysics {
    /**
     * Initialize the physics system
     * @param {Game} game - Reference to the main game instance
     */
    constructor(game) {
        this.debug = GameConfig.DEBUG_MODE;
        this.game = game;
        this.width = game.width;
        this.height = game.height;
        this.boundaryOffset = game.boundaryOffset;
        this.boardManager = game.boardManager;
        this.obstacleManager = game.obstacleManager;
        this.enabled = false;

        // Core physics constants
        this.timeStep = GameConfig.TIMESTEP;
        this.BASE_VELOCITY = 1.5;         // Normal ball speed (px/frame)
        this.MAX_VELOCITY = 2;          // Speed cap after bounces
        this.MIN_VELOCITY = 1;        // Minimum allowed speed
        this.BOUNCE_MULTIPLIER = 1.05;   // Velocity increase on bounce
        this.VELOCITY_DECAY = 0.97;     // Speed decay rate
        this.PARTICLE_SPEED = 100;
    }
    
    /**
     * Main update loop for physics calculations
     * Called every frame from the game loop
     * @param {number} timeStep - Time since last update
     */
    update(timeStep) {
        if (!this.enabled) return;

        this.updatePreviousPositions();  // For interpolation
        this.updateBalls(timeStep);      // Move balls
        this.checkCollisions(timeStep);  // Handle collisions
        this.enforceBoundaries();        // Keep balls in bounds
        this.validateBallPositions();    // Ensure valid states
        this.updateParticles(timeStep);  // Update particles
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
        if (this.boardManager) {
            return this.boardManager.getRandomPosition(radius);
        } else {
            // Fallback to original method
            const bottomOffset = this.boundaryOffset + 50;
            return {
                x: this.boundaryOffset + radius + 
                    Math.random() * (this.width - this.boundaryOffset * 2 - radius * 2),
                y: this.boundaryOffset + radius + 
                    Math.random() * (this.height - this.boundaryOffset - bottomOffset - radius * 2)
            };
        }
    }

    /**
     * Check and handle collisions between all active balls
     * @param {number} timeStep - Time since last update
     */
    checkCollisions(timeStep) {
        const balls = this.game.balls;
        let collisionsDetected = false;

        // Check each pair of balls for collision
        for (let i = 0; i < balls.length; i++) {
            const ballA = balls[i];
            if (!ballA.active) continue;

            for (let j = i + 1; j < balls.length; j++) {
                const ballB = balls[j];
                if (!ballB.active) continue;

                // Check for collision
                const dx = ballB.x - ballA.x;
                const dy = ballB.y - ballA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Detect and resolve collision
                if (distance < ballA.radius + ballB.radius) {
                    collisionsDetected = true;
                    this.resolveCollision(ballA, ballB);
                }
            }
        }
        
        // Output collision debug info occasionally
        if (this.debug && collisionsDetected && Math.random() < 0.05) {
            console.log(`Collisions detected, game state: started=${this.game.gameStarted}, countdown=${this.game.countdownComplete}`);
            console.log(`Active balls: ${balls.filter(b => b.active).length}`);
        }
    }
    
    /**
     * Handle collision between two balls
     * Either absorb smaller ball or bounce off each other
     * @param {Ball} ballA - First colliding ball
     * @param {Ball} ballB - Second colliding ball
     */
    resolveCollision(ballA, ballB) {
        if (!ballA.canAbsorb && !ballB.canAbsorb) {
            // If neither ball can absorb, proceed with elastic collision
            this.elasticCollision(ballA, ballB);
            return;
        }
        
        // Simple size comparison
        if (ballA.radius > ballB.radius && ballA.canAbsorb) {
            // BallA is larger - it absorbs BallB
            console.log(`${ballA.name || 'Ball A'} is larger and absorbing ${ballB.name || 'Ball B'}`);
            this.absorbBall(ballA, ballB);
            return;
        }
        
        if (ballB.radius > ballA.radius && ballB.canAbsorb) {
            // BallB is larger - it absorbs BallA
            console.log(`${ballB.name || 'Ball B'} is larger and absorbing ${ballA.name || 'Ball A'}`);
            this.absorbBall(ballB, ballA);
            return;
        }
        
        // Equal size case - both can absorb
        if (ballA.radius === ballB.radius && ballA.canAbsorb && ballB.canAbsorb) {
            // 50/50 chance for either ball
            if (Math.random() < 0.5) {
                console.log(`Equal sized balls - random chance gave ${ballA.name || 'Ball A'} the win!`);
                this.absorbBall(ballA, ballB);
            } else {
                console.log(`Equal sized balls - random chance gave ${ballB.name || 'Ball B'} the win!`);
                this.absorbBall(ballB, ballA);
            }
            return;
        }
        
        // If we get here, neither ball can absorb the other despite their sizes, due to cooldown
        this.elasticCollision(ballA, ballB);
    }

    /**
     * Check if one ball can absorb another
     * @param {Ball} absorber - The potentially absorbing ball
     * @param {Ball} target - The potentially absorbed ball
     * @returns {boolean} True if absorption can occur
     */
    canAbsorb(absorber, target) {
        // Check if both balls are active
        if (!absorber.active || !target.active) return false;
        
        // Check if game has started and countdown is complete
        if (!this.game.gameStarted || !this.game.countdownComplete) {
            console.log('Game state preventing absorption:', {
                gameStarted: this.game.gameStarted,
                countdownComplete: this.game.countdownComplete
            });
            return false;
        }
        
        // First check if absorber can absorb at all (not in cooldown)
        if (!absorber.canAbsorb) {
            console.log(`${absorber.name || 'Ball'} cannot absorb (in cooldown)`);
            return false;
        }
        
        // Simplified rule: 
        // 1. If absorber is larger, it can absorb target
        // 2. If balls are exactly the same size, each has a 50% chance to absorb the other
        
        // Case 1: Absorber is larger
        if (absorber.radius > target.radius) {
            console.log(`${absorber.name || 'Ball'} is larger and can absorb ${target.name || 'Ball'}`);
            return true;
        }
        
        // Case 2: Equal sized balls (exactly the same size)
        if (absorber.radius === target.radius) {
            // Special case: handle in resolveCollision to avoid both balls trying to absorb each other
            // Return true to indicate potential absorption (will be handled in resolveCollision)
            console.log(`Equal sized balls - will randomly decide absorption in resolveCollision`);
            return true;
        }
        
        // Case 3: Absorber is smaller than target
        console.log(`${absorber.name || 'Ball'} is smaller than ${target.name || 'Ball'} and cannot absorb it`);
        return false;
    }

    /**
     * Perform absorption of one ball by another
     * @param {Ball} absorber - Ball doing the absorbing
     * @param {Ball} absorbed - Ball being absorbed
     */
    absorbBall(absorber, absorbed) {
        if (this.debug) {
            console.log(`${absorber.name || 'Unnamed ball'} absorbing ${absorbed.name || 'Unnamed ball'}`);
        }
        
        // Calculate new radius based on volume addition
        const absorberArea = Math.PI * absorber.radius * absorber.radius;
        const absorbedArea = Math.PI * absorbed.radius * absorbed.radius;
        const combinedArea = absorberArea + absorbedArea * 0.8; // Only add 80% of area
        const newRadius = Math.sqrt(combinedArea / Math.PI);

        // Update absorber radius
        absorber.radius = newRadius;

        // Apply cooldown to the absorber
        absorber.canAbsorb = false;
        absorber.absorbCooldown = this.game.absorbCooldownTime;

        // Add explosion particles for visual effect
        this.createExplosion(absorbed.x, absorbed.y, absorbed.color, absorbed.radius);

        // Handle scoring and ball merging through the game
        this.game.handlePlayerAbsorption(absorber, absorbed);
    }

    /**
     * Perform elastic collision between balls
     * @param {Ball} ballA - First ball
     * @param {Ball} ballB - Second ball
     */
    elasticCollision(ballA, ballB) {
        // Calculate collision normal
        const dx = ballB.x - ballA.x;
        const dy = ballB.y - ballA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Ensure we don't divide by zero
        if (distance === 0) return;

        // Normalize the collision normal
        const nx = dx / distance;
        const ny = dy / distance;

        // Calculate relative velocity
        const dvx = ballB.velocityX - ballA.velocityX;
        const dvy = ballB.velocityY - ballA.velocityY;

        // Calculate relative velocity along normal
        const dvDotN = dvx * nx + dvy * ny;

        // Skip if balls are moving away from each other
        if (dvDotN > 0) return;

        // Calculate restitution (bounciness)
        const restitution = this.BOUNCE_MULTIPLIER;

        // Calculate impulse scalar
        const impulseScalar = -(1 + restitution) * dvDotN / 2;

        // Apply impulse
        ballA.velocityX -= impulseScalar * nx;
        ballA.velocityY -= impulseScalar * ny;
        ballB.velocityX += impulseScalar * nx;
        ballB.velocityY += impulseScalar * ny;

        // Prevent overlap by moving balls apart
        const overlap = ballA.radius + ballB.radius - distance;
        if (overlap > 0) {
            // Move balls apart proportionally to their sizes
            const totalRadius = ballA.radius + ballB.radius;
            const moveA = overlap * (ballB.radius / totalRadius);
            const moveB = overlap * (ballA.radius / totalRadius);

            ballA.x -= nx * moveA;
            ballA.y -= ny * moveA;
            ballB.x += nx * moveB;
            ballB.y += ny * moveB;
        }

        // Play bounce sound
        this.game.soundManager.play('bounce');
    }

    /**
     * Handle collision with boundary walls
     * @param {Ball} ball - Ball to check for boundary collision
     * @returns {boolean} True if collision occurred
     */
    handleBoundaryCollision(ball) {
        if (this.boardManager) {
            // Use the BoardManager for boundary collision handling
            const bounced = this.boardManager.handleBoundaryCollision(ball, this.BOUNCE_MULTIPLIER);

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

                return true;
            }
            return false;
        } else {
            // Fallback to original code if BoardManager not available
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
        if (!this.game.particlePool) return;

        this.game.particlePool.forEach(particle => {
            if (!particle.active) return;

            // Update position
            particle.x += particle.speedX * deltaTime;
            particle.y += particle.speedY * deltaTime;

            // Apply drag and gravity
            particle.speedX *= 0.95;
            particle.speedY *= 0.95;
            particle.speedY += 50 * deltaTime; // Gravity

            // Update lifetime
            particle.life -= deltaTime;
            if (particle.life <= 0) {
                particle.reset();
            }
        });
    }

    /**
     * Create particle explosion effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Color of particles
     * @param {number} size - Size of explosion
     */
    createExplosion(x, y, color, size) {
        // Create particles proportional to size of absorption
        const particleCount = Math.floor(size * 2);

        for (let i = 0; i < particleCount; i++) {
            // Find an inactive particle
            const particle = this.game.particlePool.find(p => !p.active);
            if (!particle) continue;

            // Calculate random angle and speed
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;

            // Set particle properties
            particle.active = true;
            particle.x = x;
            particle.y = y;
            particle.speedX = Math.cos(angle) * speed * this.PARTICLE_SPEED;
            particle.speedY = Math.sin(angle) * speed * this.PARTICLE_SPEED;
            particle.size = Math.random() * 
                (GameConfig.PARTICLE_MAX_SIZE - GameConfig.PARTICLE_MIN_SIZE) + 
                GameConfig.PARTICLE_MIN_SIZE;
            particle.color = color;
            particle.life = Math.random() * 
                (GameConfig.PARTICLE_MAX_LIFE - GameConfig.PARTICLE_MIN_LIFE) + 
                GameConfig.PARTICLE_MIN_LIFE;
            particle.maxLife = particle.life;
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