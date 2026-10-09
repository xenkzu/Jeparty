import React from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '../../components/ui/PageTransition';
import { CyberpunkButton } from '../../components/ui/CyberpunkButton';

interface EndScreenProps {
  players: { name: string; score: number }[];
  onRestart: () => void;
}

const EndScreenV3: React.FC<EndScreenProps> = ({ players, onRestart }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const STYLES = {
    winnerBox: { clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)' },
    restartBtn: { clipPath: 'polygon(0 0, 100% 0, 100% 75%, 95% 100%, 0 100%)' },
    ghostGrid: { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }
  };

  return (
    <PageTransition>
      <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 px-6 relative overflow-hidden bg-[var(--color-background)]">
        
        {/* Background Dot Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-40" style={STYLES.ghostGrid}></div>

        {/* Ghost Branding */}
        <div 
          style={{ fontFamily: "'Kode Mono', monospace" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 font-turret font-extrabold text-[12vw] uppercase select-none pointer-events-none tracking-tight leading-none rotate-[-5deg] z-0"
        >
          JEPARTY_GEN3
        </div>

        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
          
          {/* Header / Winner Title Section */}
          <header className="flex flex-col items-center mb-16 text-center">
            <div className="flex items-center gap-2 mb-2 font-mono">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-tertiary-container text-black tracking-widest uppercase">
                V3_VICTORY
              </span>
              <span className="text-[var(--color-tertiary-container)] font-mono font-black text-xs tracking-[0.4em] uppercase">CHAMPION_EMERGES</span>
            </div>
            <h1 
              style={{ fontFamily: "'Kode Mono', monospace", fontWeight: 800 }}
              className="text-[var(--color-tertiary-container)] font-turret font-extrabold text-7xl md:text-[8rem] leading-[0.85] tracking-tight uppercase mb-8 transform scale-y-110"
            >
              WINNER
            </h1>
            
            <div className="relative group">
              <div 
                style={{ ...STYLES.winnerBox, animationIterationCount: 'infinite', animationDuration: '2s' } as React.CSSProperties}
                className="bg-[#000000] border-2 border-[var(--color-tertiary-container)] px-16 py-6 transform -rotate-1 animate-glitch" 
              >
                <span 
                  style={{ fontFamily: "'Kode Mono', monospace" }}
                  className="font-turret font-extrabold text-3xl md:text-5xl text-white tracking-widest uppercase animate-rgb-split"
                >
                  {winner.name}
                </span>
              </div>
              <div className="mt-4 text-white font-mono font-bold text-xs tracking-[0.3em] uppercase opacity-60">
                TOTAL_DOMINATION_SECURED // {winner.score.toLocaleString()} PTS
              </div>
            </div>
          </header>

          {/* Leaderboard Rankings Area */}
          <div className="w-full max-w-2xl flex flex-col gap-1 mb-24 px-4 font-mono">
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
              <span className="text-white/40 font-mono font-bold text-[10px] tracking-[0.3em] uppercase">GEN3_ARENA_RANKINGS / TOP_3</span>
              <span className="text-white/20 font-mono font-bold text-[10px] tracking-[0.1em] uppercase block md:hidden">SWIPE_TO_NAV</span>
            </div>
            
            <div className="flex flex-col gap-2">
              {sortedPlayers.map((player, idx) => {
                const isWinner = idx === 0;
                const rankColor = isWinner ? 'text-[var(--color-tertiary-container)]' : 'text-[var(--color-outline)]';
                const scoreColor = isWinner ? 'text-[var(--color-tertiary-container)]' : 'text-[var(--color-outline)]';
                
                return (
                  <motion.div 
                    key={player.name}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between p-4 bg-white/5 border-l-2 border-white/5 animate-power-on"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <div className="flex items-center gap-8">
                      <span className={`font-mono font-black text-2xl italic w-8 ${rankColor}`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono font-bold text-lg md:text-xl text-white tracking-widest uppercase italic">
                        {player.name}
                      </span>
                    </div>
                    <div className={`font-mono font-black text-xl italic tracking-tighter ${scoreColor}`}>
                      {player.score.toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Restart Button Section */}
          <div className="flex flex-col items-center gap-8 w-full max-w-sm font-mono">
            <CyberpunkButton 
              variant="primary"
              onClick={onRestart}
              style={{ ...STYLES.restartBtn, fontFamily: "'Kode Mono', monospace" }}
              className="w-full bg-[var(--color-tertiary-container)] text-black font-turret font-extrabold text-2xl md:text-3xl px-12 py-8 uppercase tracking-wider flex items-center justify-center gap-4 group"
            >
              <span className="material-symbols-outlined text-4xl group-hover:animate-pulse">bolt</span>
              <span>REMATCH_SEQUENCE</span>
            </CyberpunkButton>
            
            <div className="flex items-center gap-4 w-full font-mono">
              <div className="flex-1 h-0.5 bg-white/5"></div>
              <div className="px-3 py-1 border border-white/10 bg-white/5">
                <span className="text-[9px] text-white/30 font-mono font-bold tracking-[0.4em] uppercase">SYSTEM_READY // RE_INIT</span>
              </div>
              <div className="flex-1 h-0.5 bg-white/5"></div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default EndScreenV3;
