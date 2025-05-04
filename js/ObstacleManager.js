/**
 * ObstacleManager.js
 * Manages obstacles for all board types in the game
 * Handles obstacle creation, collision detection, and rendering
 */
import { GameConfig } from './GameConfig.js';

export class ObstacleManager {
    /**
     * Initialize the obstacle manager
     * @param {HTMLCanvasElement} canvas - Game canvas
     * @param {number} width - Width of the game area
     * @param {number} height - Height of the game area
     * @param {string} obstacleSet - Name of the obstacle set to use
     * @param {BoardManager} boardManager - Reference to the board manager
     */
    constructor(canvas, width, height, obstacleSet, boardManager) {
        this.canvas = canvas;
        this.width = width || canvas.width;
        this.height = height || canvas.height;
        this.boardManager = boardManager;
        this.obstacles = [];
        this.ctx = canvas.getContext('2d');
        
        // If obstacle set name is provided, load those obstacles
        if (obstacleSet && GameConfig.OBSTACLE_SETS) {
            // Handle 'random' obstacle set
            if (obstacleSet === 'random') {
                // Get all obstacle set names except 'none' and 'random'
                const setNames = Object.keys(GameConfig.OBSTACLE_SETS).filter(
                    name => name !== 'none' && name !== 'random'
                );
                
                // Randomly select one of the obstacle sets
                if (setNames.length > 0) {
                    const randomIndex = Math.floor(Math.random() * setNames.length);
                    const randomSetName = setNames[randomIndex];
                    this.setObstacles(GameConfig.OBSTACLE_SETS[randomSetName]);
                    console.log(`Random obstacle set selected: ${randomSetName}`);
                }
            } 
            // Load the specified obstacle set
            else if (GameConfig.OBSTACLE_SETS[obstacleSet]) {
                this.setObstacles(GameConfig.OBSTACLE_SETS[obstacleSet]);
            }
        }
    }
    
    /**
     * Set obstacles based on the selected obstacle set from GameConfig
     * @param {Array} obstacleSet - Array of obstacle objects
     * @returns {ObstacleManager} - Returns this for method chaining
     */
    setObstacles(obstacleSet) {
        this.obstacles = [...obstacleSet]; // Clone the array to avoid modifying the original
        return this;
    }
    
    /**
     * Clear all obstacles
     * @returns {ObstacleManager} - Returns this for method chaining
     */
    clearObstacles() {
        this.obstacles = [];
        return this;
    }
    
    /**
     * Add a single obstacle to the collection
     * @param {Object} obstacle - The obstacle object to add
     * @returns {ObstacleManager} - Returns this for method chaining
     */
    addObstacle(obstacle) {
        this.obstacles.push(obstacle);
        return this;
    }
    
    /**
     * Draw all obstacles on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @returns {ObstacleManager} - Returns this for method chaining
     */
    drawObstacles(ctx = this.ctx) {
        if (!ctx) return this; // Skip drawing if no context is available
        
        for (const obstacle of this.obstacles) {
            this.drawObstacle(obstacle, ctx);
        }
        return this;
    }
    
    /**
     * Draw a single obstacle based on its type
     * @param {Object} obstacle - The obstacle object to draw
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawObstacle(obstacle, ctx) {
        // Set default styles if not specified
        ctx.fillStyle = obstacle.color || 'rgba(100, 100, 220, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        
        // Error check - make sure obstacle has required properties
        if (!obstacle.type) {
            console.warn('Obstacle missing type property:', obstacle);
            return;
            }
        
        switch (obstacle.type) {
            case 'rectangle':
                ctx.beginPath();
                ctx.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'circle':
                ctx.beginPath();
                ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
                
            // Can add more obstacle types here as needed
            default:
                console.warn(`Unknown obstacle type: ${obstacle.type}`);
        }
    }
    
    /**
     * Check if a ball is colliding with any obstacle
     * @param {Ball} ball - Ball to check
     * @returns {Object|null} - The obstacle that was collided with, or null
     */
    checkCollisions(ball) {
        for (const obstacle of this.obstacles) {
            if (this.checkCollision(ball, obstacle)) {
                return obstacle; // Return the obstacle that was collided with
            }
        }
        return null;
    }
    
    /**
     * Method expected by BoardManager - checks if ball is colliding with any obstacles
     * @param {Ball} ball - Ball to check
     * @returns {boolean} - True if collision occurred
     */
    isCollidingWithObstacles(ball) {
        return this.checkCollisions(ball) !== null;
    }
    
