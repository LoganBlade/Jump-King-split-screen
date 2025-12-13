let width = 0;
let height = 0;
let canvas = null;

let player = null;
let player2 = null;
let multiplayerMode = true;
let lines = [];
let backgroundImage = null;


let creatingLines = false;

let idleImage = null;
let squatImage = null;
let jumpImage = null;
let oofImage = null;
let run1Image = null;
let run2Image = null;
let run3Image = null;
let fallenImage = null;
let fallImage = null;
let showingLines = false;
let showingCoins = false;
let levelImages = [];

let placingPlayer = false;
let placingCoins = false;
let playerPlaced = false;

let testingSinglePlayer = false;
let enableCheckpointMode = true; // when true, new populations start from the best reached level


let fallSound = null;
let jumpSound = null;
let bumpSound = null;
let landSound = null;

let snowImage = null;


let population = null;
let filePickerInput = null; // exposed file input so keyboard can open it
let levelDrawn = false;


let startingPlayerActions = 5;
let increaseActionsByAmount = 5;
let increaseActionsEveryXGenerations = 10;
let evolationSpeed = 1;
let maxUpdateTimePerFrameMs = 14; // ms budget per frame for updates (keeps rendering time for draw)


function preload() {
    backgroundImage = loadImage('images/levelImages/1.png')
    idleImage = loadImage('images/poses/idle.png')
    squatImage = loadImage('images/poses/squat.png')
    jumpImage = loadImage('images/poses/jump.png')
    oofImage = loadImage('images/poses/oof.png')
    run1Image = loadImage('images/poses/run1.png')
    run2Image = loadImage('images/poses/run2.png')
    run3Image = loadImage('images/poses/run3.png')
    fallenImage = loadImage('images/poses/fallen.png')
    fallImage = loadImage('images/poses/fall.png')


    snowImage = loadImage('images/snow3.png')

    for (let i = 1; i <= 43; i++) {
        levelImages.push(loadImage('images/levelImages/' + i + '.png'))
    }

    jumpSound = loadSound('sounds/jump.mp3')
    fallSound = loadSound('sounds/fall.mp3')
    bumpSound = loadSound('sounds/bump.mp3')
    landSound = loadSound('sounds/land.mp3')


}


function setup() {
    setupCanvas();
    player = new Player();
    player2 = new Player();
    player2.currentPos = createVector(width / 2 + 100, height - 200);
    population = new Population(600);
    setupLevels();
    jumpSound.playMode('sustain');
    fallSound.playMode('sustain');
    bumpSound.playMode('sustain');
    landSound.playMode('sustain');
    
    loadMultiplayerProgress();
    setupFileDrop();
    frameRate(60); // cap draw frames to 60fps target
}

function drawMousePosition() {
    let snappedX = mouseX - mouseX % 20;
    let snappedY = mouseY - mouseY % 20;
    push();


    fill(255, 0, 0)
    noStroke();
    ellipse(snappedX, snappedY, 5);

    if (mousePos1 != null) {
        stroke(255, 0, 0)
        strokeWeight(5)
        line(mousePos1.x, mousePos1.y, snappedX, snappedY)
    }

    pop();
}

let levelNumber = 0;

