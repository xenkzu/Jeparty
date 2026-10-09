import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Game } from '../../types/game';
import { PageTransition } from '../../components/ui/PageTransition';
import { cleanCategoryName } from '../../utils/gameUtils';

interface GameBoardProps {
  game: Game;
  onSelectQuestion: (categoryIndex: number, questionIndex: number) => void;
  onEndGame: () => void;
}

const GameBoardV3: React.FC<GameBoardProps> = ({ game, onSelectQuestion, onEndGame }) => {
  const categories = game.board.map(b => b.category);
  const activePlayer = game.players[game.turnIndex];
  const questionsPerCategory = game.board[0]?.questions.length ?? 5;

  useEffect(() => {
    const allAnswered = game.board.every(cat =>
      cat.questions.every(q => q.status === 'answered')
    );
    if (allAnswered) onEndGame();
  }, [game.board]);

  const STYLES = {
    cellJagged: { clipPath: 'polygon(2% 2%, 98% 0, 100% 98%, 0 100%)' },
    cellJaggedAlt: { clipPath: 'polygon(0 5%, 100% 0, 95% 100%, 5% 95%)' },
    shardedRight: { clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)' }
  };

  return (
    <PageTransition>
      <div className="w-full flex flex-col bg-[var(--color-background)] text-[var(--color-on-surface)] font-body pb-12">

        {/* Scoreboard Bar */}
        <section className="flex flex-wrap gap-3 mb-4 shrink-0 font-mono">
          {game.players.map((player, idx) => {
            const isActive = idx === game.turnIndex;
            return (
              <motion.div
                key={player.id}
                layout
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 90% 100%, 0 100%)' }}
                className={`px-5 py-3 flex items-center gap-7 transition-all duration-300 border-l-[5px] relative overflow-hidden ${isActive
                  ? 'bg-[var(--color-primary-dim)] text-black border-black shadow-lg'
                  : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border-[var(--color-primary-dim)]/40'
                  }`}
              >
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-[8px] uppercase tracking-[0.25em] opacity-60">
                    ID_NODE
                  </span>
                  <span 
                    style={{ fontFamily: "'Kode Mono', monospace" }}
                    className="font-turret font-extrabold text-2xl uppercase tracking-wider truncate max-w-[170px] leading-none"
                  >
                    {player.name}
                  </span>
                </div>

                <div className="flex flex-col border-l border-black/20 pl-6">
                  <span className="font-mono font-bold text-[8px] uppercase tracking-[0.25em] opacity-60">
                    STAKE_PTS
                  </span>
                  <span className="font-mono font-bold text-2xl tracking-tighter italic tabular-nums leading-none">
                    {player.score.toLocaleString()}
                  </span>
                </div>

                {isActive && (
                  <>
                    <motion.div
                      initial={{ x: '-150%', skewX: -20 }}
                      animate={{ x: '250%' }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatDelay: 10, 
                        duration: 1.5, 
                        ease: "easeInOut" 
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full pointer-events-none"
                    />
                    
                    <div className="flex flex-col items-end gap-0.5 relative z-10">
                      <div className="w-10 h-1 bg-black/20 relative overflow-hidden">
                        <motion.div 
                          animate={{ x: [-40, 40] }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="absolute inset-0 bg-black w-1/3"
                        />
                      </div>
                      <span className="text-[7px] font-mono font-bold tracking-widest uppercase">LINK_ACTIVE</span>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </section>

        {/* Game Board Grid with Substantial Height */}
        <div 
          className="grid grid-cols-5 gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-3.5 flex-1" 
          style={{ gridTemplateRows: `repeat(${questionsPerCategory + 1}, minmax(${questionsPerCategory > 5 ? '72px' : '86px'}, 1fr))` }}
        >
          {categories.map((cat, i) => (
            <div
              key={cat}
              style={{ ...((i % 2 === 0 ? STYLES.cellJagged : STYLES.cellJaggedAlt) as React.CSSProperties), animationDelay: `${i * 50}ms` }}
              className="row-span-1 bg-[var(--color-surface-container-highest)] p-3 min-h-[50px] md:min-h-[56px] flex items-center justify-center border-b-2 border-[var(--color-primary-dim)] animate-power-on"
            >
              <h3 
                style={{ fontFamily: "'Kode Mono', monospace" }}
                className="font-turret font-extrabold text-xs md:text-sm text-white uppercase text-center leading-tight tracking-wider flex items-center gap-1"
              >
                {cleanCategoryName(cat)}
              </h3>
            </div>
          ))}

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
                      style={{ ...((totalIdx % 2 === 0 ? STYLES.cellJagged : STYLES.cellJaggedAlt) as React.CSSProperties) }}
                      className="h-full min-h-[76px] md:min-h-[92px] bg-[var(--color-surface-container-lowest)] flex flex-col items-center justify-center relative opacity-30 grayscale pointer-events-none animate-power-on animate-flicker"
                    >
                      <span 
                        style={{ fontFamily: "'Kode Mono', monospace" }}
                        className="font-turret font-bold text-3xl md:text-5xl text-[var(--color-outline)] tracking-wider line-through italic"
                      >
                        {question.value}
                      </span>
                      <span className="absolute rotate-12 text-[7px] font-mono font-bold text-red-600 bg-black px-1 uppercase">USED</span>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={`${colIdx}-${rowIdx}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: totalIdx * 0.02, duration: 0.3, ease: 'backOut' }}
                    whileHover={{ scale: 1.04, zIndex: 10 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => question.status === 'hidden' && onSelectQuestion(colIdx, rowIdx)}
                    style={{ ...((totalIdx % 2 === 0 ? STYLES.cellJagged : STYLES.cellJaggedAlt) as React.CSSProperties) }}
                    className="h-full min-h-[76px] md:min-h-[92px] bg-[var(--color-surface-container-low)] hover:bg-[var(--color-primary-dim)] group cursor-pointer flex flex-col items-center justify-center relative overflow-hidden transition-all duration-75 animate-power-on hover:animate-glitch"
                  >
                    <span 
                      style={{ fontFamily: "'Kode Mono', monospace", fontWeight: 800 }}
                      className="font-turret font-extrabold text-3xl md:text-5xl text-[var(--color-primary-dim)] group-hover:text-black tracking-wider transition-colors"
                    >
                      {question.value}
                    </span>
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-4 flex justify-between items-center h-10 border-t border-[var(--color-surface-container-highest)] pt-3 shrink-0 font-mono">
          <div className="flex items-center gap-3 flex-1">
            <div className="font-mono font-bold text-xs text-white uppercase tracking-tighter whitespace-nowrap">LAST_EVENT:</div>
            <div
              className="text-[var(--color-primary-dim)] font-mono font-bold tracking-widest text-[8px] bg-[var(--color-surface-container-high)] px-2.5 py-0.5 border-l-2 border-[var(--color-primary-dim)] line-clamp-1"
            >
              ACTIVE_PLAYER: {activePlayer.name.toUpperCase()}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <button
              onClick={onEndGame}
              className="text-[8px] text-[var(--color-outline)] hover:text-white font-mono font-bold tracking-[0.2em] uppercase transition-colors"
            >
              TERMINATE_GAME
            </button>
            <div className="flex gap-1">
              <div className="w-6 h-0.5 bg-[var(--color-primary-dim)]"></div>
              <div className="w-6 h-0.5 bg-[var(--color-surface-container-highest)]"></div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default GameBoardV3;
