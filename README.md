# Blobs Away - Absorb and Grow!

A competitive arcade-style game where you control a colorful blob, absorb smaller ones to grow larger, and dominate the arena.

![Blobs Away Game](screenshots/gameplay.png)

## Play Online
**[▶️ Play Blobs Away Now!](https://rgriola.github.io/blobs-away/)**

## Game Overview
Blobs Away is a fast-paced game where you control a colorful ball that bounces within a bounded arena. Your goal is to absorb smaller balls by colliding with them, growing larger and scoring points in the process. But be careful - larger balls can absorb you!

## How to Play
- Enter your name and click "Play" to start
- Control your blob using:
  - Mouse/trackpad movement
  - Arrow keys
  - WASD keys
- Absorb smaller blobs to grow larger and score points
- Avoid larger blobs that can absorb you
- Compete for the highest score on the leaderboard

## Game Mechanics
- **Game Canvas**: Large playing area (1600 × 900px)
- **Game Boundary**: 100px inset from the canvas edges
- **Player Control**: Use mouse/trackpad or arrow keys to control ball direction
- **Ball Behavior**:
  - Smaller balls move faster, larger balls move slower
  - All balls bounce off the boundary walls
  - When balls collide:
    - The larger ball absorbs the smaller ball
    - The winner grows larger based on the combined area
    - The player scores 2 points
    - If balls are the same size, one randomly wins

## Features
- **Smooth Gameplay**: Canvas-based rendering with interpolation for fluid motion
- **Dynamic Sound Effects**: Multiple sound channels with volume adjustment
- **Visual Indicators**: Player blob has a unique heart icon for easy identification
- **AI Opponents**: Bot players with intelligent behavior
- **Live Leaderboard**: Real-time score tracking
- **Colorful Design**: Vibrant visuals with size-based ball rendering

## Technical Implementation
- **Modern JavaScript**: ES6+ features with modules
- **Canvas Rendering**: High-performance 2D graphics
- **Physics Engine**: Custom physics for realistic movement and collisions
- **Sound System**: Multi-channel audio with pooling for overlapping sounds
- **Bot AI System**: Computer-controlled opponents with strategic movement

## Current Status
The current version supports:
- One human player with multiple bot opponents
- Local gameplay on a single device
- Complete collision and scoring mechanics
- Sound effects and background music
- Visual player identification

## Future Enhancements
- Full multiplayer support with networking
- Player customization options
- Power-ups and special abilities
- Multiple game modes
- Mobile device support

## Getting Started

### Play Online
Visit [https://rgriola.github.io/blobs-away/](https://rgriola.github.io/blobs-away/) to play!

### Run Locally
1. Clone the repository:
2. Open `index.html` in your browser
3. No build process or dependencies required!

## Browser Compatibility
Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Controls
- **Mouse/Trackpad**: Move cursor to guide your blob
- **Keyboard**: Arrow keys or WASD to change direction
- **M Key**: Toggle sound on/off

## Credits
- Game Design & Development: Richard Griola
- Sound Effects: Various open-source libraries

## License
MIT License - See [LICENSE](LICENSE) for details.

---

Enjoy the game? Star the repository and share with your friends!  
Questions or feedback? [Open an issue](https://github.com/rgriola/blobs-away/issues) on GitHub.