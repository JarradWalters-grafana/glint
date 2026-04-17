const Player = require('./Player');
const Bot = require('./Bot');
const Rules = require('./Rules');

class Engine {
    constructor(io) {
        this.io = io;
        this.players = new Map(); // id -> Player or Bot
        this.botCount = 0;
        
        this.phase = 'Lobby'; // Lobby, Setup, Declaration, Scramble, Looting, Scoring
        this.targetNumber = null;
        this.dummyTreasure = null;
        this.treasures = new Map(); // id -> { id, emoji, value }
        this.scrambleTimeout = 40; // Default 40 seconds
        
        // Drafting state
        this.draftQueue = [];
        this.currentDrafterId = null;
        
        this.glintCalled = false;
        this.glintCallerId = null;
        this.timer = 0;
        this.interval = null;

        this.auditLog = [];
    }

    logAudit(message) {
        this.auditLog.push(message);
        this.io.emit('audit_event', message);
    }

    addHumanPlayer(id, name) {
        if (this.phase !== 'Lobby') return;
        this.players.set(id, new Player(id, name));
        this.broadcastState();
    }

    addBotPlayer(botType) {
        if (this.phase !== 'Lobby') return;
        this.botCount++;
        const botId = `bot_${this.botCount}`;
        const actualType = botType === 'Random' ? ['Math Whiz', 'Speedster', 'Bluffer', 'Scavenger'][Math.floor(Math.random()*4)] : botType;
        
        const goblinNames = ['Snik', 'Gluk', 'Rizzo', 'Fizz', 'Borp', 'Krag', 'Zog', 'Snag', 'Grib', 'Nez', 'Plonk', 'Mug'];
        const randomName = goblinNames[Math.floor(Math.random() * goblinNames.length)];
        
        this.players.set(botId, new Bot(botId, randomName, actualType));
        this.broadcastState();
    }

    removePlayer(id) {
        this.players.delete(id);
        const humanCount = Array.from(this.players.values()).filter(p => !p.isBot).length;
        if (humanCount === 0) {
            this.resetGame();
        } else {
            this.broadcastState();
        }
    }

    resetGame() {
        this.phase = 'Lobby';
        this.players.clear();
        this.botCount = 0;
        this.auditLog = [];
        this.treasures.clear();
        this.draftQueue = [];
        this.currentDrafterId = null;
        this.stopTick();
    }

    startGame(options = {}) {
        if (this.phase !== 'Lobby' || this.players.size < 2) return;
        this.scrambleTimeout = options.scrambleTimeout || 40;
        this.logAudit(`System: Game Started! (Scramble Fuse: ${this.scrambleTimeout}s)`);
        this.startSetupPhase();
    }

    // --- PHASES ---

    startSetupPhase() {
        this.phase = 'Setup';
        const emojis = ['🍌', '💎', '🦴', '🍎', '🗡️', '👑', '🛡️', '🔮'];
        let availableEmojis = [...emojis];
        
        const getTreasure = (id) => {
            const emojiIndex = Math.floor(Math.random() * availableEmojis.length);
            const emoji = availableEmojis.splice(emojiIndex, 1)[0];
            return {
                id: id,
                emoji: emoji,
                value: Math.floor(Math.random() * 10)
            };
        };

        this.treasures.clear();
        this.dummyTreasure = getTreasure('DUMMY');
        this.treasures.set('DUMMY', this.dummyTreasure);
        
        for (const player of this.players.values()) {
            player.resetRoundState();
            const t = getTreasure(player.id);
            player.treasure = t;
            this.treasures.set(player.id, t);
            player.hand = Array.from({length: 4}, () => Math.floor(Math.random() * 10));
        }
        
        this.logAudit("System: Treasures and Hands dealt.");
        this.broadcastState();

        // Move to declaration after a short delay
        setTimeout(() => this.startDeclarationPhase(), 3000);
    }

    startDeclarationPhase() {
        this.phase = 'Declaration';
        this.logAudit("System: Declaration Phase started. BOAST or SNEAK.");
        this.broadcastState();
        this.startTick();
    }

