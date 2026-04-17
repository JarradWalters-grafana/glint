import React, { useState } from 'react';
import { socket } from '@/lib/socket';

interface GameBoardProps {
    gameState: any;
    privateState: any;
}

export default function GameBoard({ gameState, privateState }: GameBoardProps) {
    const { phase, targetNumber, timer, glintCalled, players, availableTreasures, currentDrafterId } = gameState;
    const { hand, treasure, intent } = privateState || {};
    
    const [selectedTargetId, setSelectedTargetId] = useState('');

    const handleIntent = (chosenIntent: string) => {
        if (chosenIntent === 'SNEAK' && !selectedTargetId) {
            alert('Select a target to sneak!');
            return;
        }
        socket.emit('declare_intent', { intent: chosenIntent, targetId: chosenIntent === 'SNEAK' ? selectedTargetId : null });
    };

    const handleCallGlint = () => {
        socket.emit('call_glint');
    };

    const handleSubmitMath = (distance: number) => {
        socket.emit('submit_math', { distance });
    };

    const handleDraftTreasure = (treasureId: string) => {
        socket.emit('draft_treasure', { treasureId });
    };

    // Find our public player info
    const me = players?.find((p: any) => p.id === socket.id);
    const opponents = players?.filter((p: any) => p.id !== socket.id) || [];

    return (
        <div className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Column: Player Status & Actions */}
            <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-700">
                
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-200">Phase: <span className="text-yellow-400">{phase}</span></h2>
                        {phase === 'Scramble' && glintCalled && (
                            <div className="text-2xl font-mono text-red-500 font-bold animate-pulse">
                                00:{timer.toString().padStart(2, '0')}
                            </div>
                        )}
                    </div>

                    {/* Private Info Panel */}
                    {privateState && (
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6 space-y-4">
                            <div>
                                <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase">Your Hand</h3>
                                <div className="flex gap-2 mb-2">
                                    {hand?.map((card: number, idx: number) => (
                                        <div key={idx} className="w-12 h-16 bg-white text-black rounded flex items-center justify-center text-xl font-bold shadow">
                                            {card}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center bg-gray-900 p-2 rounded border border-gray-600">
                                <span className="text-gray-400 text-sm">Assigned Treasure:</span>
                                <span className="text-yellow-400 font-bold text-lg">
                                    {treasure ? `${treasure.emoji} (Value: ${treasure.value})` : '?'}
                                </span>
                            </div>

                            {intent === 'SNEAK' && privateState?.sneakedValue !== undefined && privateState?.sneakedValue !== null && (
                                <div className="flex justify-between items-center bg-gray-900 p-2 rounded border border-purple-600">
                                    <span className="text-purple-400 text-sm font-bold">Sneaked Target Value:</span>
                                    <span className="text-purple-400 font-bold text-lg">{privateState.sneakedValue}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Interactive Controls based on Phase */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[160px] flex flex-col justify-center">
                    {phase === 'Setup' && (
                        <div className="text-center text-gray-400 italic">Waiting for round to begin...</div>
                    )}

                    {phase === 'Declaration' && !intent && (
                        <div className="space-y-4">
                            <button onClick={() => handleIntent('BOAST')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors">
                                BOAST (Commit to your Treasure)
                            </button>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 bg-gray-900 text-white p-2 rounded border border-gray-600"
                                    value={selectedTargetId}
                                    onChange={(e) => setSelectedTargetId(e.target.value)}
                                >
                                    <option value="" disabled>Select Target to Sneak...</option>
                                    <option value="DUMMY">Dummy Treasure (Center)</option>
                                    {opponents.map((opp: any) => (
                                        <option key={opp.id} value={opp.id}>{opp.name}'s Treasure</option>
                                    ))}
                                </select>
                                <button onClick={() => handleIntent('SNEAK')} className="px-4 bg-purple-600 hover:bg-purple-500 rounded font-bold transition-colors">
                                    SNEAK
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {phase === 'Declaration' && intent && (
                        <div className="text-center">
                            <div className="text-green-400 font-bold text-lg">
                                Intent locked: {intent}
                            </div>
                        </div>
                    )}

                    {phase === 'Scramble' && (
                        <div className="space-y-4">
                            {!glintCalled && !me?.calledGlint && (
                                <button onClick={handleCallGlint} className="w-full py-4 text-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-extrabold rounded-lg shadow-lg hover:scale-105 transition-transform">
                                    CALL GLINT!
                                </button>
                            )}
                            {glintCalled && !me?.submittedMath && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleSubmitMath(0)} className="py-3 bg-green-600 hover:bg-green-500 font-bold rounded">
                                        [ EXACT ]
                                    </button>
                                    <button onClick={() => handleSubmitMath(1)} className="py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded">
                                        [ 1 AWAY ]
                                    </button>
                                    <button onClick={() => handleSubmitMath(4)} className="py-3 bg-orange-600 hover:bg-orange-500 font-bold rounded">
                                        [ &lt;5 AWAY ]
                                    </button>
                                    <button onClick={() => handleSubmitMath(100)} className="py-3 bg-red-600 hover:bg-red-500 font-bold rounded">
                                        [ PASS ]
                                    </button>
                                </div>
                            )}
                            {me?.submittedMath && (
                                <div className="text-center text-green-400 font-bold">Math Submitted. Waiting for others...</div>
                            )}
                        </div>
                    )}

                    {phase === 'Looting' && (
                        <div className="space-y-4 text-center">
                            <h3 className="text-lg font-bold text-yellow-400">The Draft</h3>
                            {currentDrafterId === socket.id ? (
                                <div className="text-green-400 font-bold mb-4 animate-pulse">It is YOUR turn to draft!</div>
                            ) : (
                                <div className="text-gray-400 mb-4">Waiting for {players?.find((p:any) => p.id === currentDrafterId)?.name} to draft...</div>
                            )}

                            <div className="flex flex-wrap justify-center gap-4">
                                {availableTreasures?.map((t: any) => {
                                    const isMyTurn = currentDrafterId === socket.id;
                                    let isDisabled = !isMyTurn;
                                    
                                    // Rule enforcement UX
                                    if (isMyTurn) {
                                        if (intent === 'BOAST' && availableTreasures.some((at:any) => at.id === socket.id) && t.id !== socket.id) {
                                            isDisabled = true; // Must take own
                                        }
                                        if (intent === 'SNEAK' && t.id === socket.id) {
                                            isDisabled = true; // Cannot take own
                                        }
                                    }

                                    const ownerName = t.id === 'DUMMY' ? 'Center (Dummy)' : players?.find((p:any) => p.id === t.id)?.name || 'Unknown';

                                    return (
                                        <div key={t.id} className="flex flex-col items-center">
                                            <button 
                                                onClick={() => handleDraftTreasure(t.id)}
                                                disabled={isDisabled}
                                                className={`text-4xl p-4 rounded-xl border-2 transition-all ${
                                                    isDisabled ? 'opacity-50 border-gray-700 bg-gray-800 cursor-not-allowed' 
                                                    : 'border-yellow-500 bg-gray-700 hover:scale-110 hover:bg-yellow-600 cursor-pointer shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                                                }`}
                                            >
                                                {t.emoji}
                                            </button>
                                            <span className="text-xs text-gray-500 mt-2 font-semibold">
                                                {ownerName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {phase === 'Scoring' && (
                        <div className="text-center text-yellow-400 font-bold text-lg animate-pulse">
                            Processing Scoring...
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Public Game State */}
            <div className="w-full md:w-1/3 bg-gray-800 p-6 flex flex-col justify-between">
                
                <div>
                    {phase === 'Scramble' && targetNumber && (
                        <div className="mb-8 text-center bg-gray-900 p-6 rounded-lg border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                            <div className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Target Number</div>
                            <div className="text-6xl font-black text-white">{targetNumber}</div>
                        </div>
                    )}

                    <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider border-b border-gray-700 pb-2">Players</h3>
                    <ul className="space-y-3">
                        {players?.map((p: any) => (
                            <li key={p.id} className="bg-gray-900 p-3 rounded border border-gray-700 flex flex-col">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-semibold ${p.id === socket.id ? 'text-blue-400' : 'text-gray-200'}`}>
                                        {p.name} {p.id === socket.id && '(You)'}
                                    </span>
                                    <span className="text-yellow-400 font-bold">{p.score} pts</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{p.intent ? `Intent: ${p.intent}` : 'Waiting...'}</span>
                                    <span className="flex items-center gap-1">
                                        {p.draftedEmoji && <span className="text-lg">{p.draftedEmoji}</span>}
                                        {p.calledGlint ? 'CALLED GLINT' : p.submittedMath ? 'Submitted' : ''}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            {/* Game Over Overlay */}
            {phase === 'GameOver' && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 mb-6 drop-shadow-lg animate-bounce">
                            GAME OVER!
                        </h2>
                        
                        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
                            <h3 className="text-xl text-gray-300 font-bold mb-4 border-b border-gray-700 pb-2">Final Standings</h3>
                            <ul className="space-y-3">
                                {/* Sort players by score descending */}
                                {[...players].sort((a: any, b: any) => b.score - a.score).map((p: any, index: number) => (
                                    <li key={p.id} className={`flex justify-between items-center p-3 rounded ${index === 0 ? 'bg-yellow-900/30 border border-yellow-700/50' : 'bg-gray-900/50'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-black text-xl ${index === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                                #{index + 1}
                                            </span>
                                            <span className={`font-bold ${p.id === socket.id ? 'text-blue-400' : 'text-gray-200'}`}>
                                                {p.name} {p.id === socket.id && '(You)'}
                                            </span>
                                        </div>
                                        <span className="text-yellow-400 font-bold text-xl">{p.score} <span className="text-sm text-gray-500">pts</span></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="text-gray-400 text-sm animate-pulse">
                            Returning to lobby automatically...
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
