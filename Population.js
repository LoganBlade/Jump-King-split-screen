let alreadyShowingSnow = false;



class Population {

    constructor(size) {
        this.popSize = size;
        this.players = [];
        for (let i = 0; i < size; i++) {
            this.players.push(new Player());
        }

        this.showingFail = false;
        this.failPlayerNo = 0;
        this.bestPlayerIndex = 0;
        this.currentHighestPlayerIndex = 0;
        this.fitnessSum = 0;
        this.gen = 1;
        this.bestHeight = 0;
        this.showingLevelNo = 0;
        this.currentBestLevelReached = 0;
        this.purgeTheSlackers = false;
        this.reachedBestLevelAtActionNo = 0;
        this.newLevelReached = false;
        this.cloneOfBestPlayerFromPreviousGeneration = this.players[0].clone();
        this.checkpointState = null; // PlayerState snapshot for the current best level checkpoint
        // No local persistence for checkpoints; file-based only
        this.requiredSuccessfulPlayersForLevel = 5; // require this many players to reach a level before it's unlocked
        this.latestCandidateSuccessCount = 0; // last generation's candidate success count
    }

    Update() {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].Update();
            // if(this.players[i].currentLevelNo >0 && !this.showingFail ){
            //     this.showingFail= true;
            //     this.failPlayerNo = i;
            //     this.ResetAllPlayers()
            // }
        }

    }

    SetBestPlayer() {

        this.bestPlayerIndex = 0;
        this.newLevelReached = false;
        // Reset candidate success count for this generation; we'll recompute if there's a candidate
        this.latestCandidateSuccessCount = 0;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].bestHeightReached > this.players[this.bestPlayerIndex].bestHeightReached) {
                this.bestPlayerIndex = i;
            }
        }

        if (this.players[this.bestPlayerIndex].bestLevelReached > this.currentBestLevelReached) {
            let candidateLevel = this.players[this.bestPlayerIndex].bestLevelReached;
            // Count how many players have reached this candidate level
            let count = 0;
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].bestLevelReached >= candidateLevel) count++;
            }
            this.latestCandidateSuccessCount = count;
            // Only unlock the candidate level if at least requiredSuccessfulPlayersForLevel players did it
            if (count >= this.requiredSuccessfulPlayersForLevel) {
                this.currentBestLevelReached = candidateLevel;
                this.newLevelReached = true;
                this.reachedBestLevelAtActionNo = this.players[this.bestPlayerIndex].bestLevelReachedOnActionNo;
                print("NEW LEVEL, action number", this.reachedBestLevelAtActionNo)
                console.log('Checkpoint saved: level ' + this.currentBestLevelReached + ' at action ' + this.reachedBestLevelAtActionNo + ' (count=' + count + ')');
                // Save a checkpoint state from the player's saved start-of-best-level state (if present)
                if (this.players[this.bestPlayerIndex].playerStateAtStartOfBestLevel) {
                    this.checkpointState = this.players[this.bestPlayerIndex].playerStateAtStartOfBestLevel.clone();
                } else {
                    // Fallback: capture current player state
                    let tempState = new PlayerState();
                    tempState.getStateFromPlayer(this.players[this.bestPlayerIndex]);
                    this.checkpointState = tempState;
                }
                // No local persistence for checkpoints; file-based only
                // Auto-save snapshot when a new level is reached if configured
                if (typeof autoSaveSnapshotsOnNewLevel !== 'undefined' && autoSaveSnapshotsOnNewLevel) {
                    this.saveSnapshotToFile();
                }
            } else {
                // Not enough players yet — candidate not unlocked (but track count)
                console.log('Candidate level ' + candidateLevel + ' reached by ' + count + ' players; need ' + this.requiredSuccessfulPlayersForLevel);
            }
        }
        this.bestHeight = this.players[this.bestPlayerIndex].bestHeightReached;
    }

    SetCurrentHighestPlayer() {
        this.currentHighestPlayerIndex = 0;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].GetGlobalHeight() > this.players[this.currentHighestPlayerIndex].GetGlobalHeight()) {
                this.currentHighestPlayerIndex = i;
            }
        }
    }

    Show() {

        this.SetCurrentHighestPlayer()
        let highestPlayer = this.players[this.currentHighestPlayerIndex];
        let highestLevelNo = this.players[this.currentHighestPlayerIndex].currentLevelNo;

        if(highestPlayer.currentLevelNo > highestPlayer.bestLevelReached && !highestPlayer.progressionCoinPickedUp){
            highestLevelNo -=1;
        }
        showLevel(highestLevelNo);
        alreadyShowingSnow = false;
        this.showingLevelNo = highestLevelNo;
        // Build a list of players in the visible level range
        let visiblePlayers = [];
        for (let i = 0; i < this.players.length; i++) {
            let p = this.players[i];
            if (p.currentLevelNo >= highestLevelNo - 1 && p.currentLevelNo <= highestLevelNo) {
                visiblePlayers.push(p);
            }
        }
        // Determine how many to draw based on global renderQuality (fallback to medium if undefined)
        let maxToDraw = 100;
        try {
            if (typeof renderQuality !== 'undefined' && renderQuality) {
                if (renderQuality === 'low') maxToDraw = 20;
                else if (renderQuality === 'medium') maxToDraw = 100;
                else if (renderQuality === 'high') maxToDraw = Math.max(this.players.length, 1000);
            }
        } catch (e) { }
        // If too many visible players, sort by descending global height and slice
        if (visiblePlayers.length > maxToDraw) {
            visiblePlayers.sort((a, b) => b.GetGlobalHeight() - a.GetGlobalHeight());
            visiblePlayers = visiblePlayers.slice(0, maxToDraw);
        }
        // Finally show the selected set
        try { window.lastVisiblePlayersRendered = visiblePlayers.length; } catch(e) {}
        for (let p of visiblePlayers) {
            p.Show();
        }

        // this.ShowPopulationInfo();

    }


    ResetAllPlayers() {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].ResetPlayer();
        }
    }

    IncreasePlayerMoves(increaseBy) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].brain.increaseMoves(increaseBy);
        }
    }

    AllPlayersFinished() {
        for (let i = 0; i < this.players.length; i++) {
            if (!this.players[i].hasFinishedInstructions) {
                return false;
            }
        }
        return true;
    }

    NaturalSelection() {
        let nextGen = [];
        this.SetBestPlayer();
        this.CalculateFitnessSum();

        this.cloneOfBestPlayerFromPreviousGeneration = this.players[this.bestPlayerIndex].clone();

        // Choose checkpoint state if available and checkpoint mode enabled.
        // Apply the checkpoint if it exists at all; also fallback to cloneOfBestPlayer when a new level was just reached.
        let bestStartState = null;
        if (typeof enableCheckpointMode !== 'undefined' && enableCheckpointMode && this.currentBestLevelReached !== 0) {
            if (this.checkpointState) {
                bestStartState = this.checkpointState.clone();
            } else if (this.newLevelReached && this.cloneOfBestPlayerFromPreviousGeneration && this.cloneOfBestPlayerFromPreviousGeneration.playerStateAtStartOfBestLevel) {
                bestStartState = this.cloneOfBestPlayerFromPreviousGeneration.playerStateAtStartOfBestLevel.clone();
            }
        }

        nextGen.push(this.players[this.bestPlayerIndex].clone());
        for (let i = 1; i < this.players.length; i++) {
            let parent = this.SelectParent();
            let baby = parent.clone()
            // if the parent fell to the previous level then mutate the baby at the action that caused them to fall
            if(parent.fellToPreviousLevel){
                baby.brain.mutateActionNumber(parent.fellOnActionNo);
            }
            baby.brain.mutate();
            nextGen.push(baby);
        }

        this.players = [];
        for (let i = 0; i < nextGen.length; i++) {
            this.players[i] = nextGen[i];
            // If checkpoint mode is on and we captured a best start state, set it for every player
            if (bestStartState) {
                this.players[i].playerStateAtStartOfBestLevel = bestStartState.clone();
                this.players[i].loadStartOfBestLevelPlayerState();
                // Set brain action number depending on checkpoint carry setting
                // Always carry the parent's action number when resuming at a checkpoint
                if (bestStartState.brainActionNumber !== undefined) {
                    this.players[i].brain.currentInstructionNumber = bestStartState.brainActionNumber;
                }
            }
        }

        this.gen++;
        if (bestStartState) {
            console.log('Applied checkpoint to next generation, level: ' + this.currentBestLevelReached);
        }
        // Reset new level flag to stop flashing the HUD next frame
        this.newLevelReached = false;
    }

    // Removed localStorage-based checkpoint persistence; file-based only

    // Save checkpoint state to downloadable file
    saveCheckpointToFile() {
        if (!this.checkpointState) return;
        try {
            const obj = {
                type: 'checkpoint',
                generation: this.gen,
                level: this.currentBestLevelReached,
                checkpoint: this.checkpointState.toJSON(),
                savedAt: new Date().toISOString()
            };
            const json = JSON.stringify(obj, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const filename = 'jumpking_checkpoint_gen_' + this.gen + '_level_' + this.currentBestLevelReached + '.json';
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            console.log('Checkpoint file created: ' + filename);
        } catch (e) {
            console.error('Failed to save checkpoint to file', e);
        }
    }

    // Save a snapshot containing both the brain and checkpoint to a downloadable file
    saveSnapshotToFile() {
        if (!this.checkpointState) return;
        try {
            // Choose a brain to save: use the best player's brain if available, otherwise the clone
            let brainToSave = null;
            if (this.players && this.players.length > 0 && this.players[this.bestPlayerIndex]) {
                brainToSave = this.players[this.bestPlayerIndex].brain;
            } else if (this.cloneOfBestPlayerFromPreviousGeneration) {
                brainToSave = this.cloneOfBestPlayerFromPreviousGeneration.brain;
            }
            const obj = {
                type: 'snapshot',
                generation: this.gen,
                level: this.currentBestLevelReached,
                checkpoint: this.checkpointState.toJSON(),
                brain: brainToSave ? brainToSave.toJSON() : null,
                savedAt: new Date().toISOString()
            };
            const json = JSON.stringify(obj, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const filename = 'jumpking_snapshot_gen_' + this.gen + '_level_' + this.currentBestLevelReached + '.json';
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            console.log('Snapshot file created: ' + filename);
        } catch (e) {
            console.error('Failed to save snapshot to file', e);
        }
    }

    // Load a checkpoint file and apply to population
    async loadCheckpointFromFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data || data.type !== 'checkpoint' || !data.checkpoint) return null;
            this.checkpointState = PlayerState.fromJSON(data.checkpoint);
            if (this.checkpointState && this.checkpointState.bestLevelReached) {
                this.currentBestLevelReached = this.checkpointState.bestLevelReached;
            }
            // no local save
            console.log('Checkpoint loaded from file: level ' + this.currentBestLevelReached);
            return { generation: data.generation || 0, level: data.level || this.currentBestLevelReached };
        } catch (e) {
            console.error('Failed to parse checkpoint file', e);
            return null;
        }
    }

    // Apply snapshot data (object parsed from disk) and set population state
    applySnapshotData(data) {
        if (!data || data.type !== 'snapshot') return null;
        try {
            if (data.checkpoint) {
                this.checkpointState = PlayerState.fromJSON(data.checkpoint);
                if (this.checkpointState && this.checkpointState.bestLevelReached) {
                    this.currentBestLevelReached = this.checkpointState.bestLevelReached;
                }
            }
            if (data.generation !== undefined) {
                this.gen = data.generation;
            }
            // If a brain is present in the snapshot, apply it to all players
            if (data.brain) {
                const loadedBrain = Brain.fromJSON(data.brain);
                for (let i = 0; i < this.players.length; i++) {
                    this.players[i].brain = loadedBrain.clone();
                }
                // Keep a clone of the best as the basis for future generations
                this.cloneOfBestPlayerFromPreviousGeneration = this.players[this.bestPlayerIndex] ? this.players[this.bestPlayerIndex].clone() : this.players[0].clone();
            }
            // If we have a checkpoint state, ensure each player's start-of-best-level player state is loaded
            if (this.checkpointState) {
                for (let i = 0; i < this.players.length; i++) {
                    this.players[i].playerStateAtStartOfBestLevel = this.checkpointState.clone();
                    this.players[i].loadStartOfBestLevelPlayerState();
                    if (this.checkpointState.brainActionNumber !== undefined) {
                        this.players[i].brain.currentInstructionNumber = this.checkpointState.brainActionNumber;
                    }
                    // Reset run state so they can start using the loaded snapshot
                    this.players[i].hasFinishedInstructions = false;
                    this.players[i].playersDead = false;
                    this.players[i].currentPos = this.players[i].currentPos || createVector(width / 2, height - 200);
                }
            }
            console.log('Snapshot applied: level ' + this.currentBestLevelReached + ' generation ' + this.gen);
            // Recompute best player after applying snapshot
            try { this.SetBestPlayer(); } catch (e) {}
            return { generation: this.gen, level: this.currentBestLevelReached };
        } catch (e) {
            console.error('Failed to apply snapshot data', e);
            return null;
        }
    }

    // Load a snapshot file and apply it (wrapper that reads the file)
    async loadSnapshotFromFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data || data.type !== 'snapshot') return null;
            return this.applySnapshotData(data);
        } catch (e) {
            console.error('Failed to parse snapshot file', e);
            return null;
        }
    }

    CalculateFitnessSum() {
        this.fitnessSum = 0;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].CalculateFitness();
            // if (this.players[i].bestLevelReached < this.players[this.bestPlayerIndex].bestLevelReached) {
            //     this.players[i].fitness = 0;
            // }<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            this.fitnessSum += this.players[i].fitness;
        }
    }

    SelectParent() {
        let rand = random(this.fitnessSum);
        let runningSum = 0;
        for (let i = 0; i < this.players.length; i++) {
            runningSum += this.players[i].fitness;
            if (runningSum > rand) {
                return this.players[i];
            }
        }
        return null;
    }
}