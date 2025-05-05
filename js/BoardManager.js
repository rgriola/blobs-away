/**
 * BoardManager.js
 * Manages different board shapes and boundary logic for Blobs Away
 */
import { GameConfig } from './GameConfig.js';

export class BoardManager {
    /**
     * Initialize the board manager
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} boardType - Type of board (rectangle, circle, oval)
     * @param {ObstacleManager} obstacleManager - Optional obstacle manager
     */
    constructor(width, height, boardType = GameConfig.DEFAULT_BOARD_TYPE, obstacleManager = null) {
        this.width = width;
        this.height = height;
        this.boardType = boardType;
        this.boundaryOffset = GameConfig.BOUNDARY_OFFSET;
        this.settings = GameConfig.BOARD_SETTINGS[boardType] || GameConfig.BOARD_SETTINGS.rectangle;
        this.obstacleManager = obstacleManager;
        
        // Center points for circular and oval boards
        this.centerX = width / 2;
        this.centerY = height / 2;
    }

    /**
     * Set the obstacle manager for this board
     * @param {ObstacleManager} obstacleManager - The obstacle manager to use
     */
    setObstacleManager(obstacleManager) {
        this.obstacleManager = obstacleManager;
        }

    /**
     * Draw the boundary based on board type
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawBoundary(ctx) {
        // this draws the boundary graphic 
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        
        switch (this.boardType) {
            case GameConfig.BOARD_TYPES.CIRCLE:
                //this.drawCircleBoundary(ctx);
                this.drawOvalBoundary(ctx);
                break;
            case GameConfig.BOARD_TYPES.OVAL:
                this.drawOvalBoundary(ctx);
                break;
            case GameConfig.BOARD_TYPES.RECTANGLE:
            default:
                this.drawRectangleBoundary(ctx);
                break;
            }
        
        // Draw obstacles if we have an obstacle manager
        if (this.obstacleManager) {
            this.obstacleManager.drawObstacles(ctx);
            }
    }
    
    /**
     * Draw a rectangular boundary
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawRectangleBoundary(ctx) {
        const offset = this.boundaryOffset;
        const bottomOffset = offset + this.settings.bottomExtraOffset;
        
        ctx.beginPath();
        ctx.moveTo(offset, offset);
        ctx.lineTo(this.width - offset, offset);
        ctx.lineTo(this.width - offset, this.height - bottomOffset);
        ctx.lineTo(offset, this.height - bottomOffset);
        ctx.closePath();
        ctx.stroke();
    }
    
    /**
     * Draw a circular boundary
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawCircleBoundary(ctx) {
        const radius = this.settings.radius;
        
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    /**
     * Draw an oval boundary
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawOvalBoundary(ctx) {
        const radiusX = this.settings.radiusX;
        const radiusY = this.settings.radiusY;
        
        ctx.beginPath();
        ctx.ellipse(this.centerX, this.centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    /**
     * Check if a ball is colliding with any boundary
     * @param {Ball} ball - Ball to check for boundary collision
     * @returns {boolean} True if collision occurred
     */
    isCollidingWithBoundary(ball) {
        // Sets the Type of Boundry based on the parameters 
        let boundaryCollision = false;
        
        switch (this.boardType) {
            case GameConfig.BOARD_TYPES.CIRCLE:
                //boundaryCollision = this.isCollidingWithCircle(ball);
                boundaryCollision = this.isCollidingWithOval(ball);
                break;
            case GameConfig.BOARD_TYPES.OVAL:
                boundaryCollision = this.isCollidingWithOval(ball);
                break;
            case GameConfig.BOARD_TYPES.RECTANGLE:
            default:
                boundaryCollision = this.isCollidingWithRectangle(ball);
                break;
        }
        
        // Check obstacle collision if we have an obstacle manager
        if (this.obstacleManager && !boundaryCollision) {
            return this.obstacleManager.isCollidingWithObstacles(ball);
        }
        
        return boundaryCollision;
    }
    
