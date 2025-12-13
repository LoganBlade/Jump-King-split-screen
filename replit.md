# Jump King Clone

## Overview
A p5.js-based platformer game inspired by Jump King. Players navigate through various levels by jumping between platforms. Includes AI training mode and local multiplayer.

## Project Structure
- `index.html` - Main HTML entry point
- `sketch.js` - Main p5.js sketch with game logic
- `Player.js` - Player character class
- `Level.js` - Level management
- `LevelSetupFunction.js` - Level configuration
- `Line.js` - Platform/collision line handling
- `Brain.js` - AI brain for neural network with save/load
- `Population.js` - Population management for genetic algorithm
- `Coin.js` - Collectible coins
- `libraries/` - p5.js library files
- `images/` - Game sprites and level backgrounds
- `sounds/` - Sound effects

## Running the Game
The game runs as a static website served on port 5000 using `npx serve`.

## Game Modes

### Single Player Mode
Set `testingSinglePlayer = true` and `multiplayerMode = false` in sketch.js

### Local Multiplayer Mode (Default)
Set `testingSinglePlayer = true` and `multiplayerMode = true` in sketch.js
- Player 1: Arrow keys + Space to jump
- Player 2: WASD keys (W to jump)
- Screen splits when players are on different levels
- Progress auto-saves every 5 seconds

### AI Training Mode
Set `testingSinglePlayer = false` in sketch.js
- Uses genetic algorithm + neural networks
- Press "1" to save the best AI brain
- Press "2" to load a saved brain
- Press "B" to replay the best player
- Up/Down arrows to adjust evolution speed
 - Press "1" to download the best AI brain as a JSON file (also stored to localStorage as backup)
 - Drag the downloaded brain JSON onto the canvas or double-click the canvas to import it
 - Press "P" to toggle checkpoint progression (start new generations from last-unlocked level)
 - Press "P" to toggle checkpoint progression (start new generations from last-unlocked level)
 - The carry-action behavior is always enabled; new generations that begin at a checkpoint inherit the parent's instruction index at the moment the checkpoint was saved.
 - Press "K" to immediately reapply the saved checkpoint to all currently running players (good for testing).

## Controls Summary
- Player 1: Arrow keys (Left/Right movement), Space (jump)
- Player 2: A/D (movement), W (jump)
- "1" - Save AI brain (AI mode)
- "2" - Load AI brain (AI mode)
- "B" - Replay best player (AI mode)
