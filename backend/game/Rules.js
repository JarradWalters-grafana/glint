// Helper for evaluating math expressions
function evaluateExpression(cards) {
    // A simple brute force approach to find possible outcomes from 4 cards
    // using basic operators (+, -, *, /).
    // This is computationally intensive if done exhaustively, so we will
    // use a simplified permutation and combination approach for the prototype.
    const results = new Map(); // outcome -> string representation

    const operators = ['+', '-', '*', '/'];
    
    // Generate all permutations of cards
    const permute = (arr) => {
        if (arr.length <= 1) return [arr];
        let perms = [];
        for (let i = 0; i < arr.length; i++) {
            let rest = permute(arr.slice(0, i).concat(arr.slice(i + 1)));
            for (let j = 0; j < rest.length; j++) {
                perms.push([arr[i]].concat(rest[j]));
            }
        }
        return perms;
    };

    const cardPerms = permute(cards);

    for (const p of cardPerms) {
        for (const op1 of operators) {
            for (const op2 of operators) {
                for (const op3 of operators) {
                    // Try pattern: ((A op1 B) op2 C) op3 D
                    try {
                        let step1 = eval(`${p[0]} ${op1} ${p[1]}`);
                        let step2 = eval(`${step1} ${op2} ${p[2]}`);
                        let result = eval(`${step2} ${op3} ${p[3]}`);
                        
                        // Keep only integers between 10 and 99
                        if (Number.isInteger(result) && result >= 0 && result <= 99) {
                            results.set(result, `((${p[0]} ${op1} ${p[1]}) ${op2} ${p[2]}) ${op3} ${p[3]}`);
                        }
                    } catch (e) {
                        // Ignore divide by zero or other errors
                    }

                    // Try pattern: (A op1 B) op2 (C op3 D)
                    try {
                        let step1 = eval(`${p[0]} ${op1} ${p[1]}`);
                        let step2 = eval(`${p[2]} ${op3} ${p[3]}`);
                        let result = eval(`${step1} ${op2} ${step2}`);
                        
                        if (Number.isInteger(result) && result >= 0 && result <= 99) {
                            results.set(result, `(${p[0]} ${op1} ${p[1]}) ${op2} (${p[2]} ${op3} ${p[3]})`);
                        }
                    } catch (e) {}
                }
            }
        }
    }

    return results; // Map of { number: "expression string" }
}

class Rules {
    static calculateBotMath(hand, target, persona) {
        // [AI_PERSONA: Logic for bot math calculation]
        const possibleResults = evaluateExpression(hand);
        
        let bestDistance = 999;
        let bestResult = null;
        let bestExpression = "";

        if (possibleResults.size === 0) {
            // Fallback if no valid expressions found (rare but possible)
            return { distance: 3, expression: "PASS", isPenalty: true };
        }

        // Default logic: find the absolute best they can do
        for (const [res, expr] of possibleResults.entries()) {
            const dist = Math.abs(target - res);
            if (dist < bestDistance) {
                bestDistance = dist;
                bestResult = res;
                bestExpression = expr;
            }
        }

        if (persona === 'Bluffer') {
            // Bluffer might lie. If they couldn't get exact, they might claim EXACT anyway,
            // or they might provide an intentionally wrong formula if they are far away.
            if (bestDistance > 0 && Math.random() < 0.5) {
                return { distance: 0, expression: `[Lied] ${bestExpression} != ${target}`, isPenalty: false };
            }
        } else if (persona === 'Speedster') {
            // Speedster grabs the first thing that's "close enough" (<= 2)
            for (const [res, expr] of possibleResults.entries()) {
                const dist = Math.abs(target - res);
                if (dist <= 2) {
                    return { distance: dist, expression: expr, isPenalty: false };
                }
            }
        } else if (persona === 'Math Whiz') {
            // Math whiz always finds the absolute best, already calculated above
        } else if (persona === 'Scavenger') {
            // Scavenger might just pass if they sneaked a good item
            if (Math.random() < 0.3) {
                 return { distance: 3, expression: "PASS", isPenalty: true };
            }
        }

        // If they couldn't hit <= 4 away, they might just take a penalty in the real game,
        // but for prototype bots, let's just submit their best attempt, clamped to 4 or Penalty(3).
        // The UI shortcuts are EXACT(0), 1 AWAY(1), <5 AWAY(2-4), PASS(Penalty=3)
        let reportedDistance = bestDistance;
        let isPenalty = false;

        if (bestDistance > 4) {
            reportedDistance = 3;
            isPenalty = true;
            bestExpression = "PASS";
        }

        return {
            distance: reportedDistance,
            expression: bestExpression,
            isPenalty: isPenalty
        };
    }

    // [RULE: Scoring]
    static calculateScore(draftedTreasure, distance) {
        if (!draftedTreasure) return 0; // Did not participate or draft
        if (distance === null || distance === undefined) return 0;
        
        let penalty = distance;
        // If they passed or failed, distance penalty is 3
        if (distance > 4 || distance === 3 && arguments[2] === true) { 
             penalty = 3;
        }

        const score = draftedTreasure.value - penalty;
        return Math.max(0, score); // Cannot go below 0
    }
}

module.exports = Rules;