    /**
     * Check for collision with rectangular boundary
     * @param {Ball} ball - Ball to check
     * @returns {boolean} True if collision occurred
     */
    isCollidingWithRectangle(ball) {
        const offset = this.boundaryOffset;
        const bottomOffset = offset + this.settings.bottomExtraOffset;
        
        return ball.x - ball.radius < offset ||
               ball.x + ball.radius > this.width - offset ||
               ball.y - ball.radius < offset ||
               ball.y + ball.radius > this.height - bottomOffset;
    }
    
    /**
     * Check for collision with circular boundary
     * @param {Ball} ball - Ball to check
     * @returns {boolean} True if collision occurred 
     */
    isCollidingWithCircle(ball) {
        const dx = ball.x - this.centerX;
        const dy = ball.y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance + ball.radius > this.settings.radius;
    }
       
    /**
     * Check for collision with oval boundary
     * @param {Ball} ball - Ball to check
     * @returns {boolean} True if collision occurred
     */
    isCollidingWithOval(ball) {
        const dx = ball.x - this.centerX;
        const dy = ball.y - this.centerY;
        
        // Scale the coordinates
        const radiusX = this.settings.radiusX;
        const radiusY = this.settings.radiusY;
        const scaledX = dx / radiusX;
        const scaledY = dy / radiusY;
        
        // Calculate the distance in the scaled space
        const scaledDistance = Math.sqrt(scaledX * scaledX + scaledY * scaledY);
        
        if (scaledDistance <= 0) {
            return false; // Ball is at center, no collision
        }
        
        // Calculate the direction vector to get the effective radius in that direction
        const nx = scaledX / scaledDistance;
        const ny = scaledY / scaledDistance;
        
        // Convert back to world space to get the actual direction vector
        const worldNx = nx * radiusX;
        const worldNy = ny * radiusY;
        
        // Get the length of this vector to normalize it properly
        const worldLength = Math.sqrt(worldNx * worldNx + worldNy * worldNy);
        
        // Calculate the effective radius in the direction of travel
        // This accounts for the oval's curvature in the specific direction
        const effectiveRadius = ball.radius / worldLength;
        
        // Check if we're colliding
        return scaledDistance + effectiveRadius > 1.0;
    }


    //// Handles the actual ball reactions. 
    /**
     * Handle collision with boundary, update ball position and velocity
     * @param {Ball} ball - Ball that collided with boundary
     * @param {number} bounceMultiplier - Multiplier for bounce velocity
     * @returns {boolean} True if collision was handled
     */
    handleBoundaryCollision(ball, bounceMultiplier = 1.05) {
        // First try handling obstacle collision if we have an obstacle manager
        if (this.obstacleManager && this.obstacleManager.handleObstacleCollision(ball, bounceMultiplier)) {
            return true;
            }
        
        // Then handle the basic board boundary if no obstacle collision
        switch (this.boardType) {
            case GameConfig.BOARD_TYPES.CIRCLE:
                //return this.handleCircleCollision(ball, bounceMultiplier);
                return this.handleOvalCollision(ball, bounceMultiplier);
            case GameConfig.BOARD_TYPES.OVAL:
                return this.handleOvalCollision(ball, bounceMultiplier);
            case GameConfig.BOARD_TYPES.RECTANGLE:
            default:
                return this.handleRectangleCollision(ball, bounceMultiplier);
            }
        }
    
