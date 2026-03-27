import React, { useState } from 'react';

interface QuestionModalProps {
  question: { value: number; question: string; answer: string; status: string };
  activePlayer: { name: string; score: number };
  lowestScoringPlayer: { name: string; score: number };
  scoringMode: 'normal' | 'advanced';
  onCorrect: () => void;
  onWrong: () => void;
  onPass: () => void;
  onClose: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ 
  question, 
  activePlayer, 
  lowestScoringPlayer, 
  scoringMode, 
  onCorrect, 
  onWrong, 
  onPass, 
  onClose 
}) => {
  const [revealed, setRevealed] = useState(false);

  const isLowest = activePlayer.score === lowestScoringPlayer.score;
  const multiplier = isLowest ? 1.5 : 1;
  const val = question.value;

  const previews = {
    correct: val * multiplier,
    wrong: scoringMode === 'normal' ? -val : -val * 0.75,
    pass: scoringMode === 'normal' ? -val * 0.5 : -val * 0.375,
  };

  const STYLES = {
    revealShard: { clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' },
    statusBar: { background: 'rgba(255, 255, 255, 0.03)' }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080808] text-white">
      {/* 1. Global Navigation Bar */}
      <nav className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-12">
          <span className="font-display font-black text-2xl text-[var(--color-primary-dim)] italic tracking-tighter">JEPARTY</span>
          <div className="hidden md:flex gap-10">
            {['ARENA', 'STAKES', 'LEGENDS'].map(item => (
              <span key={item} className={`font-display font-bold text-[10px] tracking-[0.2em] cursor-default ${item === 'STAKES' ? 'text-white border-b-2 border-[var(--color-primary-dim)] pb-1' : 'text-white/40'}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="text-white/40 hover:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">settings</span>
            <span className="font-display font-bold text-[10px] uppercase tracking-widest bg-[var(--color-primary-dim)] text-black px-3 py-1">NEW GAME</span>
          </button>
        </div>
      </nav>

      {/* 2. Content Header (Category & Value) */}
      <header className="px-12 py-10 flex justify-between items-end">
        <div className="bg-[var(--color-primary-dim)] text-black px-6 py-2">
          <span className="font-display font-black text-sm tracking-tighter uppercase italic">CATEGORY: {question.status === 'answered' ? 'LOCKED_SECTOR' : 'UNKNOWN_INTEL'}</span>
        </div>
        <div className="font-display font-black text-6xl text-white/10 uppercase tracking-tighter italic scale-y-110 origin-bottom">
          VALUE: {val}
        </div>
      </header>

      {/* 3. Main Stage (Question Display) */}
      <main className="flex-1 flex flex-col justify-center px-12 md:px-24 max-w-7xl">
        <div className="space-y-4">
          <h2 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter uppercase italic">
            {/* Logic: Highlight words in the question (simple heuristic: first word if it looks like a subject, or just display raw) */}
            {question.question.split(' ').map((word, i) => (
              <span key={i} className={i === 1 ? 'text-[var(--color-primary-dim)]' : 'text-white'}>
                {word}{' '}
              </span>
            ))}
          </h2>
        </div>

        {/* Action Layer */}
        <div className="mt-20 flex items-center gap-12">
          {!revealed ? (
            <button 
              onClick={() => setRevealed(true)}
              style={STYLES.revealShard}
              className="bg-[var(--color-primary-dim)] text-black font-display font-black text-3xl px-16 py-6 hover:translate-x-1 transition-transform uppercase italic tracking-tighter"
            >
              REVEAL ANSWER
            </button>
          ) : (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="bg-white/5 border-l-4 border-[var(--color-primary-dim)] p-8">
                <p className="font-display font-black text-4xl text-[var(--color-primary-dim)] italic tracking-tighter uppercase">
                  {question.answer}
                </p>
              </div>
              <div className="flex items-center gap-10">
                <button onClick={onWrong} className="font-display font-bold text-xs tracking-[0.3em] text-white/40 hover:text-[var(--color-error)] uppercase underline underline-offset-8 decoration-2 hover:decoration-[var(--color-error)]">WRONG ({previews.wrong})</button>
                <button onClick={onCorrect} className="font-display font-bold text-xs tracking-[0.3em] text-white/40 hover:text-green-500 uppercase underline underline-offset-8 decoration-2 hover:decoration-green-500">CORRECT (+{previews.correct})</button>
                <button onClick={onPass} className="font-display font-bold text-xs tracking-[0.3em] text-white/40 hover:text-white uppercase underline underline-offset-8 decoration-2 hover:decoration-white">PASS ({previews.pass})</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 4. Bottom Status Bar */}
      <footer style={STYLES.statusBar} className="h-20 flex items-center justify-between px-12 border-t border-white/5">
        <div className="flex gap-16">
          <div className="flex flex-col">
            <span className="text-[var(--color-outline)] font-display font-bold text-[8px] tracking-widest uppercase mb-1">TIME REMAINING</span>
            <span className="text-[var(--color-primary-dim)] font-display font-black text-xl italic tracking-tighter">14.02s</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[var(--color-outline)] font-display font-bold text-[8px] tracking-widest uppercase mb-1">STAKE POOL</span>
            <span className="font-display font-black text-xl italic tracking-tighter">$ {activePlayer.score.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[var(--color-outline)] font-display font-bold text-[8px] tracking-widest uppercase mb-1">MULTIPLIER</span>
          <span className="text-white/40 font-display font-black text-xl italic tracking-tighter">x{multiplier.toFixed(1)}</span>
        </div>
      </footer>
    </div>
  );
};

export default QuestionModal;