    handleDeclaration(playerId, intent, targetId) {
        if (this.phase !== 'Declaration') return;
        const player = this.players.get(playerId);
        if (!player || player.intent !== null) return;

        player.intent = intent;
        player.sneakTarget = targetId;

        // Note: For prototype, we won't broadcast exactly who sneaked who to keep it hidden,
        // but we'll log it for debugging/QA.
        this.logAudit(`${player.name} declared intent.`);

        // Check if all players declared
        const allDeclared = Array.from(this.players.values()).every(p => p.intent !== null);
        if (allDeclared) {
            this.stopTick();
            setTimeout(() => this.startScramblePhase(), 1000);
        } else {
            this.broadcastState();
        }
    }

    startScramblePhase() {
        this.phase = 'Scramble';
        this.targetNumber = Math.floor(Math.random() * 90) + 10; // 10-99
        this.glintCalled = false;
        this.glintCallerId = null;
        this.timer = 0;

        for (const p of this.players.values()) {
            if (p.isBot) p.tickCounter = 0; // reset bot timers
        }

        this.logAudit(`System: Target Number is ${this.targetNumber}!`);
        this.broadcastState();
        this.startTick();
    }

    handleGlint(playerId) {
        if (this.phase !== 'Scramble' || this.glintCalled) return;
        const player = this.players.get(playerId);
        if (!player) return;

        this.glintCalled = true;
        this.glintCallerId = playerId;
        this.timer = this.scrambleTimeout; // Configurable timer starts

        player.calledGlint = true;
        this.logAudit(`${player.name} called GLINT! ${this.timer} seconds remaining.`);
        this.broadcastState();
    }

    handleMathSubmission(playerId, distance, isPenalty = false, fakeMathString = "") {
        if (this.phase !== 'Scramble' || !this.glintCalled) return;
        const player = this.players.get(playerId);
        if (!player || player.submittedMath) return;

        player.submittedMath = true;
        player.distance = distance;
        player.submissionTime = Date.now();
        if (isPenalty) player.distance = 3; // Enforce penalty score value

        if (player.isBot) {
            player.fakeMathString = fakeMathString;
            this.logAudit(`${player.name} claimed ${distance === 0 ? 'EXACT' : distance + ' AWAY'} with formula: ${fakeMathString}`);
        } else {
            this.logAudit(`${player.name} claimed ${distance === 0 ? 'EXACT' : distance + ' AWAY'}!`);
        }

        // Check if everyone has submitted or called glint
        const everyoneDone = Array.from(this.players.values()).every(p => p.calledGlint || p.submittedMath);
        if (everyoneDone) {
            this.endScramblePhase();
        } else {
            this.broadcastState();
        }
    }

    endScramblePhase() {
        this.stopTick();
        
        // Anyone who didn't submit gets a penalty
        for (const p of this.players.values()) {
            if (!p.calledGlint && !p.submittedMath) {
                p.distance = 3; // Penalty
                this.logAudit(`${p.name} ran out of time!`);
            }
        }

        this.startLootingPhase();
    }

    startLootingPhase() {
        this.phase = 'Looting';
        this.logAudit("System: Looting Phase (The Draft) Started!");
        
        // Build Draft Queue (Option 2: Accuracy over Speed)
        const solvers = [];
        const failedBoasters = [];
        const scavengers = [];

        for (const player of this.players.values()) {
            // Did they fail?
            if (player.distance > 4 || player.distance === 3 && player.fakeMathString === "PASS") {
                if (player.intent === 'BOAST') failedBoasters.push(player);
                else scavengers.push(player);
            } else {
                solvers.push(player);
            }
        }

        // Sort solvers by distance first (accuracy), then by submissionTime (speed)
        solvers.sort((a, b) => {
            if (a.distance !== b.distance) return a.distance - b.distance;
            return a.submissionTime - b.submissionTime;
        });

        // Scavengers sorted by reverse score
        scavengers.sort((a, b) => a.score - b.score);

        // First solver edge case: Boaster must take own item unless stolen. Since they are first, it's never stolen.
        // Queue order: Solvers -> Failed Boasters -> Scavengers
        this.draftQueue = [...solvers, ...failedBoasters, ...scavengers].map(p => p.id);
        
        this.advanceDraftTurn();
    }

    advanceDraftTurn() {
        if (this.draftQueue.length === 0) {
            this.currentDrafterId = null;
            setTimeout(() => this.startScoringPhase(), 2000);
            return;
        }

        this.currentDrafterId = this.draftQueue.shift();
        const player = this.players.get(this.currentDrafterId);
        
        this.logAudit(`System: It is ${player.name}'s turn to draft.`);
        this.broadcastState();
        this.startTick(); // Restart tick for bot drafting
    }

