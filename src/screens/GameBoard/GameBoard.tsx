import React from 'react';
import { Game } from '../../types/game';

interface GameBoardProps {
  game: Game;
  onSelectQuestion: (categoryIndex: number, questionIndex: number) => void;
  onEndGame: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ game, onSelectQuestion, onEndGame }) => {
  const categories = game.board.map(b => b.category);
  const activePlayer = game.players[game.turnIndex];

  // Clip-path polygon styles derived from Stitch design
  const STYLES = {
    cellJagged: { clipPath: 'polygon(2% 2%, 98% 0, 100% 98%, 0 100%)' },
    cellJaggedAlt: { clipPath: 'polygon(0 5%, 100% 0, 95% 100%, 5% 95%)' },
    shardedRight: { clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)' }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-on-surface)] font-body p-6 overflow-y-auto">
      
      {/* 1. Scoreboard Bar (Auto-scaling columns 2-4) */}
      <section 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 shrink-0"
      >
        {game.players.map((player, idx) => {
          const isActive = idx === game.turnIndex;
          return (
            <div 
              key={player.id}
              style={idx === 0 ? STYLES.shardedRight : {}}
              className={`p-5 flex flex-col justify-between relative transition-all duration-300 ${
                isActive 
                  ? 'bg-[var(--color-primary-dim)] text-[var(--color-on-primary-fixed)] scale-102 z-10' 
                  : 'bg-[var(--color-surface-container-high)] border-l-4 border-[var(--color-primary-dim)]'
              }`}
            >
              {isActive && (
                <div className="absolute top-1 right-3 font-display font-bold text-black opacity-10 text-4xl italic">{String(idx + 1).padStart(2, '0')}</div>
              )}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {isActive ? 'stars' : 'person'}
                </span>
                <span className="font-display font-bold text-xl tracking-tighter uppercase italic truncate">
                  {player.name}
                </span>
              </div>
              <div className="text-3xl font-display font-bold tracking-tighter italic">
                {player.score.toLocaleString()} <span className="text-[10px] uppercase">pts</span>
              </div>
              {isActive && (
                <div className="text-[10px] text-black font-black font-display uppercase tracking-widest leading-none mt-2">
                  ACTIVE_MODERATOR
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* 2. Game Board Grid (Fixed margin and flexible allocation) */}
      <div className="grid grid-cols-5 gap-3" style={{ gridTemplateRows: 'repeat(6, minmax(100px, 1fr))' }}>
        {/* Category Headers */}
        {categories.map((cat, i) => (
          <div 
            key={cat} 
            style={i % 2 === 0 ? STYLES.cellJagged : STYLES.cellJaggedAlt}
            className="row-span-1 bg-[var(--color-surface-container-highest)] p-2 flex items-center justify-center border-b-2 border-[var(--color-primary-dim)]"
          >
            <h3 className="font-display font-bold text-[10px] md:text-xs text-white uppercase text-center leading-none tracking-tighter italic">
              {cat}
            </h3>
          </div>
        ))}

        {/* Board Rows */}
        {game.board[0].questions.map((_, rowIdx) => (
          <React.Fragment key={rowIdx}>
            {game.board.map((category, colIdx) => {
              const question = category.questions[rowIdx];
              const totalIdx = rowIdx * game.board.length + colIdx;
              const isAnswered = question.status === 'answered';
              
              if (isAnswered) {
                return (
                  <div 
                    key={`${colIdx}-${rowIdx}`} 
                    style={totalIdx % 2 === 0 ? STYLES.cellJagged : STYLES.cellJaggedAlt}
                    className="h-full bg-[var(--color-surface-container-lowest)] flex flex-col items-center justify-center relative opacity-30 grayscale pointer-events-none"
                  >
                    <span className="font-display font-bold text-2xl md:text-4xl text-[var(--color-outline)] tracking-tighter line-through italic">{question.value}</span>
                    <span className="absolute rotate-12 text-[7px] font-bold font-display text-red-600 bg-black px-1 uppercase">USED</span>
                  </div>
                );
              }

              return (
                <div 
                  key={`${colIdx}-${rowIdx}`} 
                  onClick={() => question.status === 'hidden' && onSelectQuestion(colIdx, rowIdx)}
                  style={totalIdx % 2 === 0 ? STYLES.cellJagged : STYLES.cellJaggedAlt}
                  className="h-full bg-[var(--color-surface-container-low)] hover:bg-[var(--color-primary-dim)] group cursor-pointer flex flex-col items-center justify-center relative overflow-hidden transition-all duration-75 active:scale-95"
                >
                  <span className="font-display font-bold text-2xl md:text-4xl text-[var(--color-primary-dim)] group-hover:text-black tracking-tighter transition-colors italic">
                    {question.value}
                  </span>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* 3. Footer / Game State (Minimal Height) */}
      <footer className="mt-4 flex justify-between items-center h-12 border-t border-[var(--color-surface-container-highest)] pt-4 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="font-display font-bold text-sm text-white uppercase tracking-tighter italic whitespace-nowrap">LAST_EVENT:</div>
          <div 
            className="text-[var(--color-primary-dim)] font-bold font-display tracking-widest text-[9px] bg-[var(--color-surface-container-high)] px-3 py-1 border-l-2 border-[var(--color-primary-dim)] line-clamp-1"
          >
            ACTIVE_PLAYER: {activePlayer.name.toUpperCase()}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <button 
            onClick={onEndGame}
            className="text-[8px] text-[var(--color-outline)] hover:text-white font-bold font-display tracking-[0.2em] uppercase transition-colors"
          >
            TERMINATE_GAME
          </button>
          <div className="flex gap-1">
            <div className="w-8 h-0.5 bg-[var(--color-primary-dim)]"></div>
            <div className="w-8 h-0.5 bg-[var(--color-surface-container-highest)]"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GameBoard;
