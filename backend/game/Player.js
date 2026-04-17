class Player {
    constructor(id, name, isBot = false) {
        this.id = id;
        this.name = name;
        this.isBot = isBot;
        
        // Game state
        this.score = 0;
        this.hand = []; // Array of 4 number cards (0-9)
        this.treasure = null; // Assigned treasure value (0-9)
        
        // Phase specific state
        this.intent = null; // 'BOAST' or 'SNEAK'
        this.sneakTarget = null; // ID of player or 'DUMMY'
        
        this.calledGlint = false;
        this.distance = null; // Distance from target. Penalty = 3
        this.submittedMath = false; // Flag to indicate if they submitted their distance
        this.submissionTime = null; // Timestamp of submission for tie-breaking
        this.fakeMathString = ""; // Used by bots
        
        this.draftedTreasure = null; // Stored treasure object during Looting phase
    }

    resetRoundState() {
        this.hand = [];
        this.treasure = null;
        this.intent = null;
        this.sneakTarget = null;
        this.calledGlint = false;
        this.distance = null;
        this.submittedMath = false;
        this.submissionTime = null;
        this.fakeMathString = "";
        this.draftedTreasure = null;
    }

    getSanitizedState() {
        // [RULE: Data Sanitization] Hide bot identities and private information
        return {
            id: this.id,
            name: this.name,
            score: this.score,
            intent: this.intent,
            calledGlint: this.calledGlint,
            submittedMath: this.submittedMath,
            // We only send distance to clients *after* the scramble phase or if it's the current player
            // This logic is handled by the Engine broadcasting
        };
    }
}

module.exports = Player;
