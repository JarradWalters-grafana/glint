# GLINT Game Prototype Implementation Plan

We will build a lightweight, multiplayer, web-based QA prototype for the tabletop game "GLINT". The app will be divided into two main components: a Next.js frontend and a Node.js/Socket.io backend. The backend will act as the authoritative source of truth.

## Proposed Changes

### Backend (Node.js + Socket.io)

The backend will handle game state, bot logic, and real-time communication.

#### [NEW] backend/package.json
- Initialize a Node.js project.
- Dependencies: `express`, `socket.io`, `cors`.

#### [NEW] backend/server.js
- Set up Express and Socket.io.
- Handle client connections and initial lobby management.
- Route socket events to the `GameEngine`.

#### [NEW] backend/game/Engine.js
- Implements the core State Machine.
- Phases: `Lobby` -> `Setup` -> `Declaration` -> `Scramble` -> `Looting` -> `Scoring`.
- Manages the tick rate (e.g., 1-second intervals for bots to process actions).
- Provides methods to broadcast sanitized game state to clients (stripping bot personas).
- Uses specific tags like `// [RULE: ...]` in comments.

#### [NEW] backend/game/Player.js
- Base class representing a participant (Human or Bot).
- Stores standard player state: score, hand, treasure, current intent, distance.

#### [NEW] backend/game/Bot.js
- Inherits from `Player`.
- Implements the tick logic for the 4 distinct personas (`Math Whiz`, `Speedster`, `Bluffer`, `Scavenger`).
- Uses `// [AI_PERSONA: ...]` tags for documentation.
- Simulates fake math strings and emits "GLINT!" based on persona rules.

### Frontend (Next.js + Tailwind CSS)

The frontend will act as a "dumb" client, rendering the state provided by the server and capturing human actions.

#### [NEW] frontend/ (Next.js Application)
- Scaffolded using `npx create-next-app@latest`.
- Uses Tailwind CSS for rapid styling.
- Dependencies: `socket.io-client`.

#### [NEW] frontend/src/components/Lobby.js
- Allows a host to start the game.
- UI to add "Human", "Specific Bot (e.g., Bluffer)", or "Random Bot" to the game slots.

#### [NEW] frontend/src/components/GameBoard.js
- Renders the current game phase.
- **Scramble Phase UI:** Displays the Target Number and the 4 shortcut buttons (`[ EXACT ]`, `[ 1 AWAY ]`, `[ < 5 AWAY ]`, `[ PASS ]`) for humans instead of a drag-and-drop calculator.
- Emits human intent/distance to the server.

#### [NEW] frontend/src/components/AuditLog.js
- A scrolling feed showing events broadcasted from the server.
- Example: "System: Target is 42!", "Bot 2 claimed EXACT with formula: (8 * 5) + 2".

#### [NEW] frontend/src/lib/socket.js
- Initializes and exports the Socket.io client connection to the backend.

#### [MODIFY] frontend/src/app/page.js
- The main entry point.
- Listens to backend state updates and renders the appropriate components (Lobby vs. GameBoard).
- Manages the global state derived from the server's broadcast.

## Verification Plan

### Automated Tests
- N/A for this rapid prototype. We will rely on manual testing of the State Machine and Socket events.

### Manual Verification
- Start the Node.js backend.
- Start the Next.js frontend dev server.
- Open multiple browser tabs (or use different browsers) to connect as humans.
- Add bots through the Lobby UI.
- Transition through the phases: Setup -> Declaration -> Scramble -> Looting -> Scoring.
- Verify bots act autonomously according to their personas during the Scramble phase.
- Ensure the Game Chat / Audit Log displays correct information.
- Verify points are calculated correctly and game ends at 40 points.

## User Review Required

> [!IMPORTANT]
> - Do you have a preference for which port the backend runs on (e.g., `3001`) vs the frontend (e.g., `3000`)?
> - For bot math generation, should they simply generate a random plausible string based on their distance, or actually solve a mathematical equation from simulated cards? The prompt suggests a fake text string, so I'll aim for "simulated fake string" logic to save complexity, unless you advise otherwise.
