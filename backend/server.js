const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const Engine = require('./game/Engine');

const app = express();
const server = http.createServer(app);

// Enable CORS for the frontend URL
const corsOptions = {
    origin: ['http://localhost:3000', 'https://glint-livid-pi.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Basic rate limiting for HTTP endpoints
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const io = new Server(server, {
    cors: corsOptions
});

// Initialize the game engine
const gameEngine = new Engine(io);

// Simple connection rate limiting map
const connectionCounts = new Map();
const MAX_CONNECTIONS_PER_IP = 5;

io.use((socket, next) => {
    const ip = socket.handshake.address;
    const currentCount = connectionCounts.get(ip) || 0;

    if (currentCount >= MAX_CONNECTIONS_PER_IP) {
        return next(new Error('Authentication error: Too many connections from this IP'));
    }

    connectionCounts.set(ip, currentCount + 1);
    
    socket.on('disconnect', () => {
        const count = connectionCounts.get(ip);
        if (count > 0) {
            connectionCounts.set(ip, count - 1);
        }
    });

    next();
});

io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // Join Lobby
    socket.on('join_lobby', ({ playerName }) => {
        // Basic input validation
        if (typeof playerName !== 'string' || playerName.trim().length === 0) {
            return socket.emit('error', 'Invalid player name');
        }
        gameEngine.addHumanPlayer(socket.id, playerName.trim().substring(0, 15));
    });

    // Add Bot
    socket.on('add_bot', ({ botType }) => {
        if (!['Random', 'Math Whiz', 'Speedster', 'Bluffer', 'Scavenger'].includes(botType)) {
            return socket.emit('error', 'Invalid bot type');
        }
        gameEngine.addBotPlayer(botType);
    });

    // Start Game
    socket.on('start_game', (options) => {
        gameEngine.startGame(options);
    });

    // Player Actions
    socket.on('declare_intent', ({ intent, targetId }) => {
        // [RULE: Declaration Phase Actions]
        if (!['BOAST', 'SNEAK'].includes(intent)) return;
        gameEngine.handleDeclaration(socket.id, intent, targetId);
    });

    socket.on('call_glint', () => {
        gameEngine.handleGlint(socket.id);
    });

    socket.on('submit_math', ({ distance }) => {
        // Input validation for distance
        if (typeof distance !== 'number' || distance < 0 || distance > 100) return;
        gameEngine.handleMathSubmission(socket.id, distance);
    });

    socket.on('draft_treasure', ({ treasureId }) => {
        if (!treasureId) return;
        gameEngine.handleDraftTreasure(socket.id, treasureId);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] User disconnected: ${socket.id}`);
        gameEngine.removePlayer(socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