    /**
     * Handle collision with rectangular boundary
     * @param {Ball} ball - Ball to handle
     * @param {number} bounceMultiplier - Multiplier for bounce velocity
     * @returns {boolean} True if collision was handled
     */
    handleRectangleCollision(ball, bounceMultiplier) {
        const offset = this.boundaryOffset;
        const bottomOffset = offset + this.settings.bottomExtraOffset;
        let bounced = false;
        
        // Left boundary
        if (ball.x - ball.radius < offset) {
            ball.x = offset + ball.radius;
            ball.velocityX *= -bounceMultiplier;
            bounced = true;
        } 
        // Right boundary
        else if (ball.x + ball.radius > this.width - offset) {
            ball.x = this.width - offset - ball.radius;
            ball.velocityX *= -bounceMultiplier;
            bounced = true;
        }
        
        // Top boundary
        if (ball.y - ball.radius < offset) {
            ball.y = offset + ball.radius;
            ball.velocityY *= -bounceMultiplier;
            bounced = true;
        } 
        // Bottom boundary
        else if (ball.y + ball.radius > this.height - bottomOffset) {
            ball.y = this.height - bottomOffset - ball.radius;
            ball.velocityY *= -bounceMultiplier;
            bounced = true;
        }
        
        return bounced;
    }
    
