import React, { useState } from 'react';
import { socket } from '@/lib/socket';

interface LobbyProps {
    gameState: any;
}

export default function Lobby({ gameState }: LobbyProps) {
    const [playerName, setPlayerName] = useState('');
    const [joined, setJoined] = useState(false);
    const [botType, setBotType] = useState('Random');
    const [scrambleTimeout, setScrambleTimeout] = useState(40);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim()) {
            socket.emit('join_lobby', { playerName });
            setJoined(true);
        }
    };

    const handleAddBot = () => {
        socket.emit('add_bot', { botType });
    };

    const handleStart = () => {
        socket.emit('start_game', { scrambleTimeout });
    };

    return (
        <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6 text-center">
                GLINT LOBBY
            </h2>

            {!joined ? (
                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                            placeholder="Enter name to join"
                            maxLength={15}
                            required
                        />
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                        Join Game
                    </button>
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="bg-gray-900 p-4 rounded border border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Players ({gameState.players?.length || 0})</h3>
                        <ul className="space-y-1">
                            {gameState.players?.map((p: any) => (
                                <li key={p.id} className="text-gray-200 flex justify-between">
                                    <span>{p.name}</span>
                                    <span className="text-gray-500 text-xs">ID: {p.id.substring(0, 5)}...</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Add Bot</label>
                        <div className="flex gap-2">
                            <select 
                                value={botType} 
                                onChange={(e) => setBotType(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-2 text-white focus:outline-none"
                            >
                                <option value="Random">Random Persona</option>
                                <option value="Math Whiz">Math Whiz</option>
                                <option value="Speedster">Speedster</option>
                                <option value="Bluffer">Bluffer</option>
                                <option value="Scavenger">Scavenger</option>
                            </select>
                            <button onClick={handleAddBot} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-semibold transition-colors">
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-700">
                        <label className="block text-sm font-medium text-gray-300">Scramble Fuse Timer (Seconds)</label>
                        <input
                            type="number"
                            min="5"
                            max="120"
                            value={scrambleTimeout}
                            onChange={(e) => setScrambleTimeout(parseInt(e.target.value) || 40)}
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                        />
                    </div>

                    <button 
                        onClick={handleStart} 
                        disabled={!gameState.players || gameState.players.length < 2}
                        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-bold rounded text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        START GAME
                    </button>
                </div>
            )}
        </div>
    );
}