function draw() {
    background(10);


    // if(frameCount % 5==0 ){
    //
    //     levelNumber  = (levelNumber +1)%43;
    // }
    // image(backgroundImage,0,0);
    // if (!creatingLines) {

    //     if (!placingPlayer || playerPlaced) {
    //
    //         player.Update();
    //         player.Show();
    //     }
    // } else {
    //     image(levelImages[levelNumber], 0, 0)
    // }
    push()
    translate(0, 50);
    if (testingSinglePlayer) {
        if (multiplayerMode) {
            drawMultiplayer();
        } else {
            image(levels[player.currentLevelNo].levelImage, 0, 0)
            levels[player.currentLevelNo].show();
            player.Update();
            player.Show();
        }
    } else if(replayingBestPlayer) {
        if(!cloneOfBestPlayer.hasFinishedInstructions){
            let startMs = millis();
            for (let i = 0; i < evolationSpeed; i++){
                cloneOfBestPlayer.Update();
                if (millis() - startMs > maxUpdateTimePerFrameMs) break;
            }

            showLevel(cloneOfBestPlayer.currentLevelNo);
            alreadyShowingSnow = false;
            cloneOfBestPlayer.Show();
        }else{
            replayingBestPlayer = false;
            mutePlayers = true;
        }

    }else{

        if (population.AllPlayersFinished()) {
            population.NaturalSelection();
            if (population.gen % increaseActionsEveryXGenerations === 0) {
                population.IncreasePlayerMoves(increaseActionsByAmount);
            }
        }
        let startMs = millis();
        for (let i = 0; i < evolationSpeed; i++){
            population.Update();
            if (millis() - startMs > maxUpdateTimePerFrameMs) break;
        }
        // population.Update()
        // population.Update()
        population.Show();

    }


    if (showingLines || creatingLines)
        showLines();

    if (creatingLines)
        drawMousePosition();


    if (frameCount % 15 === 0) {
        previousFrameRate = floor(getFrameRate())
    }


    pop();

    fill(0);
    noStroke();
    rect(0, 0, width, 50);
    if(!testingSinglePlayer){
        textSize(32);
        fill(255, 255, 255);
        text('FPS: ' + previousFrameRate, width - 160, 35);
        text('Gen: ' + population.gen, 30, 35);
        text('Moves: ' + population.players[0].brain.instructions.length, 200, 35);
        text('Best: ' + population.bestHeight, 400, 35);
        // Success HUD removed per user request; hide candidate success count
        // Checkpoint HUD removed per user request
        // Carry actions removed — always carry parent's action number when resuming at checkpoint
        // Removed checkpoint Level HUD to avoid overlaying FPS
        // Removed 'NEW CHECKPOINT REACHED' HUD overlay to avoid overlapping FPS
    }


}

let previousFrameRate = 60;

function showLevel(levelNumberToShow) {
    // print(levelNumberToShow)
    // image(levels[levelNumberToShow].levelImage, 0, 0)
    levels[levelNumberToShow].show();
}

function showLines() {
    if (creatingLines) {
        for (let l of lines) {
            l.Show();
        }
    } else {

        for (let l of levels[player.currentLevelNo].lines) {
            l.Show();
        }

    }

}


function setupCanvas() {
    canvas = createCanvas(1200, 950);
    canvas.parent('canvas');
    width = canvas.width;
    height = canvas.height - 50;
}

// Provide a simple drag-and-drop and file input to import a saved brain file
function setupFileDrop() {
    const div = document.getElementById('canvas');
    if (!div) return;

    // Prevent default browser behavior for dragover/drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evtName => {
        div.addEventListener(evtName, function (e) {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    div.addEventListener('dragover', (e) => {
        e.dataTransfer.dropEffect = 'copy';
    });

    div.addEventListener('drop', async (e) => {
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        try {
            // Read file once to detect snapshot file type
            const text = await file.text();
            let parsed = null;
            try {
                parsed = JSON.parse(text);
            } catch (err) {
                parsed = null;
            }
            // If snapshot, apply both brain and checkpoint from the snapshot (don't mutate)
            if (parsed && parsed.type === 'snapshot') {
                const loadedSnapshot = population.applySnapshotData(parsed);
                if (loadedSnapshot) {
                    alert('Snapshot file loaded! Level: ' + loadedSnapshot.level + ' Generation: ' + loadedSnapshot.generation);
                    return;
                }
            }
        } catch (e) {
            // ignore — we'll fall back to individual loaders below
        }
        // Try loading as Brain first, then fallback to checkpoint
        let loadedBrain = await Brain.loadBestBrainFromFile(file);
        if (loadedBrain) {
            for (let i = 0; i < population.players.length; i++) {
                population.players[i].brain = loadedBrain.brain.clone();
                population.players[i].brain.mutate();
            }
            population.gen = loadedBrain.generation || population.gen;
            alert('Brain file loaded! Generation: ' + loadedBrain.generation);
            return;
        }
        // Try checkpoint
        let loadedCheckpoint = await population.loadCheckpointFromFile(file);
        if (loadedCheckpoint) {
            for (let i = 0; i < population.players.length; i++) {
                population.players[i].playerStateAtStartOfBestLevel = population.checkpointState.clone();
                population.players[i].loadStartOfBestLevelPlayerState();
                if (population.checkpointState.brainActionNumber !== undefined) {
                    population.players[i].brain.currentInstructionNumber = population.checkpointState.brainActionNumber;
                }
            }
            alert('Checkpoint file loaded! Level: ' + loadedCheckpoint.level + ' Generation: ' + loadedCheckpoint.generation);
            return;
        }
        alert('Not a valid brain or checkpoint file');
    });

    // Hidden input to fallback to manual file selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);
    filePickerInput = input; // expose the input globally
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            let parsed = null;
            try {
                parsed = JSON.parse(text);
            } catch (err) {
                parsed = null;
            }
            if (parsed && parsed.type === 'snapshot') {
                const loadedSnapshot = population.applySnapshotData(parsed);
                if (loadedSnapshot) {
                    alert('Snapshot file loaded! Level: ' + loadedSnapshot.level + ' Generation: ' + loadedSnapshot.generation);
                    return;
                }
            }
        } catch (err) {
            // fallback to older handlers below
        }
        let loadedBrain = await Brain.loadBestBrainFromFile(file);
        if (loadedBrain) {
            for (let i = 0; i < population.players.length; i++) {
                population.players[i].brain = loadedBrain.brain.clone();
                population.players[i].brain.mutate();
            }
            population.gen = loadedBrain.generation || population.gen;
            alert('Brain file loaded! Generation: ' + loadedBrain.generation);
            return;
        }
        let loadedCheckpoint = await population.loadCheckpointFromFile(file);
        if (loadedCheckpoint) {
            for (let i = 0; i < population.players.length; i++) {
                population.players[i].playerStateAtStartOfBestLevel = population.checkpointState.clone();
                population.players[i].loadStartOfBestLevelPlayerState();
                if (population.checkpointState.brainActionNumber !== undefined) {
                    population.players[i].brain.currentInstructionNumber = population.checkpointState.brainActionNumber;
                }
            }
            alert('Checkpoint file loaded! Level: ' + loadedCheckpoint.level + ' Generation: ' + loadedCheckpoint.generation);
            return;
        }
        alert('Not a valid brain or checkpoint file');
    });

    // small UI: click the canvas to pick a file
    div.addEventListener('dblclick', () => input.click());
}


