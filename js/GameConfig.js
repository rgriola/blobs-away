/**
 * GameConfig.js
 * Central configuration file for Blobs Away game
 * All game constants and settings are defined here
 */

export const GameConfig = {
    // Game setup
    BOUNDARY_OFFSET: 100,
    INITIAL_RADIUS: 15,
    BOT_COUNT: 19,
    
    // Board configurations
    BOARD_TYPES: {
        RECTANGLE: 'rectangle',
        CIRCLE: 'circle',
        OVAL: 'oval',
       // MAZE: 'maze'
    },
    DEFAULT_BOARD_TYPE: 'rectangle',
    
    // Board-specific settings
    BOARD_SETTINGS: {
        rectangle: {
            bottomExtraOffset: 50  // Additional offset for the bottom boundary
        },
        circle: {
            //radius: 375  // Radius of the circular board
            radiusX: 375,
            radiusY: 375
        },
        oval: {
            radiusX: 600,  // Horizontal radius
            radiusY: 375   // Vertical radius
        },
        maze: {
            pathWidth: 100  // Width of the pathways
        }
    },
    
    // Obstacle configuration
    OBSTACLE_SETS: {
        // No obstacles
        'none': [],
        
        // Light obstacles - few, small obstacles for beginners
        'light': [
            {
                type: 'rectangle',
                x: 400,
                y: 200,
                width: 100,
                height: 30,
                color: 'rgba(100, 100, 220, 0.7)'
            },
            {
                type: 'rectangle',
                x: 800,
                y: 600,
                width: 100,
                height: 30,
                color: 'rgba(100, 100, 220, 0.7)'
            },
            {
                type: 'circle',
                x: 1200,
                y: 300,
                radius: 40,
                color: 'rgba(220, 100, 100, 0.7)'
            }
        ],
        
        // Standard obstacles - moderate challenge
        'standard': [
            {
                type: 'rectangle',
                x: 400,
                y: 200,
                width: 200,
                height: 40,
                color: 'rgba(100, 100, 220, 0.7)'
            },
            {
                type: 'rectangle',
                x: 1200,
                y: 600,
                width: 200,
                height: 40,
                color: 'rgba(100, 100, 220, 0.7)'
            },
            {
                type: 'rectangle',
                x: 800,
                y: 400,
                width: 40,
                height: 200,
                color: 'rgba(220, 220, 100, 0.7)'
            },
            {
                type: 'circle',
                x: 250,
                y: 600,
                radius: 60,
                color: 'rgba(220, 100, 100, 0.7)'
            },
            {
                type: 'circle',
                x: 1350,
                y: 200,
                radius: 60,
                color: 'rgba(220, 100, 100, 0.7)'
            }
        ],
        
        // Heavy obstacles - challenging gameplay
        'heavy': [
            {
                type: 'rectangle',
                x: 400,
                y: 200,
                width: 300,
                height: 50,
                color: 'rgba(100, 100, 220, 0.7)'
            },
            {
                type: 'rectangle',
                x: 1200,
                y: 600,
                width: 300,
                height: 50,
                color: 'rgba(100, 100, 220, 0.7)'
            },
            {
                type: 'rectangle',
                x: 800,
                y: 400,
                width: 50,
                height: 300,
                color: 'rgba(220, 220, 100, 0.7)'
            },
            {
                type: 'rectangle',
                x: 300,
                y: 500,
                width: 50,
                height: 200,
                color: 'rgba(220, 220, 100, 0.7)'
            },
            {
                type: 'rectangle',
                x: 1300,
                y: 300,
                width: 50,
                height: 200,
                color: 'rgba(220, 220, 100, 0.7)'
            },
            {
                type: 'circle',
                x: 250,
                y: 200,
                radius: 70,
                color: 'rgba(220, 100, 100, 0.7)'
            },
            {
                type: 'circle',
                x: 1350,
                y: 200,
                radius: 70,
                color: 'rgba(220, 100, 100, 0.7)'
            },
            {
                type: 'circle',
                x: 800,
                y: 700,
                radius: 70,
                color: 'rgba(100, 220, 100, 0.7)'
            }
        ],
        
        // Maze-like obstacles
        'maze': [
            // Vertical walls
            {
                type: 'rectangle',
                x: 400,
                y: 400,
                width: 30,
                height: 500,
                color: 'rgba(242, 116, 116, 0.7)'
            },
            {
                type: 'rectangle',
                x: 800,
                y: 400,
                width: 30,
                height: 500,
                color: 'rgba(104, 220, 98, 0.7)'
            },
            {
                type: 'rectangle',
                x: 1200,
                y: 400,
                width: 30,
                height: 500,
                color: 'rgba(244, 207, 74, 0.7)'
            },
            
            // Horizontal walls with gaps
            {
                type: 'rectangle',
                x: 200,
                y: 150,
                width: 300,
                height: 30,
                color: 'rgba(14, 143, 93, 0.7)'
            },
            {
                type: 'rectangle',
                x: 700,
                y: 150,
                width: 300,
                height: 30,
                color: 'rgba(104, 1, 107, 0.86)'
            },
            {
                type: 'rectangle',
                x: 1300,
                y: 150,
                width: 300,
                height: 30,
                color: 'rgba(214, 18, 106, 0.7)'
            },
            {
                type: 'rectangle',
                x: 200,
                y: 650,
                width: 300,
                height: 30,
                color: 'rgba(4, 97, 236, 0.7)'
            },
            {
                type: 'rectangle',
                x: 700,
                y: 650,
                width: 300,
                height: 30,
                color: 'rgb(75, 167, 0)'
            },
            {
                type: 'rectangle',
                x: 1300,
                y: 650,
                width: 300,
                height: 30,
                color: 'rgba(150, 150, 150, 0.7)'
            }
        ],

        // Pinball-like obstacle set with many circular bumpers
        'pinball': [
            // Circular bumpers scattered across the board
            {
                type: 'circle',
                x: 400,
                y: 250,
                radius: 30,
                color: 'rgba(255, 50, 50, 0.8)'
            },
            {
                type: 'circle',
                x: 1200,
                y: 250,
                radius: 30,
                color: 'rgba(50, 255, 50, 0.8)'
            },
            {
                type: 'circle',
                x: 600,
                y: 400,
                radius: 25,
                color: 'rgba(50, 50, 255, 0.8)'
            },
            {
                type: 'circle',
                x: 1000,
                y: 400,
                radius: 25,
                color: 'rgba(255, 255, 50, 0.8)'
            },
            {
                type: 'circle',
                x: 400,
                y: 600,
                radius: 30,
                color: 'rgba(255, 50, 255, 0.8)'
            },
            {
                type: 'circle',
                x: 1200,
                y: 600,
                radius: 30,
                color: 'rgba(50, 255, 255, 0.8)'
            },
            {
                type: 'circle',
                x: 800,
                y: 300,
                radius: 35,
                color: 'rgba(255, 150, 50, 0.8)'
            },
            {
                type: 'circle',
                x: 800,
                y: 550,
                radius: 35,
                color: 'rgba(150, 50, 255, 0.8)'
            },
            // A few rectangular obstacles as "lanes"
            {
                type: 'rectangle',
                x: 300,
                y: 350,
                width: 20,
                height: 200,
                color: 'rgba(180, 180, 220, 0.7)'
            },
            {
                type: 'rectangle',
                x: 1300,
                y: 350,
                width: 20,
                height: 200,
                color: 'rgba(180, 180, 220, 0.7)'
            }
        ]
    },

    // Default obstacle set to use
    DEFAULT_OBSTACLE_SET: 'none',
    
    // Timing
    FPS: 60,
    TIMESTEP: 1/60,
    MAX_FRAME_TIME: 200,
    COUNTDOWN_TIME: 3,
    
    // Gameplay
    ABSORB_COOLDOWN: 3,
    INITIAL_VELOCITY: 5,
    BASE_SCORE: 2,
    
    // Particles
    PARTICLE_POOL_SIZE: 500,
    PARTICLE_MIN_SIZE: 2,
    PARTICLE_MAX_SIZE: 4,
    PARTICLE_MIN_LIFE: 0.5,
    PARTICLE_MAX_LIFE: 1.0,
    
    // Audio
    MUSIC_VOLUME: 0.3,
    FADE_DURATION: 2000,

    // Colors
    BALL_COLORS: [
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', 
        '#7B68EE', '#20BF55', '#EF476F', '#118AB2', '#06D6A0',
        '#800000', '#9932CC', '#FF8C00', '#008080', '#4B0082',
        '#FF1493', '#FFD700', '#00CED1', '#8B4513', '#2E8B57'
    ],

    // Debug settings
    DEBUG_MODE: false,
    SHOW_FPS: true
};

// Export named functions for specific configuration needs
export function getRandomBallColor(usedColors = []) {
    const availableColors = GameConfig.BALL_COLORS.filter(
        color => !usedColors.includes(color)
    );
    
    if (availableColors.length > 0) {
        return availableColors[Math.floor(Math.random() * availableColors.length)];
    }
    
    // If all colors used, return a random one
    return GameConfig.BALL_COLORS[Math.floor(Math.random() * GameConfig.BALL_COLORS.length)];
}