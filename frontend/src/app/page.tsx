"use client";

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import Lobby from '@/components/Lobby';
import GameBoard from '@/components/GameBoard';
import AuditLog from '@/components/AuditLog';

export default function Home() {
    const [gameState, setGameState] = useState<any>(null);
    const [privateState, setPrivateState] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<string[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        socket.on('connect', () => {
            setConnected(true);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('game_state', (state: any) => {
            setGameState(state);
        });

        socket.on('private_state', (state: any) => {
            setPrivateState(state);
        });

        socket.on('audit_event', (message: string) => {
            setAuditLogs(prev => [...prev, message]);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('game_state');
            socket.off('private_state');
            socket.off('audit_event');
        };
    }, []);

    return (
        <main className="min-h-screen bg-black text-white font-sans flex flex-col items-center py-12 px-4 selection:bg-yellow-500 selection:text-black">
            
            <header className="mb-10 text-center">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                    GLINT
                </h1>
                <p className="text-gray-400 mt-2 font-medium tracking-wide">Multiplayer QA Prototype</p>
                {!connected && (
                    <div className="mt-4 text-red-500 text-sm font-bold animate-pulse">
                        Connecting to server...
                    </div>
                )}
            </header>

            {!gameState || gameState.phase === 'Lobby' ? (
                <Lobby gameState={gameState || {}} />
            ) : (
                <GameBoard gameState={gameState} privateState={privateState} />
            )}

            <AuditLog logs={auditLogs} />

        </main>
    );
}