function keyPressed() {
    switch (key) {
        case ' ':
            player.jumpHeld = true
            break;
        case 'R':
            population.ResetAllPlayers()
            break;
        case 'S':
            bumpSound.stop();
            jumpSound.stop();
            landSound.stop();
            fallSound.stop();
            break;
        case 'w':
        case 'W':
            if (multiplayerMode) player2.jumpHeld = true;
            break;
        case 'a':
        case 'A':
            if (multiplayerMode) player2.leftHeld = true;
            break;
        case 'd':
        case 'D':
            if (multiplayerMode) player2.rightHeld = true;
            break;
    }

    switch (keyCode) {
        case LEFT_ARROW:
            player.leftHeld = true;
            break;
        case RIGHT_ARROW:
            player.rightHeld = true;
            break;
        case UP_ARROW:
            player.jumpHeld = true;
            break;
    }

}
replayingBestPlayer = false;
cloneOfBestPlayer = null;



function keyReleased() {

    switch (key) {
        case 'B':
            replayingBestPlayer = true;
            cloneOfBestPlayer = population.cloneOfBestPlayerFromPreviousGeneration.clone();
            evolationSpeed = 1;
            mutePlayers = false;
            break;
        case '1':
            if (population.cloneOfBestPlayerFromPreviousGeneration) {
                // Only save to file (localStorage disabled)
                Brain.saveBestBrainToFile(population.cloneOfBestPlayerFromPreviousGeneration.brain, population.gen);
                alert('Brain saved to file. Generation: ' + population.gen);
            }
            break;
        case '2':
            // Open file picker to import a brain or checkpoint
            if (filePickerInput) {
                filePickerInput.click();
            } else {
                alert('File picker not available');
            }
            break;
        case '3':
            // Save snapshot (brain+checkpoint) to file (generate checkpoint if not present)
            if (!population.checkpointState) {
                // Try to use the cloneOfBestPlayer checkpoint state if available
                if (population.cloneOfBestPlayerFromPreviousGeneration && population.cloneOfBestPlayerFromPreviousGeneration.playerStateAtStartOfBestLevel) {
                    population.checkpointState = population.cloneOfBestPlayerFromPreviousGeneration.playerStateAtStartOfBestLevel.clone();
                    population.currentBestLevelReached = population.cloneOfBestPlayerFromPreviousGeneration.bestLevelReached || population.currentBestLevelReached;
                } else if (population.players && population.players[population.bestPlayerIndex] && population.players[population.bestPlayerIndex].playerStateAtStartOfBestLevel) {
                    population.checkpointState = population.players[population.bestPlayerIndex].playerStateAtStartOfBestLevel.clone();
                    population.currentBestLevelReached = population.players[population.bestPlayerIndex].bestLevelReached || population.currentBestLevelReached;
                } else if (population.players && population.players.length > 0) {
                    // Fallback: capture current state from the best player or first player
                    let p = population.players[population.bestPlayerIndex] || population.players[0];
                    let tempState = new PlayerState();
                    tempState.getStateFromPlayer(p);
                    population.checkpointState = tempState;
                    population.currentBestLevelReached = tempState.bestLevelReached || population.currentBestLevelReached;
                }
            }
            if (population.checkpointState) {
                population.saveSnapshotToFile();
                alert('Snapshot saved to file! Level: ' + population.currentBestLevelReached + ' Generation: ' + population.gen);
            } else {
                alert('No checkpoint available to save');
            }
            break;
        case 'P':
            // Toggle checkpoint progression on/off
            enableCheckpointMode = !enableCheckpointMode;
            alert('Checkpoint progression: ' + (enableCheckpointMode ? 'ON' : 'OFF'));
            break;
        case 'L':
            // Toggle auto snapshot saving on new level
            window.autoSaveSnapshotsOnNewLevel = !window.autoSaveSnapshotsOnNewLevel;
            alert('Auto snapshot on new level: ' + (window.autoSaveSnapshotsOnNewLevel ? 'ON' : 'OFF'));
            break;
        // 'O' removed — carry actions always enabled
        case 'K':
            // K key intentionally does nothing now — reserved for future UI features
            break;
            break;


        case ' ':
            if (!creatingLines) {
                player.jumpHeld = false
                player.Jump()
            }
            break;
        case 'w':
        case 'W':
            if (multiplayerMode) {
                player2.jumpHeld = false;
                player2.Jump();
            }
            break;
        case 'a':
        case 'A':
            if (multiplayerMode) player2.leftHeld = false;
            break;
        case 'd':
        case 'D':
            if (multiplayerMode) player2.rightHeld = false;
            break;
        case 'R':
            if (creatingLines) {
                lines = [];
                linesString = "";
                mousePos1 = null;
                mousePos2 = null;
            }
            break;
        case 'N':
            if (creatingLines) {
                levelNumber += 1;
                linesString += '\nlevels.push(tempLevel);';
                linesString += '\ntempLevel = new Level();';
                print(linesString);
                lines = [];
                linesString = '';
                mousePos1 = null;
                mousePos2 = null;
            } else {
                player.currentLevelNo += 1;
                print(player.currentLevelNo);
            }
            break;
        case 'D':
            if (creatingLines) {

                mousePos1 = null;
                mousePos2 = null;
            }
    }

    switch (keyCode) {
        case LEFT_ARROW:
            player.leftHeld = false;
            break;
        case RIGHT_ARROW:
            player.rightHeld = false;
            break;
        case UP_ARROW:
            if (!creatingLines) {
                player.jumpHeld = false;
                player.Jump();
            }
            break;
    }
    
    if (key === '-' || key === '_' || key === '[') {
        evolationSpeed = constrain(evolationSpeed - 1, 1, 50);
        print("Speed:", evolationSpeed);
    }
    if (key === '=' || key === '+' || key === ']') {
        evolationSpeed = constrain(evolationSpeed + 1, 1, 50);
        print("Speed:", evolationSpeed);
    }
    if (key === '0') {
        evolationSpeed = 1;
        print("Speed reset:", evolationSpeed);
    }
    if (key === '9') {
        evolationSpeed = 10;
        print("Speed set to 10:", evolationSpeed);
    }
    if (key === '8') {
        evolationSpeed = 50;
        print("Speed set to max:", evolationSpeed);
    }
}


