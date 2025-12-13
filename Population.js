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
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].bestHeightReached > this.players[this.bestPlayerIndex].bestHeightReached) {
                this.bestPlayerIndex = i;
            }
        }

        if (this.players[this.bestPlayerIndex].bestLevelReached > this.currentBestLevelReached) {
            this.currentBestLevelReached = this.players[this.bestPlayerIndex].bestLevelReached;
            this.newLevelReached = true;
            this.reachedBestLevelAtActionNo = this.players[this.bestPlayerIndex].bestLevelReachedOnActionNo;
            print("NEW LEVEL, action number", this.reachedBestLevelAtActionNo)
            console.log('Checkpoint saved: level ' + this.currentBestLevelReached + ' at action ' + this.reachedBestLevelAtActionNo);
            // Save a checkpoint state from the player's saved start-of-best-level state (if present)
            if (this.players[this.bestPlayerIndex].playerStateAtStartOfBestLevel) {
                this.checkpointState = this.players[this.bestPlayerIndex].playerStateAtStartOfBestLevel.clone();
            } else {
                // Fallback: capture current player state
                let tempState = new PlayerState();
                tempState.getStateFromPlayer(this.players[this.bestPlayerIndex]);
                this.checkpointState = tempState;
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
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].currentLevelNo >= highestLevelNo - 1 && this.players[i].currentLevelNo <=highestLevelNo ) {
                this.players[i].Show();
            }
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

        // Choose checkpoint state if available and checkpoint mode enabled
        let bestStartState = null;
        if (typeof enableCheckpointMode !== 'undefined' && enableCheckpointMode && this.newLevelReached && this.currentBestLevelReached !== 0) {
            if (this.checkpointState) {
                bestStartState = this.checkpointState.clone();
            } else if (this.cloneOfBestPlayerFromPreviousGeneration && this.cloneOfBestPlayerFromPreviousGeneration.playerStateAtStartOfBestLevel) {
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