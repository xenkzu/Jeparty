import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImage } from '../../services/imageService';
import { PageTransition } from '../../components/ui/PageTransition';
import { CyberpunkButton } from '../../components/ui/CyberpunkButton';
import { AudioPlayer } from '../../components/ui/AudioPlayer';
import { resolveAudio } from '../../services/audioService';
import { cleanCategoryName } from '../../utils/gameUtils';

interface QuestionModalProps {
  question: { 
    value: number; 
    question: string; 
    answer: string; 
    status: string; 
    searchTerm?: string;
    searchTermAudio?: string;
  };
  categoryName: string;
  activePlayer: { name: string; score: number };
  isUnderdog: boolean;
  scoringMode: 'normal' | 'advanced';
  timeLimit: number;
  onCorrect: () => void;
  onWrong: () => void;
  onPass: () => void;
  onFinalPass?: () => void;
  onSkip?: (penalty: number) => void;
  onClose: () => void;
  onRefreshAudio?: () => void;
}

const QuestionModalV1: React.FC<QuestionModalProps> = ({ 
  question, 
  categoryName,
  activePlayer, 
  isUnderdog, 
  scoringMode,
  timeLimit,
  onCorrect, 
  onWrong, 
  onPass,
  onFinalPass,
  onSkip,
  onClose,
  onRefreshAudio
}) => {
  const [revealed, setRevealed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Image fetch
  useEffect(() => {
    if (!question.searchTerm) return;
    setImageLoading(true);
    resolveImage(question.searchTerm).then(url => {
      if (url) setImageUrl(url);
      setImageLoading(false);
    });
  }, [question.searchTerm]);

  // Audio fetch
  useEffect(() => {
    if (!question.searchTermAudio) return;
    setAudioLoading(true);
    resolveAudio(question.searchTermAudio).then(url => {
      setAudioUrl(url);
      setAudioLoading(false);
    });
  }, [question.searchTermAudio]);

  // Countdown timer
  useEffect(() => {
    if (timeLimit === 0 || revealed) return;

    setTimeLeft(timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onPass();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLimit, revealed]);

  const handleReveal = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRevealed(true);
  };

  const multiplier = isUnderdog ? 1.5 : 1;
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

  const isUrgent = timeLimit > 0 && !revealed && timeLeft <= 10;

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden">
      <PageTransition className="w-full h-full flex flex-col bg-[#0A0A0A] text-white overflow-y-auto">
      {/* 1. Global Navigation Bar */}
      <nav className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-white/5 bg-black/40">
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
            <span className="font-display font-bold text-[10px] uppercase tracking-widest bg-[var(--color-primary-dim)] text-black px-3 py-1">BACK TO BOARD</span>
          </button>
        </div>
      </nav>

      {/* 2. Content Header (Category & Value) */}
      <header className="px-12 py-10 shrink-0 flex justify-between items-end">
        <div className="bg-[var(--color-primary-dim)] text-black px-6 py-2">
          <span className="font-display font-black text-sm tracking-tighter uppercase italic">CATEGORY: {cleanCategoryName(categoryName)}</span>
        </div>
        <div className="font-display font-black text-6xl text-white/10 uppercase tracking-tighter italic scale-y-110 origin-bottom">
          VALUE: {val}
        </div>
      </header>

      {/* 3. Main Stage (Question Display) */}
      <main className="flex-1 flex flex-col justify-center px-12 md:px-24 max-w-7xl py-12">
        <div className="space-y-4">

          {/* Timer (only when active) */}
          {timeLimit > 0 && !revealed && (
            <div className="mb-6">
              <span className={`font-display font-black text-5xl italic tracking-tighter ${isUrgent ? 'text-[var(--color-error)] animate-pulse' : 'text-white/20'}`}>
                {String(timeLeft).padStart(2, '0')}s
              </span>
            </div>
          )}

          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[1] tracking-tighter uppercase italic animate-flicker" style={{ animationIterationCount: 2 }}>
            {(() => {
              const words = question.question.split(' ');
              return words.map((word, i) => (
                <span key={i} className={i === words.length - 1 ? 'text-[var(--color-primary-dim)]' : 'text-white'}>
                  {word}{' '}
                </span>
              ));
            })()}
          </h2>
        </div>

        {/* Visual Content (if present) */}
        {question.searchTerm && (
          <div className="mt-8 mb-4 max-w-xl">
            {imageLoading ? (
              <div className="w-full aspect-video bg-white/5 animate-pulse flex items-center justify-center border border-white/10">
                <span className="text-[10px] font-bold tracking-widest text-[#666666]">FETCHING_INTEL...</span>
              </div>
            ) : imageUrl ? (
              <div className="relative group overflow-hidden border-2 border-white/5">
                <img 
                  src={imageUrl} 
                  alt="Intel" 
                  className="w-full h-auto max-h-[40vh] object-contain bg-black/40" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ) : null}
          </div>
        )}

        {/* Audio Content (if present) */}
        {question.searchTermAudio && (
          <AudioPlayer
            previewUrl={audioUrl}
            isLoading={audioLoading}
          />
        )}

        {/* Action Layer */}
        <div className="mt-20 flex items-center gap-12">
          {!revealed ? (
            <CyberpunkButton 
              variant="primary"
              onClick={handleReveal}
              style={STYLES.revealShard}
              className="bg-[var(--color-primary-dim)] text-black font-display font-black text-3xl px-16 py-6 uppercase italic tracking-tighter"
            >
              REVEAL ANSWER
            </CyberpunkButton>
          ) : (
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-8"
                >
              <div className="bg-white/5 border-l-4 border-[var(--color-primary-dim)] p-8 animate-glitch">
                <p className="font-display font-black text-4xl text-[var(--color-primary-dim)] italic tracking-tighter uppercase">
                  {question.answer}
                </p>
              </div>
              <div className="flex items-center gap-10">
                <CyberpunkButton variant="ghost" onClick={onWrong} className="font-display font-bold text-xs tracking-[0.3em] text-white/40 hover:text-[var(--color-error)] uppercase underline underline-offset-8 decoration-2 hover:decoration-[var(--color-error)]">WRONG (<span className="animate-blink-cursor">{previews.wrong}</span>)</CyberpunkButton>
                <CyberpunkButton variant="ghost" onClick={onCorrect} className="font-display font-bold text-xs tracking-[0.3em] text-white/40 hover:text-green-500 uppercase underline underline-offset-8 decoration-2 hover:decoration-green-500">CORRECT (+<span className="animate-blink-cursor">{previews.correct}</span>)</CyberpunkButton>
                <CyberpunkButton variant="ghost" onClick={onPass} className="font-display font-bold text-xs tracking-[0.3em] text-white/40 hover:text-white uppercase underline underline-offset-8 decoration-2 hover:decoration-white">PASS (<span className="animate-blink-cursor">{previews.pass}</span>)</CyberpunkButton>
              </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* 4. Bottom Status Bar */}
      <footer style={STYLES.statusBar} className="h-20 flex items-center justify-between px-12 border-t border-white/5">
        <div className="flex gap-16">
          <div className="flex flex-col">
            <span className="text-[var(--color-outline)] font-display font-bold text-[8px] tracking-widest uppercase mb-1">TIME REMAINING</span>
            <span className={`font-display font-black text-xl italic tracking-tighter ${isUrgent ? 'text-[var(--color-error)]' : 'text-[var(--color-primary-dim)]'}`}>
              {timeLimit === 0 ? '∞' : revealed ? 'LOCKED' : `${timeLeft}s`}
            </span>
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
      </PageTransition>
    </div>
  );
};

export default QuestionModalV1;

