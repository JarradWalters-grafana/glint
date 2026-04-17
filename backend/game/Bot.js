const Player = require('./Player');
const Rules = require('./Rules');

class Bot extends Player {
    constructor(id, name, persona) {
        super(id, name, true);
        this.persona = persona; // 'Random', 'Math Whiz', 'Speedster', 'Bluffer', 'Scavenger'
        this.tickCounter = 0;
        this.actionDelay = this.getRandomDelay();
    }

    getRandomDelay() {
        // Different personas might have different base reaction times
        let base = 5; // Slowed down from 2
        if (this.persona === 'Speedster') base = 3;
        if (this.persona === 'Math Whiz') base = 8; // Takes longer to calculate
        return base + Math.floor(Math.random() * 5); // 3-12 seconds roughly
    }

    resetRoundState() {
        super.resetRoundState();
        this.tickCounter = 0;
        this.actionDelay = this.getRandomDelay();
    }

    // Called every second by the Engine
    tick(gameState, engine) {
        this.tickCounter++;

        switch (gameState.phase) {
            case 'Declaration':
                this.handleDeclarationPhase(engine);
                break;
            case 'Scramble':
                this.handleScramblePhase(gameState, engine);
                break;
            case 'Looting':
                this.handleLootingPhase(gameState, engine);
                break;
        }
    }

    handleLootingPhase(gameState, engine) {
        if (gameState.currentDrafterId !== this.id) return;
        
        if (this.tickCounter >= this.actionDelay) {
            const available = gameState.availableTreasures;
            if (available.length === 0) return;

            let chosenTreasureId = null;

            if (this.intent === 'BOAST') {
                // Must take own if available
                const ownAvailable = available.find(t => t.id === this.id);
                if (ownAvailable) {
                    chosenTreasureId = this.id;
                } else {
                    // Stolen, pick random
                    chosenTreasureId = available[Math.floor(Math.random() * available.length)].id;
                }
            } else if (this.intent === 'SNEAK') {
                // Cannot pick own
                const validOptions = available.filter(t => t.id !== this.id);
                if (validOptions.length > 0) {
                    // Scavenger prioritizing Dummy if sneaked it
                    if (this.persona === 'Scavenger' && this.sneakTarget === 'DUMMY' && available.find(t => t.id === 'DUMMY')) {
                        chosenTreasureId = 'DUMMY';
                    } else {
                        chosenTreasureId = validOptions[Math.floor(Math.random() * validOptions.length)].id;
                    }
                }
            }

            // Fallback
            if (!chosenTreasureId) chosenTreasureId = available[0].id;

            engine.handleDraftTreasure(this.id, chosenTreasureId);
        }
    }

    handleDeclarationPhase(engine) {
        if (this.intent !== null) return; // Already acted

        if (this.tickCounter >= this.actionDelay) {
            // [AI_PERSONA: Declaration Logic]
            let chosenIntent = 'BOAST';
            let targetId = null;

            if (this.persona === 'Scavenger') {
                chosenIntent = 'SNEAK';
                targetId = 'DUMMY'; // Always sneaks the dummy for simplicity
            } else if (this.persona === 'Bluffer') {
                // Bluffer boasts on low numbers to trick people, sneaks on high numbers
                if (this.treasure < 5) chosenIntent = 'BOAST';
                else chosenIntent = 'SNEAK';
            } else {
                // Random/Math Whiz/Speedster just guess based on treasure value heuristically
                if (this.treasure >= 6) chosenIntent = 'BOAST';
                else chosenIntent = Math.random() > 0.5 ? 'BOAST' : 'SNEAK';
            }

            // Assign a random player as target if SNEAK and not Scavenger
            if (chosenIntent === 'SNEAK' && targetId === null) {
                 // Try to pick a random opponent
                 const opponentIds = Array.from(engine.players.keys()).filter(id => id !== this.id);
                 if (opponentIds.length > 0) {
                     targetId = opponentIds[Math.floor(Math.random() * opponentIds.length)];
                 } else {
                     targetId = 'DUMMY';
                 }
            }

            engine.handleDeclaration(this.id, chosenIntent, targetId);
        }
    }

    handleScramblePhase(gameState, engine) {
        if (this.submittedMath) return;

        // Has someone called GLINT?
        if (!gameState.glintCalled) {
            // Should I call GLINT?
            if (this.tickCounter >= this.actionDelay) {
                // Pre-calculate to see if we CAN hit it well
                const mathResult = Rules.calculateBotMath(this.hand, gameState.targetNumber, this.persona);
                
                let shouldCall = false;
                if (this.persona === 'Speedster' && mathResult.distance <= 2) shouldCall = true;
                if (this.persona === 'Math Whiz' && mathResult.distance === 0) shouldCall = true;
                if (this.persona === 'Bluffer' && Math.random() < 0.3) shouldCall = true; // Bluffs a glint call
                
                // If we've waited long enough (e.g. 8 seconds), someone should just call it
                if (this.tickCounter > 8) shouldCall = true;

                if (shouldCall) {
                    engine.handleGlint(this.id);
                }
            }
        } else {
            // GLINT was called, we are in the 10-second timer
            // We need to submit our math
            if (this.tickCounter >= this.actionDelay) {
                const mathResult = Rules.calculateBotMath(this.hand, gameState.targetNumber, this.persona);
                
                this.fakeMathString = mathResult.expression;
                
                engine.handleMathSubmission(this.id, mathResult.distance, mathResult.isPenalty, this.fakeMathString);
            }
        }
    }
}

module.exports = Bot;
