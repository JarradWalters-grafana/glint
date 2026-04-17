import React, { useEffect, useRef } from 'react';

interface AuditLogProps {
    logs: string[];
}

export default function AuditLog({ logs }: AuditLogProps) {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col h-64 mt-6">
            <div className="bg-gray-800 text-gray-200 px-4 py-2 text-sm font-semibold border-b border-gray-700">
                Game Log (Audit Trail)
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm font-mono">
                {logs.length === 0 && (
                    <div className="text-gray-500 italic">No events yet...</div>
                )}
                {logs.map((log, index) => {
                    const isSystem = log.startsWith("System:");
                    return (
                        <div key={index} className={`break-words ${isSystem ? 'text-blue-400 font-semibold' : 'text-green-400'}`}>
                            <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                            {log}
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>
        </div>
    );
}
