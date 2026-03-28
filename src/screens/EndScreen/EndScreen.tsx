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
    winnerBox: { clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)' },
    restartBtn: { clipPath: 'polygon(0 0, 100% 0, 100% 75%, 95% 100%, 0 100%)' },
    ghostGrid: { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 px-6 relative overflow-hidden bg-[var(--color-background)]">
      
      {/* Background Dot Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40" style={STYLES.ghostGrid}></div>

      {/* Ghost Branding */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 font-display font-black text-[12vw] italic uppercase select-none pointer-events-none tracking-tight leading-none rotate-[-5deg] z-0">
        JEPARTY_TERMINUS
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        
        {/* Header / Winner Title Section */}
        <header className="flex flex-col items-center mb-16 text-center">
          <span className="text-[var(--color-tertiary-container)] font-display font-black text-xs tracking-[0.5em] uppercase mb-2">CHAMPION_EMERGES</span>
          <h1 className="text-[var(--color-tertiary-container)] font-display font-black text-8xl md:text-[10rem] leading-[0.8] tracking-tighter uppercase italic mb-8 transform scale-y-110">
            WINNER
          </h1>
          
          <div className="relative group">
            {/* Winner Name Box */}
            <div 
              style={{ ...STYLES.winnerBox, animationIterationCount: 'infinite', animationDuration: '2s' } as React.CSSProperties}
              className="bg-black border-2 border-[var(--color-tertiary-container)] px-16 py-6 transform -rotate-1 animate-glitch" 
            >
              <span className="font-display font-black text-4xl md:text-6xl text-white tracking-widest uppercase italic">
                {winner.name}
              </span>
            </div>
            <div className="mt-4 text-white font-display font-bold text-xs tracking-[0.3em] uppercase opacity-60">
              TOTAL_DOMINATION_SECURED // {winner.score.toLocaleString()} PTS
            </div>
          </div>
        </header>

        {/* Leaderboard Rankings Area */}
        <div className="w-full max-w-2xl flex flex-col gap-1 mb-24 px-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
            <span className="text-white/40 font-display font-bold text-[10px] tracking-[0.3em] uppercase">ARENA_RANKINGS / TOP_3</span>
            <span className="text-white/20 font-display font-bold text-[10px] tracking-[0.1em] uppercase block md:hidden">SWIPE_TO_NAV</span>
          </div>
          
          <div className="flex flex-col gap-2">
            {sortedPlayers.map((player, idx) => {
              const isWinner = idx === 0;
              const rankColor = isWinner ? 'text-[var(--color-tertiary-container)]' : 'text-[var(--color-outline)]';
              const scoreColor = isWinner ? 'text-[var(--color-tertiary-container)]' : 'text-[var(--color-outline)]';
              
              return (
                <div 
                  key={player.name}
                  className="flex items-center justify-between p-4 bg-white/5 border-l-2 border-white/5 animate-power-on"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className="flex items-center gap-8">
                    <span className={`font-display font-black text-2xl italic w-8 ${rankColor}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display font-bold text-lg md:text-xl text-white tracking-widest uppercase italic">
                      {player.name}
                    </span>
                  </div>
                  <div className={`font-display font-black text-xl italic tracking-tighter ${scoreColor}`}>
                    {player.score.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Restart Button Section */}
        <div className="flex flex-col items-center gap-8 w-full max-w-sm">
          <button 
            onClick={onRestart}
            style={STYLES.restartBtn}
            className="w-full bg-[var(--color-tertiary-container)] text-black font-display font-black text-2xl md:text-3xl px-12 py-8 transition-all transform hover:scale-[1.02] active:scale-95 uppercase italic tracking-tighter hover:animate-scanline flex items-center justify-center gap-4 group"
          >
            <span className="material-symbols-outlined text-4xl group-hover:animate-pulse">bolt</span>
            <span>REMATCH_SEQUENCE</span>
          </button>
          
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-0.5 bg-white/5"></div>
            <div className="px-3 py-1 border border-white/10 bg-white/5">
              <span className="text-[9px] text-white/30 font-display font-bold tracking-[0.4em] uppercase">SYSTEM_READY // RE_INIT</span>
            </div>
            <div className="flex-1 h-0.5 bg-white/5"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EndScreen;