let mousePos1 = null;
let mousePos2 = null;
let linesString = "";


function mouseClicked() {
    if (creatingLines) {
        let snappedX = mouseX - mouseX % 20;
        let snappedY = mouseY - mouseY % 20;
        if (mousePos1 == null) {
            mousePos1 = createVector(snappedX, snappedY);
        } else {
            mousePos2 = createVector(snappedX, snappedY);
            // print('tempLevel.lines.push(new Line(' + mousePos1.x + ',' + mousePos1.y + ',' + mousePos2.x + ',' + mousePos2.y + '));');
            lines.push(new Line(mousePos1.x, mousePos1.y, mousePos2.x, mousePos2.y));
            linesString += '\ntempLevel.lines.push(new Line(' + mousePos1.x + ',' + mousePos1.y + ',' + mousePos2.x + ',' + mousePos2.y + '));';
            mousePos1 = null;
            mousePos2 = null;
        }
    } else if (placingPlayer && !playerPlaced) {
        playerPlaced = true;
        player.currentPos = createVector(mouseX, mouseY);


    } else if (placingCoins) {


    }
    print("levels[" + player.currentLevelNo + "].coins.push(new Coin( " + floor(mouseX) + "," + floor(mouseY - 50) + ' , "progress" ));');
}

//todo
// things to do
// - when a player lands in a new level, record the game state and start the next evolution at that point DONE
// - when a player falls into a previous level, end the players movements, and mutate that move which fucked them up with a 100% chance
// fix landing logic so it checks below maybe, or it checks after all the corrections are done that there is still something below it. actually lets do that now. i dont knwo why im still typing this