    /**
     * Method expected by BoardManager - handles collision between ball and obstacles
     * @param {Ball} ball - Ball to handle collision for
     * @param {number} bounceMultiplier - Multiplier for bounce velocity
     * @returns {boolean} - True if collision was handled
     */
    handleObstacleCollision(ball, bounceMultiplier = 1.05) {
        // Skip if there are no obstacles or the ball is inactive
        if (!this.obstacles.length || !ball?.active) return false;
        
        const obstacle = this.checkCollisions(ball);
        if (obstacle) {
            this.handleCollision(ball, obstacle);
            // Apply the bounce multiplier
            ball.velocityX *= bounceMultiplier;
            ball.velocityY *= bounceMultiplier;
            return true;
        }
        return false;
    }
    
    /**
     * Check collision between a ball and a specific obstacle
     * @param {Ball} ball - Ball to check
     * @param {Object} obstacle - Obstacle to check
     * @returns {boolean} - True if collision occurred
     */
    checkCollision(ball, obstacle) {
        switch (obstacle.type) {
            case 'rectangle':
                return this.checkRectangleCollision(ball, obstacle);
                
            case 'circle':
                return this.checkCircleCollision(ball, obstacle);
                
            default:
                return false;
        }
    }
    
    /**
     * Handle collision between a ball and a rectangle obstacle
     * @param {Ball} ball - Ball to check
     * @param {Object} rect - Rectangle obstacle
     * @returns {boolean} - True if collision occurred
     */
    checkRectangleCollision(ball, rect) {
        // Find the closest point to the circle within the rectangle
        let closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.width));
        let closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.height));
        
        // Calculate the distance between the circle's center and this closest point
        let distanceX = ball.x - closestX;
        let distanceY = ball.y - closestY;
        
        // If the distance is less than the circle's radius, there's a collision
        let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (ball.radius * ball.radius);
    }
    
    /**
     * Handle collision between a ball and a circular obstacle
     * @param {Ball} ball - Ball to check
     * @param {Object} circle - Circle obstacle
     * @returns {boolean} - True if collision occurred
     */
    checkCircleCollision(ball, circle) {
        let dx = ball.x - circle.x;
        let dy = ball.y - circle.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        // If distance is less than sum of radii, there's a collision
        return distance < (ball.radius + circle.radius);
    }
    
    /**
     * Handle the collision response between ball and obstacle
     * @param {Ball} ball - Ball to handle
     * @param {Object} obstacle - Obstacle that was collided with
     */
    handleCollision(ball, obstacle) {
        switch (obstacle.type) {
            case 'rectangle':
                this.handleRectangleCollision(ball, obstacle);
                break;
                
            case 'circle':
                this.handleCircleCollision(ball, obstacle);
                break;
        }
    }
    
    /**
     * Handle collision response with a rectangle
     * @param {Ball} ball - Ball to handle
     * @param {Object} rect - Rectangle obstacle
     */
    handleRectangleCollision(ball, rect) {
        // Find the closest point to the circle within the rectangle
        let closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.width));
        let closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.height));
        
        // Vector from closest point to circle center
        let dx = ball.x - closestX;
        let dy = ball.y - closestY;
        
        // Normalize to get collision normal
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            let nx = dx / distance;
            let ny = dy / distance;
            
            // Calculate reflection vector
            let dotProduct = ball.velocityX * nx + ball.velocityY * ny;
            
            ball.velocityX = ball.velocityX - 2 * dotProduct * nx;
            ball.velocityY = ball.velocityY - 2 * dotProduct * ny;
            
            // Move ball outside of the obstacle
            let overlap = ball.radius - distance;
            if (overlap > 0) {
                ball.x += overlap * nx;
                ball.y += overlap * ny;
            }
        }
    }
    
    /**
     * Handle collision response with a circle
     * @param {Ball} ball - Ball to handle
     * @param {Object} circle - Circle obstacle
     */
    handleCircleCollision(ball, circle) {
        // Vector from circle center to ball center
        let dx = ball.x - circle.x;
        let dy = ball.y - circle.y;
        
        // Get the distance
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize to get collision normal
            let nx = dx / distance;
            let ny = dy / distance;
            
            // Calculate reflection vector
            let dotProduct = ball.velocityX * nx + ball.velocityY * ny;
            
            ball.velocityX = ball.velocityX - 2 * dotProduct * nx;
            ball.velocityY = ball.velocityY - 2 * dotProduct * ny;
            
            // Move ball outside of the obstacle
            let overlap = ball.radius + circle.radius - distance;
            if (overlap > 0) {
                ball.x += overlap * nx;
                ball.y += overlap * ny;
            }
        }
    }
}