    handleDraftTreasure(playerId, treasureId) {
        if (this.phase !== 'Looting' || this.currentDrafterId !== playerId) return;
        
        const player = this.players.get(playerId);
        const treasure = this.treasures.get(treasureId);
        
        if (!treasure) return;

        // Apply intent constraints
        if (player.intent === 'BOAST') {
            // Must take own item if it is still available
            const ownAvailable = this.treasures.has(player.id);
            if (ownAvailable && treasureId !== player.id) {
                // Illegal move, must take own
                return;
            }
        } else if (player.intent === 'SNEAK') {
            // Cannot take own item
            if (treasureId === player.id) {
                return;
            }
        }

        player.draftedTreasure = treasure;
        this.treasures.delete(treasureId); // Remove from available
        this.logAudit(`${player.name} drafted treasure ${treasure.emoji}`);
        
        this.advanceDraftTurn();
    }

    startScoringPhase() {
        this.phase = 'Scoring';
        this.stopTick();
        
        let winner = null;

        for (const player of this.players.values()) {
            const roundPoints = Rules.calculateScore(player.draftedTreasure, player.distance);
            player.score += roundPoints;
            this.logAudit(`${player.name} scored ${roundPoints} points. Total: ${player.score}`);

            if (player.score >= 40) {
                winner = player;
            }
        }

        this.broadcastState();

        if (winner) {
            this.logAudit(`System: ${winner.name} WINS the game!`);
            this.phase = 'GameOver';
            this.winnerId = winner.id;
            this.broadcastState(); // Broadcast the new phase
            setTimeout(() => this.resetGame(), 15000);
        } else {
            setTimeout(() => this.startSetupPhase(), 5000);
        }
    }

    // --- TICK LOOP (For Bots & Timers) ---

    startTick() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.tick(), 1000);
    }

    stopTick() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
    }

    tick() {
        // Handle Global Timers
        if (this.phase === 'Scramble' && this.glintCalled) {
            this.timer--;
            this.broadcastState(); // Update timer on clients
            
            if (this.timer <= 0) {
                this.endScramblePhase();
                return;
            }
        }

        // Let bots act
        const stateForBots = {
            phase: this.phase,
            targetNumber: this.targetNumber,
            glintCalled: this.glintCalled,
            timer: this.timer,
            currentDrafterId: this.currentDrafterId,
            availableTreasures: Array.from(this.treasures.values())
        };

        for (const player of this.players.values()) {
            if (player.isBot) {
                player.tick(stateForBots, this);
            }
        }
    }

    // --- COMMUNICATION ---

    broadcastState() {
        const publicPlayers = Array.from(this.players.values()).map(p => {
            const data = p.getSanitizedState();
            // Show drafted emoji if they have one
            if (p.draftedTreasure) {
                data.draftedEmoji = p.draftedTreasure.emoji;
            }
            return data;
        });

        const state = {
            phase: this.phase,
            targetNumber: this.targetNumber,
            glintCalled: this.glintCalled,
            timer: this.timer,
            players: publicPlayers,
            dummyTreasure: this.phase === 'Lobby' ? null : 'Hidden', // Simplification
            availableTreasures: Array.from(this.treasures.values()).map(t => ({ id: t.id, emoji: t.emoji })), // Hide values publicly
            currentDrafterId: this.currentDrafterId,
            winnerId: this.winnerId
        };

        // Send public state to everyone
        this.io.emit('game_state', state);

        // Send private state to individual humans
        for (const player of this.players.values()) {
            if (!player.isBot) {
                let sneakedValue = null;
                if (player.intent === 'SNEAK' && player.sneakTarget) {
                    if (player.sneakTarget === 'DUMMY') {
                        sneakedValue = this.dummyTreasure.value;
                    } else {
                        const targetPlayer = this.players.get(player.sneakTarget);
                        if (targetPlayer && targetPlayer.treasure) sneakedValue = targetPlayer.treasure.value;
                    }
                }

                this.io.to(player.id).emit('private_state', {
                    hand: player.hand,
                    treasure: player.treasure,
                    intent: player.intent,
                    distance: player.distance,
                    sneakedValue: sneakedValue
                });
            }
        }
    }
}

module.exports = Engine;
