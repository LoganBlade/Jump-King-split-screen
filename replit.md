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
- Press "1" to save the best AI brain (download JSON file)
- Press "2" to open the file picker and import a brain or checkpoint JSON file
- Press "B" to replay the best player
- Up/Down arrows to adjust evolution speed
 - Press "1" to download the best AI brain as a JSON file
 - Press "2" to open the file picker for importing a brain or checkpoint file
 - Drag the downloaded brain JSON onto the canvas or double-click the canvas to import it
 - Press "P" to toggle checkpoint progression (start new generations from last-unlocked level)
 - Press "P" to toggle checkpoint progression (start new generations from last-unlocked level)
 - The carry-action behavior is always enabled; new generations that begin at a checkpoint inherit the parent's instruction index at the moment the checkpoint was saved.
 - Press "K" to immediately reapply the saved checkpoint to all currently running players (good for testing). Note: 'K' will not create a new checkpoint; checkpoints must be created by the population when enough AIs reach a level, or loaded from a checkpoint file.
 - Press "3" to download the currently held checkpoint as a JSON file
 - Press "3" to download a snapshot (brain + checkpoint + generation) so you can reload the exact state later

New behavior: A level only becomes a checkpoint once at least 5 AIs have reached it in the same generation. This prevents checkpoints from being created by a single lucky AI.

## Controls Summary
## Controls Summary
- **Player 1:** Arrow keys (Left/Right movement), UP arrow or Space (press & hold to charge jump; release to perform jump)
- **Player 2:** A/D (movement), W (jump) — only in local multiplayer mode
- **B:** Replay the best player (AI mode)
- **1:** Save the best AI brain to a downloadable JSON file (AI mode)
- **2:** Open the file picker to import a brain or checkpoint JSON file (or drag/drop/double-click canvas)
- **P:** Toggle checkpoint progression mode (start new generations from last-unlocked level)
 - **3:** Save a snapshot (brain + checkpoint) representing the current population state
 - **L:** Toggle auto-snapshot-on-new-level behavior (when enabled, pressing a key is not needed; snapshot is downloaded automatically on new level)
- **R:** Reset players when not in line-creation mode; when creating lines, clears current level lines being drawn
- **N:** When creating lines, create a new level; otherwise, increment current player's level (debug)
- **D:** Cancels current line placement while creating lines
- **S:** Stop all sounds
- **- / _ / [ :** Decrease evolution speed
- **= / + / ] :** Increase evolution speed
- **0:** Reset evolution speed to 1
- **9:** Set evolution speed to 10
- **8:** Set evolution speed to 50 (max)
 - **Q:** Cycle render quality (low/medium/high) - lowers the number of players drawn to improve FPS
