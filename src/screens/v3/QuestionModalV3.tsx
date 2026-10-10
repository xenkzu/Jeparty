import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImage } from '../../services/imageService';
import { PageTransition } from '../../components/ui/PageTransition';
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
    source?: string | null;
    popularityRank?: number | null;
  };
  categoryName: string;
  activePlayer: { name: string; score: number };
  isUnderdog: boolean;
  scoringMode: 'normal' | 'advanced';
  timeLimit: 30 | 60 | 0;
  onCorrect: () => void;
  onWrong: () => void;
  onPass: () => void;
  onClose: () => void;
  onRefreshAudio?: () => void;
  isInSkipChain: boolean;
  skipChainOriginalPlayer: string | null;
  onForceReveal: () => void;
}

const QuestionModalV3: React.FC<QuestionModalProps> = ({
  question,
  categoryName,
  activePlayer,
  isUnderdog,
  scoringMode,
  timeLimit,
  onCorrect,
  onWrong,
  onPass,
  onClose,
  onRefreshAudio,
  isInSkipChain,
  skipChainOriginalPlayer,
  onForceReveal
}) => {
  const [revealed, setRevealed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!question.searchTerm) return;
    setImageLoading(true);
    
    const lowerCat = categoryName.toLowerCase();
    const isVisualCategory = lowerCat.includes('movie') || lowerCat.includes('film') || lowerCat.includes('cinema') || lowerCat.includes('actor') || lowerCat.includes('actress');
    
    resolveImage(question.searchTerm, isVisualCategory, refreshKey).then(url => {
      if (url) setImageUrl(url);
      setImageLoading(false);
    });
  }, [question.searchTerm, categoryName, refreshKey]);

  useEffect(() => {
    if (!question.searchTermAudio) return;
    setAudioLoading(true);
    resolveAudio(question.searchTermAudio).then(url => {
      setAudioUrl(url);
      setAudioLoading(false);
    });
  }, [question.searchTermAudio]);

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
    correct: isInSkipChain
      ? `+${val * 0.5}`
      : `+${val * multiplier}`,
    wrong: isInSkipChain
      ? `-${val * 0.5}`
      : scoringMode === 'normal' ? `-${val}` : `-${val * 0.75}`,
    pass: isInSkipChain ? '0' : scoringMode === 'normal'
      ? `-${val * 0.5}`
      : `-${val * 0.375}`,
  };

  const STYLES = {
    shardBg: { clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)' },
    jaggedBorder: { clipPath: 'polygon(0 0, 100% 2%, 99% 98%, 1% 100%)' },
    statusBar: { background: 'rgba(255, 255, 255, 0.03)' },
    modalOverlay: { background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(8px)' }
  };

  const isUrgent = timeLimit > 0 && !revealed && timeLeft <= 10;

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden">
      <PageTransition className="w-full h-full flex flex-col bg-[#000000] text-white">

        <main className="relative flex-1 bg-surface flex flex-col items-center justify-between overflow-hidden w-full">
          
          {/* Header Info - Fixed to Top */}
          <div className="w-full flex flex-wrap justify-between items-center py-3 px-8 md:px-16 opacity-90 hover:opacity-100 transition-opacity duration-300 border-b border-white/5 bg-black/40 shrink-0 font-mono">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-tertiary-container text-black tracking-widest uppercase">
                  V3_INTEL
                </span>
                <div className="text-white font-mono text-xs uppercase tracking-[0.3em] font-bold">
                  {cleanCategoryName(categoryName)}
                </div>
              </div>
              
              {/* HUD Timer */}
              {timeLimit > 0 && !revealed && (
                <div className="flex items-center gap-4 min-w-[120px]">
                  <span className="font-mono text-sm text-[#00f0ff] font-black tabular-nums">
                    {String(timeLeft).padStart(2, '0')}S
                  </span>
                  <div className="h-0.5 w-24 bg-white/10 relative">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-white font-mono text-sm md:text-base uppercase tracking-widest font-black select-none">
                VALUE: {val}
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <button 
                onClick={onForceReveal}
                className="text-white font-mono text-[10px] uppercase tracking-[0.2em] font-black hover:text-[#fcee0a] transition-all flex items-center gap-2 group"
              >
                <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform">visibility</span>
                FORCE REVEAL
              </button>
              <div className="w-px h-4 bg-white/20"></div>
              <button 
                onClick={onClose}
                className="text-white font-mono text-[10px] uppercase tracking-[0.2em] font-black hover:text-[#fcee0a] transition-all flex items-center gap-2 group"
              >
                <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform">close</span>
                CLOSE
              </button>
            </div>
          </div>

          {/* Modal Content Canvas */}
          <section className="w-full flex-1 flex flex-col items-center justify-center relative py-6 px-4 md:px-8 overflow-y-auto">
            <div className="relative group w-full max-w-6xl mx-auto">
              <div className="absolute inset-0 bg-[#1f1f1f] -z-10 transform group-hover:scale-[1.005] transition-transform duration-150" style={STYLES.jaggedBorder}></div>

              <div className="p-6 md:p-10 flex flex-col gap-8">
                <div className="space-y-4 text-left">
                  {isInSkipChain && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 mb-4 px-4 py-3 border-l-4 border-yellow-500 bg-yellow-500/5"
                    >
                      <span className="font-mono text-[10px] tracking-widest text-yellow-400 uppercase">
                        ⚡ SKIP CHAIN ACTIVE — Original: {skipChainOriginalPlayer} — Correct: +50% · Wrong: -50% · Skip: 0pts
                      </span>
                    </motion.div>
                  )}
                  <h1 
                    style={{ fontFamily: "'Kode Mono', monospace" }}
                    className="font-turret font-extrabold text-3xl md:text-6xl leading-[1.15] text-white uppercase tracking-tight"
                  >
                    {question.question.split(' ').map((word, i, arr) => (
                      <span key={i} className={i === arr.length - 1 ? 'text-[#fcee0a]' : 'text-white'}>
                        {word}{' '}
                      </span>
                    ))}
                  </h1>
                </div>

                {(imageUrl || imageLoading || audioUrl || audioLoading) && (
                  <div className="flex flex-col md:flex-row gap-8 items-start justify-start">
                    {(imageUrl || imageLoading) && (
                      <div className="relative group w-full md:w-2/3">
                        <motion.div 
                          initial={{ clipPath: 'polygon(100% 0, 100% 0, 100% 0, 100% 0)' }}
                          animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                          className="w-full border-2 border-[#fcee0a]/30 bg-black/40 overflow-hidden"
                        >
                          {imageLoading ? (
                            <div className="aspect-video w-full flex items-center justify-center bg-white/5 animate-pulse text-[#ababab] font-mono text-xs tracking-widest">FETCHING_INTEL...</div>
                          ) : (
                            <img src={imageUrl!} alt="Intel" className="w-full h-auto max-h-[40vh] object-contain block mx-auto" />
                          )}
                        </motion.div>
                        {!revealed && !imageLoading && (
                          <button 
                            onClick={() => setRefreshKey(prev => prev + 1)}
                            className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-[#fcee0a] hover:text-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 flex items-center justify-center border border-white/20"
                          >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                          </button>
                        )}
                      </div>
                    )}
                    {(audioUrl || audioLoading) && (
                      <div className="w-full md:w-1/2 bg-[#141414] p-6 border-l-4 border-[#00f0ff] relative group">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#00f0ff] animate-pulse">settings_input_antenna</span>
                            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00f0ff]">INCOMING_SIGNAL_ACQUIRED</p>
                          </div>
                          
                          {audioLoading ? (
                            <div className="h-24 w-full flex items-center justify-center bg-white/5 animate-pulse text-xs tracking-widest text-[#666] font-mono">DECODING_AUDIO...</div>
                          ) : (
                            <AudioPlayer previewUrl={audioUrl} isLoading={audioLoading} />
                          )}
                        </div>
                        {!revealed && !audioLoading && onRefreshAudio && (
                          <button 
                            onClick={onRefreshAudio}
                            className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-[#00f0ff] hover:text-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 flex items-center justify-center border border-white/20"
                          >
                            <span className="material-symbols-outlined text-sm">cached</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6 items-center justify-start font-mono">
                  {!revealed ? (
                    <div className="flex flex-wrap gap-6 w-full justify-start">
                      <button
                        onClick={handleReveal}
                        className="bg-[#fcee0a] text-black px-12 py-6 font-mono font-black text-2xl md:text-3xl uppercase tracking-tight active:scale-95 transition-all shadow-[6px_6px_0px_0px_white] hover:shadow-[8px_8px_0px_0px_rgba(252,238,10,0.6)] hover:bg-[#fff238]"
                        style={STYLES.shardBg}
                      >
                        REVEAL ANSWER
                      </button>
                      <button
                        onClick={onPass}
                        className="border-2 border-[#00f0ff] text-[#00f0ff] px-12 py-6 font-mono font-black text-2xl md:text-3xl uppercase tracking-tight active:scale-95 transition-all hover:bg-[#00f0ff] hover:text-black shadow-[6px_6px_0px_0px_rgba(0,240,255,0.25)]"
                        style={STYLES.shardBg}
                      >
                        SKIP
                      </button>
                    </div>
                  ) : (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-8 w-full items-start"
                      >
                        <div className="bg-white/5 border-l-4 border-[#fcee0a] p-8 md:p-12 w-full text-left">
                          <p 
                            style={{ fontFamily: "'Kode Mono', monospace" }}
                            className="font-turret font-black text-2xl md:text-5xl text-[#fcee0a] italic tracking-wider uppercase"
                          >
                            {question.answer}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 opacity-70 hover:opacity-100 transition-opacity justify-start font-mono">
                          <>
                            <button onClick={onWrong} className="bg-[#1a1a1a] text-white px-6 py-3 font-mono font-bold text-sm uppercase tracking-tight border-b-4 border-[#ff0055] hover:bg-[#ff0055] hover:text-white transition-colors">
                              WRONG ({previews.wrong})
                            </button>
                            <button onClick={onCorrect} className="bg-[#1a1a1a] text-white px-6 py-3 font-mono font-bold text-sm uppercase tracking-tight border-b-4 border-[#fcee0a] hover:bg-[#fcee0a] hover:text-black transition-colors">
                              CORRECT ({previews.correct})
                            </button>
                            <button onClick={onPass} className="bg-[#1a1a1a] text-white px-6 py-3 font-mono font-bold text-sm uppercase tracking-tight border-b-4 border-white/40 hover:bg-white hover:text-black transition-colors">
                              {isInSkipChain ? `SKIP (0pts)` : `PASS (${previews.pass})`}
                            </button>
                          </>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Footer / Status Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 px-8 md:px-16 pb-[20px] z-20 shrink-0 font-mono">
            <div className="bg-[#131313] p-4 flex justify-between items-center border border-white/5">
              <span className="font-mono text-xs text-white/40 tracking-widest uppercase">TIME REMAINING</span>
              <span className={`font-mono font-bold text-3xl ${isUrgent ? 'text-[#ff0055]' : 'text-[#00f0ff]'}`}>
                {timeLimit === 0 ? '∞' : revealed ? 'LOCKED' : `${timeLeft}s`}
              </span>
            </div>
            <div className="bg-[#131313] p-4 flex justify-between items-center border-l-4 border-[#fcee0a]">
              <span className="font-mono text-xs text-white/40 tracking-widest uppercase">STAKE POOL</span>
              <span className="font-mono font-bold text-3xl text-white">§ {activePlayer.score.toLocaleString()}</span>
            </div>
            <div className="bg-[#131313] p-4 flex justify-between items-center opacity-50">
              <span className="font-mono text-xs text-white/40 tracking-widest uppercase">MULTIPLIER</span>
              <span className="font-mono font-bold text-3xl text-white">x{multiplier.toFixed(1)}</span>
            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default QuestionModalV3;
