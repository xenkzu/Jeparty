import React from 'react';

interface EndScreenProps {
  players: { name: string; score: number }[];
  onRestart: () => void;
}

const EndScreen: React.FC<EndScreenProps> = ({ players, onRestart }) => {
  // Logic: Winner is player with highest score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const STYLES = {
    winnerShard: { clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)' },
    crownShard: { clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' },
    rankCard: { clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0 100%)' },
    restartBtn: { clipPath: 'polygon(0% 15%, 100% 0%, 100% 85%, 0% 100%)' }
  };

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center py-12 px-6 overflow-hidden">
      
      {/* Winner Spotlight Section */}
      <div className="relative mb-24 w-full max-w-2xl flex flex-col items-center">
        {/* Animated background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[120%] bg-[var(--color-primary-dim)] opacity-10 animate-pulse rotate-3 scale-110"></div>
        
        <div style={STYLES.crownShard} className="w-12 h-12 bg-[var(--color-primary-dim)] mb-4 animate-bounce"></div>
        
        <div className="text-[var(--color-primary-dim)] font-display font-black text-xs tracking-[0.6em] uppercase mb-4">SUPREME_VICTOR</div>
        
        <div 
          style={STYLES.winnerShard}
          className="bg-[var(--color-primary-dim)] text-[var(--color-on-primary-fixed)] px-12 py-8 flex flex-col items-center transform -rotate-2 relative z-10"
        >
          <h1 className="font-display font-black text-7xl md:text-9xl italic leading-none tracking-tighter uppercase transform scale-y-125">
            {winner.name}
          </h1>
          <div className="mt-4 font-display font-bold text-3xl tracking-tighter">
            {winner.score.toLocaleString()} <span className="text-xl">PTS</span>
          </div>
        </div>

        <div className="absolute -bottom-6 right-0 text-white/5 font-display font-black text-8xl italic uppercase select-none pointer-events-none">
          CHAMPION_
        </div>
      </div>

      {/* Leaderboard Rankings */}
      <div className="w-full max-w-xl flex flex-col gap-3 mb-20">
        <h3 className="font-display font-bold text-xs text-[var(--color-outline)] tracking-[0.4em] uppercase mb-6 px-4">
          FINAL_RANKINGS
        </h3>
        
        {sortedPlayers.map((player, idx) => (
          <div 
            key={player.name}
            style={STYLES.rankCard}
            className={`flex items-center justify-between p-6 transition-all border-l-4 ${
              idx === 0 
                ? 'bg-[var(--color-surface-container-highest)] border-[var(--color-primary-dim)]' 
                : 'bg-[var(--color-surface-container-low)] border-transparent'
            }`}
          >
            <div className="flex items-center gap-6">
              <span className="font-display font-black text-2xl text-[var(--color-primary-dim)] italic">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="font-display font-bold text-xl md:text-2xl text-white tracking-widest uppercase italic">
                {player.name}
              </span>
            </div>
            <div className="font-display font-bold text-xl text-white tracking-tighter">
              {player.score.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Control Actions */}
      <div className="flex flex-col items-center gap-6">
        <button 
          onClick={onRestart}
          style={STYLES.restartBtn}
          className="bg-white text-black font-display font-black text-3xl px-16 py-8 hover:bg-[var(--color-primary-dim)] hover:text-white transition-all transform hover:scale-105 active:scale-95 uppercase italic tracking-tighter"
        >
          INITIALIZE_NEW_SEQUENCE
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-24 h-0.5 bg-[var(--color-primary-dim)]"></div>
          <span className="text-[10px] text-[var(--color-outline)] font-display font-bold tracking-[0.3em] uppercase">SYSTEM_READY</span>
          <div className="w-24 h-0.5 bg-[var(--color-primary-dim)]"></div>
        </div>
      </div>

      {/* Ghost Branding */}
      <div className="fixed bottom-10 left-[-5rem] rotate-90 text-white/5 font-display font-black text-6xl tracking-widest pointer-events-none uppercase italic">
        JEPARTY_TERMINUS
      </div>
    </div>
  );
};

export default EndScreen;
