import { io, Socket } from 'socket.io-client';

// Use environment variable or default to localhost:3001
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const socket: Socket = io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
});