// - add a player replay, we could also include a generation replay, thats probably it
// - maybe consider adding a goal system for really hard levels.

function drawMultiplayer() {
    player.Update();
    player2.Update();
    
    let sameLevel = player.currentLevelNo === player2.currentLevelNo;
    
    if (sameLevel) {
        image(levels[player.currentLevelNo].levelImage, 0, 0);
        levels[player.currentLevelNo].show();
        player.ShowMultiplayer(1);
        player2.ShowMultiplayer(2);
    } else {
        let splitHeight = height / 2;
        
        // Player 1's view (top half) - follows player vertically
        push();
        drawingContext.save();
        drawingContext.beginPath();
        drawingContext.rect(0, 0, width, splitHeight);
        drawingContext.clip();
        let p1offsetY = player.currentPos.y - splitHeight / 2;
        p1offsetY = constrain(p1offsetY, 0, height - splitHeight);
        translate(0, -p1offsetY);
        image(levels[player.currentLevelNo].levelImage, 0, 0);
        levels[player.currentLevelNo].show();
        player.ShowMultiplayer(1);
        drawingContext.restore();
        pop();
        
        // Player 2's view (bottom half) - follows player vertically
        push();
        drawingContext.save();
        drawingContext.beginPath();
        drawingContext.rect(0, splitHeight, width, splitHeight);
        drawingContext.clip();
        let p2offsetY = player2.currentPos.y - splitHeight / 2;
        p2offsetY = constrain(p2offsetY, 0, height - splitHeight);
        translate(0, splitHeight - p2offsetY);
        image(levels[player2.currentLevelNo].levelImage, 0, 0);
        levels[player2.currentLevelNo].show();
        player2.ShowMultiplayer(2);
        drawingContext.restore();
        pop();
        
        // Divider line
        stroke(255);
        strokeWeight(4);
        line(0, splitHeight, width, splitHeight);
    }
    
    if (frameCount % 300 === 0) {
        saveMultiplayerProgress();
    }
}

function saveMultiplayerProgress() {
    let data = {
        player1: {
            x: player.currentPos.x,
            y: player.currentPos.y,
            level: player.currentLevelNo,
            bestLevel: player.bestLevelReached
        },
        player2: {
            x: player2.currentPos.x,
            y: player2.currentPos.y,
            level: player2.currentLevelNo,
            bestLevel: player2.bestLevelReached
        },
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('jumpKingMultiplayer', JSON.stringify(data));
    console.log('Progress saved!');
}

function loadMultiplayerProgress() {
    let saved = localStorage.getItem('jumpKingMultiplayer');
    if (saved && multiplayerMode && testingSinglePlayer) {
        let data = JSON.parse(saved);
        player.currentPos = createVector(data.player1.x, data.player1.y);
        player.currentLevelNo = data.player1.level;
        player.bestLevelReached = data.player1.bestLevel || 0;
        
        player2.currentPos = createVector(data.player2.x, data.player2.y);
        player2.currentLevelNo = data.player2.level;
        player2.bestLevelReached = data.player2.bestLevel || 0;
        console.log('Progress loaded!');
    }
}
