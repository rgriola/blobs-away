# Blobs-Away - Multiplayer Ball Game

A competitive multiplayer game where players control colored balls in an arena, merging with other balls to grow larger and score points.

## Game Overview

![Blobs Away Game](screenshots/gameplay.png)

Blob Merge is a fast-paced multiplayer game where players control colored balls that bounce within a bounded arena. The goal is to absorb other balls by colliding with them, growing larger and scoring points in the process.

## Game Mechanics

- **Game Canvas**: Large playing area (1600 × 900px)
- **Game Boundary**: 100px inset from the canvas edges
- **Player Control**: Use mouse/trackpad or arrow keys to control ball direction
- **Ball Behavior**:
  - All balls move at 2 pixels per second initially
  - Balls bounce off the boundary walls
  - When balls collide:
    - They merge into one larger ball
    - The player scores 2 points
    - If balls are the same size, one player randomly takes control
    - If balls are different sizes, the larger ball always wins

## Features

- Real-time ball physics with collision detection
- Boundary system with proper bounce mechanics
- Live scoreboard tracking player points
- Bot players with AI movement for single-player testing
- Colorful visual design with size-based ball rendering

## Technical Implementation

- Canvas-based rendering for smooth animations
- Physics engine for realistic ball movement and collisions
- Player input handling for mouse/trackpad and keyboard controls
- Bot AI system for computer-controlled opponents

## Current Status

The current version supports:
- One human player with multiple bot opponents
- Local gameplay on a single device
- Basic collision and scoring mechanics

## Future Enhancements

- Full multiplayer support with networking
- Player customization options
- Power-ups and special abilities
- Multiple game modes
- Mobile device support

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Use your mouse/trackpad or arrow keys to control your ball
4. Absorb other balls to grow and score points!


