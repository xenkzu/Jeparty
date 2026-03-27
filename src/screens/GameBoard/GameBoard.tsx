import React from 'react';

const GameBoard: React.FC = () => {
  const categories = ["HISTORY", "SCIENCE", "POP CULTURE", "SPORTS", "TECH"];
  const pointValues = [100, 200, 300, 400, 500];
  const players = [
    { name: "PLAYER_01", score: 400, isActive: true },
    { name: "PLAYER_02", score: 150, isActive: false }
  ];

  // Clip-path polygon styles derived from Stitch design
  const STYLES = {
    cellJagged: { clipPath: 'polygon(2% 2%, 98% 0, 100% 98%, 0 100%)' },
    cellJaggedAlt: { clipPath: 'polygon(0 5%, 100% 0, 95% 100%, 5% 95%)' },
    shardedRight: { clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)' }
  };

  return (
    <div className="flex flex-col flex-1 bg-[var(--color-background)] text-[var(--color-on-surface)] font-body">
      
      {/* 1. Scoreboard Bar (Pulled directly from Stitch) */}
      <section className="num-12 grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {players.map((player, idx) => (
          <div 
            key={player.name}
            style={idx === 0 ? STYLES.shardedRight : {}}
            className={`p-4 flex flex-col justify-between relative ${
              player.isActive 
                ? 'bg-[var(--color-primary-dim)] text-[var(--color-on-primary-fixed)]' 
                : 'bg-[var(--color-surface-container-high)] border-l-4 border-[var(--color-primary-dim)]'
            }`}
          >
            {player.isActive && (
              <div className="absolute top-2 right-4 font-display font-bold text-black opacity-20 text-4xl italic">01</div>
            )}
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: player.isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {player.isActive ? 'stars' : 'person'}
              </span>
              <span className="font-display font-bold text-xl tracking-tighter uppercase italic">
                {player.name}
              </span>
            </div>
            <div className="mt-4 text-4xl font-display font-bold tracking-tighter italic">
              {player.score.toLocaleString()} <span className="text-xs uppercase">pts</span>
            </div>
            {player.isActive && (
              <div className="mt-2 text-[10px] text-black font-bold font-display uppercase tracking-widest">
                CURRENT TURN
              </div>
            )}
          </div>
        ))}
      </section>

      {/* 2. Game Board Grid (Pulled from Stitch "grid-cols-5") */}
      <div className="grid grid-cols-5 gap-3">
        {/* Category Headers */}
        {categories.map((cat, i) => (
          <div 
            key={cat} 
            style={i % 2 === 0 ? STYLES.cellJagged : STYLES.cellJaggedAlt}
            className="col-span-1 bg-[var(--color-surface-container-highest)] p-4 flex items-center justify-center border-b-4 border-[var(--color-primary-dim)]"
          >
            <h3 className="font-display font-bold text-sm md:text-base text-white uppercase text-center leading-none tracking-tighter italic">
              {cat}
            </h3>
          </div>
        ))}

        {/* Board Rows for 100 - 500 */}
        {pointValues.map((val, rowIdx) => (
          <React.Fragment key={val}>
            {categories.map((_, colIdx) => {
              const totalIdx = rowIdx * 5 + colIdx;
              const isUsed = totalIdx === 1 || totalIdx === 6; // Dummies for used tiles
              
              if (isUsed) {
                return (
                  <div 
                    key={`${val}-${colIdx}`} 
                    style={totalIdx % 2 === 0 ? STYLES.cellJagged : STYLES.cellJaggedAlt}
                    className="aspect-square bg-[var(--color-surface-container-lowest)] flex flex-col items-center justify-center relative opacity-30 grayscale pointer-events-none"
                  >
                    <span className="font-display font-bold text-3xl md:text-5xl text-[var(--color-outline)] tracking-tighter line-through italic">{val}</span>
                    <span className="absolute rotate-12 text-[8px] font-bold font-display text-red-600 bg-black px-1 uppercase">USED</span>
                  </div>
                );
              }

              return (
                <div 
                  key={`${val}-${colIdx}`} 
                  style={totalIdx % 2 === 0 ? STYLES.cellJagged : STYLES.cellJaggedAlt}
                  className="aspect-square bg-[var(--color-surface-container-low)] hover:bg-[var(--color-primary-dim)] group cursor-pointer flex flex-col items-center justify-center relative overflow-hidden transition-all duration-75 active:scale-95"
                >
                  <span className="font-display font-bold text-3xl md:text-5xl text-[var(--color-primary-dim)] group-hover:text-black tracking-tighter transition-colors italic">
                    {val}
                  </span>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* 3. Footer / Game State (Pulled from Stitch) */}
      <footer className="mt-12 flex flex-col md:flex-row justify-between items-end gap-6 border-t-2 border-[var(--color-surface-container-highest)] pt-6">
        <div className="flex-1 w-full">
          <div className="font-display font-bold text-2xl text-white uppercase tracking-tighter italic">LAST_EVENT:</div>
          <div 
            className="mt-2 text-[var(--color-primary-dim)] font-bold font-display tracking-widest text-xs bg-[var(--color-surface-container-high)] p-4 border-l-4 border-[var(--color-primary-dim)]"
            style={{ clipPath: 'polygon(0 0, 100% 2%, 98% 100%, 2% 98%)' }}
          >
            SYSTEM_STABLE: AWAITING_INPUT_STREAM_...
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-[10px] text-[var(--color-outline)] font-bold font-display tracking-[0.5em] uppercase">SYSTEM_STABLE</div>
          <div className="flex gap-2">
            <div className="w-12 h-1 bg-[var(--color-primary-dim)]"></div>
            <div className="w-12 h-1 bg-[var(--color-primary-dim)]"></div>
            <div className="w-12 h-1 bg-[var(--color-surface-container-highest)]"></div>
            <div className="w-12 h-1 bg-[var(--color-surface-container-highest)]"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GameBoard;