    /**
     * Handle collision with circular boundary
     * @param {Ball} ball - Ball to handle
     * @param {number} bounceMultiplier - Multiplier for bounce velocity
     * @returns {boolean} True if collision was handled
     */
    handleCircleCollision(ball, bounceMultiplier) {
        const dx = ball.x - this.centerX;
        const dy = ball.y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = this.settings.radius;
        
        if (distance + ball.radius > radius) {
            // Calculate the normal vector from center to ball
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Move ball back to boundary
            const penetration = (distance + ball.radius) - radius;
            ball.x -= nx * penetration;
            ball.y -= ny * penetration;
            
            // Calculate dot product of velocity with normal
            const dotProduct = ball.velocityX * nx + ball.velocityY * ny;
            
            // Reflect velocity around the normal
            ball.velocityX = (ball.velocityX - 2 * dotProduct * nx) * bounceMultiplier;
            ball.velocityY = (ball.velocityY - 2 * dotProduct * ny) * bounceMultiplier;
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle collision with oval boundary
     * @param {Ball} ball - Ball to handle
     * @param {number} bounceMultiplier - Multiplier for bounce velocity
     * @returns {boolean} True if collision was handled
     */
    handleOvalCollision(ball, bounceMultiplier) {
        const dx = ball.x - this.centerX;
        const dy = ball.y - this.centerY;
        
        // Scale the coordinates
        const radiusX = this.settings.radiusX;
        const radiusY = this.settings.radiusY;
        const scaledX = dx / radiusX;
        const scaledY = dy / radiusY;
        
        // Calculate the distance in the scaled space
        const scaledDistance = Math.sqrt(scaledX * scaledX + scaledY * scaledY);
        
        if (scaledDistance <= 0) {
            return false; // Ball is at center, no collision
        }
        
        // Calculate the normalized direction in scaled space
        const nx = scaledX / scaledDistance;
        const ny = scaledY / scaledDistance;
        
        // Convert back to world space to get the proper normal vector
        const worldNx = nx * radiusX;
        const worldNy = ny * radiusY;
        
        // Get the length of this vector to normalize it properly
        const worldLength = Math.sqrt(worldNx * worldNx + worldNy * worldNy);
        const normalizedNx = worldNx / worldLength;
        const normalizedNy = worldNy / worldLength;
        
        // Calculate the effective radius in the collision direction
        const effectiveRadius = ball.radius / worldLength;
        
        // Check if we're colliding
        if (scaledDistance + effectiveRadius > 1.0) {
            // Calculate penetration depth
            const penetrationDepth = ((scaledDistance + effectiveRadius) - 1.0) * worldLength;
            
            // Move ball back to boundary
            ball.x -= normalizedNx * penetrationDepth;
            ball.y -= normalizedNy * penetrationDepth;
            
            // Calculate dot product of velocity with normal
            const dotProduct = ball.velocityX * normalizedNx + ball.velocityY * normalizedNy;
            
            // Reflect velocity around the normal
            ball.velocityX = (ball.velocityX - 2 * dotProduct * normalizedNx) * bounceMultiplier;
            ball.velocityY = (ball.velocityY - 2 * dotProduct * normalizedNy) * bounceMultiplier;
            
            return true;
        }
        
        return false;
    }

    /**
     * Get a random valid position within the game boundaries
     * @param {number} radius - Radius of the ball to position
     * @returns {{x: number, y: number}} A valid position
     */
    getRandomPosition(radius) {
        // First get a position based on the board type
        let position;
        
        switch (this.boardType) {
            case GameConfig.BOARD_TYPES.CIRCLE:
                //position = this.getRandomCirclePosition(radius);
                position = this.getRandomOvalPosition(radius);
                break;
            case GameConfig.BOARD_TYPES.OVAL:
                position = this.getRandomOvalPosition(radius);
                break;
            case GameConfig.BOARD_TYPES.RECTANGLE:
            default:
                position = this.getRandomRectanglePosition(radius);
                break;
        }
        
        // If we have an obstacle manager, make sure the position is valid
        if (this.obstacleManager) {
            // Try a few times to find a position that doesn't collide with obstacles
            const maxAttempts = 50;
            let attempt = 0;
            
            while (attempt < maxAttempts) {
                // Create a temporary ball object to check collision
                const tempBall = { x: position.x, y: position.y, radius };
                
                // Check if this position would collide with obstacles
                if (!this.obstacleManager.isCollidingWithObstacles(tempBall)) {
                    // Position is valid, return it
                    return position;
                }
                
                // Try again with a new position
                switch (this.boardType) {
                    case GameConfig.BOARD_TYPES.CIRCLE:
                        position = this.getRandomCirclePosition(radius);
                        break;
                    case GameConfig.BOARD_TYPES.OVAL:
                        position = this.getRandomOvalPosition(radius);
                        break;
                    case GameConfig.BOARD_TYPES.RECTANGLE:
                    default:
                        position = this.getRandomRectanglePosition(radius);
                        break;
                }
                
                attempt++;
            }
            
            // If we couldn't find a valid position after many attempts,
            // delegate to the obstacle manager's position finder
            return this.obstacleManager.getRandomPosition(radius);
        }
        
        // No obstacle manager, so just return the original position
        return position;
    }
    
    /**
     * Get a random position within the rectangular boundary
     * @param {number} radius - Radius of the ball to position
     * @returns {{x: number, y: number}} Random position
     */
    getRandomRectanglePosition(radius) {
        const offset = this.boundaryOffset;
        const bottomOffset = offset + this.settings.bottomExtraOffset;
        
        return {
            x: offset + radius + Math.random() * (this.width - offset * 2 - radius * 2),
            y: offset + radius + Math.random() * (this.height - offset - bottomOffset - radius * 2)
        };
    }
    
    /**
     * Get a random position within the circular boundary
     * @param {number} radius - Radius of the ball to position
     * @returns {{x: number, y: number}} Random position
     */
    getRandomCirclePosition(radius) {
        // Get random angle and distance from center
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (this.settings.radius - radius - 10); // 10px buffer
        
        return {
            x: this.centerX + distance * Math.cos(angle),
            y: this.centerY + distance * Math.sin(angle)
        };
    }
    
    /**
     * Get a random position within the oval boundary
     * @param {number} radius - Radius of the ball to position
     * @returns {{x: number, y: number}} Random position
     */
    getRandomOvalPosition(radius) {
        const angle = Math.random() * Math.PI * 2;
        
        // Get a random distance from center (0.8 factor ensures we're not too close to edge)
        const radiusX = this.settings.radiusX - radius - 10; // 10px buffer
        const radiusY = this.settings.radiusY - radius - 10; // 10px buffer
        
        const safeRadiusX = radiusX * 0.8;
        const safeRadiusY = radiusY * 0.8;
        
        return {
            x: this.centerX + safeRadiusX * Math.cos(angle),
            y: this.centerY + safeRadiusY * Math.sin(angle)
        };
    }
}