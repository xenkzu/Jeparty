import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/ui/Navbar';
import Setup from './screens/Setup/Setup';
import GameBoard from './screens/GameBoard/GameBoard';
import QuestionModal from './screens/QuestionModal/QuestionModal';
import EndScreen from './screens/EndScreen/EndScreen';
import RulesScreen from './screens/RulesScreen/RulesScreen';
import { generateBoard, generateNewAudioQuestion } from './services/aiService';
import { prefetchBoardImages } from './services/imageService';
import { prefetchBoardAudio, clearAudioCache } from './services/audioService';
import { Game, GameSettings, Screen } from './types/game';
import { saveGame, loadGame, clearGame } from './services/persistenceService';
import SetupV1 from './screens/v1/SetupV1';
import GameBoardV1 from './screens/v1/GameBoardV1';
import QuestionModalV1 from './screens/v1/QuestionModalV1';
import EndScreenV1 from './screens/v1/EndScreenV1';
import SetupV3 from './screens/v3/SetupV3';
import GameBoardV3 from './screens/v3/GameBoardV3';
import QuestionModalV3 from './screens/v3/QuestionModalV3';
import EndScreenV3 from './screens/v3/EndScreenV3';
import { CyberpunkPreloader } from './components/ui/CyberpunkPreloader';
import { GeneratingBoardGlitch } from './components/ui/GeneratingBoardGlitch';
import { CyberViewportFrame } from './components/ui/CyberViewportFrame';

const SETTINGS_STORAGE_KEY = 'jeparty_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  timeLimit: 60,
  questionsPerCategory: 5,
  scoringMode: 'normal',
  uiVersion: 'v3',
};

const getStoredSettings = (): GameSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
};

function OptionButton({ label, sub, selected, onClick, groupId }: { label: string; sub?: string; selected: boolean; onClick: () => void; groupId: string }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex-1 py-3 px-4 text-left transition-all duration-200 border ${selected
        ? 'text-tertiary-container border-tertiary-container'
        : 'bg-[#000000] text-white/50 border-[#333333] hover:border-white/30 hover:bg-[#1a1a1a] hover:text-white/80'
        }`}
    >
      {selected && (
        <motion.div
          layoutId={`settings-slider-${groupId}`}
          className="absolute inset-0 bg-tertiary-container/10 shadow-[inset_4px_0_0_0_var(--color-primary-dim)] pointer-events-none"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10 font-mono font-bold text-xs uppercase tracking-widest block leading-tight">{label}</span>
      {sub && <span className="relative z-10 font-mono text-[10px] tracking-[0.1em] opacity-60 mt-1 block">{sub}</span>}
    </motion.button>
  );
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('SETUP');
  const [gameState, setGameState] = useState<Game | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const gameStateRef = useRef<Game | null>(null);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  if (gameState) console.debug("GAME_STREAM_INITIALIZED:", gameState.players.length, "players active");

  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState<{ players: string[], categories: string[] } | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Settings state — initialized with persisted user preferences
  const [settings, setSettings] = useState<GameSettings>(getStoredSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<GameSettings>(getStoredSettings);
  const [showPreloader, setShowPreloader] = useState(settings.uiVersion === 'v3');

  const handleSaveSettings = (newSettings: GameSettings) => {
    if (newSettings.uiVersion === 'v3' && settings.uiVersion !== 'v3') {
      setShowPreloader(true);
    }
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch {}
    setSettingsOpen(false);
  };

  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const mainEl = document.getElementById('main-scroll-area');
    if (!mainEl) return;
    const handleScroll = () => {
      const current = mainEl.scrollTop;
      setNavVisible(current < lastScrollY.current || current < 60);
      lastScrollY.current = current;
    };
    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  // Dev shortcut: Skip setup if screen parameter is in URL
  useEffect(() => {
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const screen = params.get('screen');

      // Use check for screen presence so we only initialize if specifically asked
      if (['question', 'game', 'winner'].includes(screen || '')) {
        console.warn(`[DEV] Jumping directly to: ${screen}`);

        const dummyPlayers = [
          { id: 'dev-1', name: 'DEV_ALPHA', score: 1400 },
          { id: 'dev-2', name: 'DEV_BETA', score: 850 },
          { id: 'dev-3', name: 'DEV_GAMMA', score: 2100 }
        ];

        const dummyGame: Game = {
          players: dummyPlayers,
          categories: ['HISTORY', 'SCIENCE', 'TECH', 'FILM', 'POP'],
          board: [
            {
              category: 'HISTORY',
              questions: [{ value: 100, question: 'Dummy?', answer: 'Dummy!', status: 'hidden' }]
            },
            // ...Simplified for dev board display
            ...Array(4).fill({ category: 'DATA', questions: [{ value: 100, question: '?', answer: '!', status: 'hidden' }] })
          ],
          scoringMode: 'normal',
          settings: { difficulty: 'medium', timeLimit: 60, questionsPerCategory: 5, scoringMode: 'normal', uiVersion: 'v2' },
          turnIndex: 0,
          currentQuestion: screen === 'question' ? { categoryIndex: 0, questionIndex: 0 } : null,
          skipChain: null
        };

        setGameState(dummyGame);
        if (screen === 'question') navigateTo('QUESTION');
        else if (screen === 'game') navigateTo('GAME');
        else if (screen === 'winner') navigateTo('END');
      }
    }
  }, []);

  // Restore saved game on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      setGameState(saved.gameState);
      setCurrentScreen(saved.currentScreen);
      setShowResumeBanner(true);
      setTimeout(() => setShowResumeBanner(false), 4000);
    }
  }, []);

  // Auto-save game state
  useEffect(() => {
    if (!gameState) return;
    if (currentScreen === 'GAME' || currentScreen === 'QUESTION') {
      saveGame(gameState, currentScreen);
    }
  }, [gameState, currentScreen]);

  /**
   * Logic Wiring: Handle game initialization via AI service.
   * Maps players, categories and scoring mode into a full Game state.
   */
  const handleStart = async (players: string[], categories: string[], settings: GameSettings) => {
    setLoadingData({ players, categories });
    setIsLoading(true);
    setLoadingError(null);

    try {
      // Logic Wiring: Generate board via AI service
      const board = await generateBoard(categories, settings);

      // Logic Wiring: Build full Game object using verified structure
      const newGame: Game = {
        players: players.map(name => ({ id: crypto.randomUUID(), name, score: 0 })),
        categories,
        board,
        scoringMode: settings.scoringMode,
        settings,
        turnIndex: 0,
        currentQuestion: null,
        skipChain: null
      };

      setGameState(newGame);
      clearGame();
      prefetchBoardImages(board);
      prefetchBoardAudio(board);
      navigateTo('GAME');
    } catch (error) {
      setLoadingError(error instanceof Error ? error.message : 'System initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Normal question resolution — used for correct/wrong outside skip chain
  // and for final resolution inside skip chain
  const resolveQuestion = (
    categoryIndex: number,
    questionIndex: number,
    scoreDelta: number,
    nextTurnIndex: number
  ) => {
    const gs = gameStateRef.current;
    if (!gs) return;
    const newPlayers = gs.players.map((p, i) =>
      i === gs.turnIndex ? { ...p, score: p.score + scoreDelta } : p
    );
    const newBoard = gs.board.map((cat, ci) =>
      ci !== categoryIndex ? cat : {
        ...cat,
        questions: cat.questions.map((q, qi) =>
          qi !== questionIndex ? q : { ...q, status: 'answered' as const }
        )
      }
    );
    setGameState({
      ...gs,
      players: newPlayers,
      board: newBoard,
      currentQuestion: null,
      skipChain: null,
      turnIndex: nextTurnIndex,
    });
    navigateTo('GAME');
  };

  const updateScoreAndStatus = (categoryIndex: number, questionIndex: number, scoreDelta: number) => {
    const gs = gameStateRef.current;
    if (!gs) return;
    const nextTurn = (gs.turnIndex + 1) % gs.players.length;
    resolveQuestion(categoryIndex, questionIndex, scoreDelta, nextTurn);
  };

  // Legacy wrapper for v1 UI
  const handleTurnTransition = (scoreDelta: number, markAsAnswered: boolean = false) => {
    const gs = gameStateRef.current;
    if (!gs || !gs.currentQuestion) return;
    const { categoryIndex, questionIndex } = gs.currentQuestion;
    if (markAsAnswered) {
      updateScoreAndStatus(categoryIndex, questionIndex, scoreDelta);
    } else {
      const newPlayers = gs.players.map((p, i) =>
        i === gs.turnIndex ? { ...p, score: p.score + scoreDelta } : p
      );
      setGameState({
        ...gs,
        players: newPlayers,
        turnIndex: (gs.turnIndex + 1) % gs.players.length
      });
    }
  };

  // Called when active player hits PASS
  const handlePass = (categoryIndex: number, questionIndex: number) => {
    const gs = gameStateRef.current;
    if (!gs) return;
    const n = gs.players.length;

    if (!gs.skipChain) {
      // First pass — Dev1 passes
      const originalIndex = gs.turnIndex;
      const nextRecipient = (originalIndex + 1) % n;
      const penalty = gs.board[categoryIndex].questions[questionIndex].value * 0.5;

      // Deduct 50% from passer
      const newPlayers = gs.players.map((p, i) =>
        i === originalIndex ? { ...p, score: p.score - penalty } : p
      );

      setGameState({
        ...gs,
        players: newPlayers,
        turnIndex: nextRecipient,
        skipChain: {
          originalPlayerIndex: originalIndex,
          originalTurnIndex: originalIndex,
          passedPlayerIndices: [originalIndex],
          currentRecipientIndex: nextRecipient,
        },
      });
      // Stay on QUESTION screen — just updated state
    } else {
      // Subsequent skip — recipient skips with 0 penalty
      const chain = gs.skipChain;
      const newPassed = [...chain.passedPlayerIndices, gs.turnIndex];
      const nextRecipient = (gs.turnIndex + 1) % n;

      // Check if question has come full circle back to original passer
      if (nextRecipient === chain.originalPlayerIndex) {
        // Full circle — auto-reveal, no score change, next turn = player after original
        const newBoard = gs.board.map((cat, ci) =>
          ci !== categoryIndex ? cat : {
            ...cat,
            questions: cat.questions.map((q, qi) =>
              qi !== questionIndex ? q : { ...q, status: 'answered' as const }
            )
          }
        );
        const nextTurn = (chain.originalPlayerIndex + 1) % n;
        setGameState({
          ...gs,
          board: newBoard,
          currentQuestion: null,
          skipChain: null,
          turnIndex: nextTurn,
        });
        navigateTo('GAME');
      } else {
        setGameState({
          ...gs,
          turnIndex: nextRecipient,
          skipChain: {
            ...chain,
            passedPlayerIndices: newPassed,
            currentRecipientIndex: nextRecipient,
          },
        });
      }
    }
  };

  // Called when recipient answers CORRECT during skip chain
  const handleSkipChainCorrect = (categoryIndex: number, questionIndex: number) => {
    const gs = gameStateRef.current;
    if (!gs || !gs.skipChain) return;
    const qValue = gs.board[categoryIndex].questions[questionIndex].value;
    const bonus = qValue * 0.5;
    // Next turn = player after original passer
    const nextTurn = (gs.skipChain.originalPlayerIndex + 1) % gs.players.length;
    resolveQuestion(categoryIndex, questionIndex, bonus, nextTurn);
  };

  // Called when recipient answers WRONG during skip chain
  const handleSkipChainWrong = (categoryIndex: number, questionIndex: number) => {
    const gs = gameStateRef.current;
    if (!gs || !gs.skipChain) return;
    const qValue = gs.board[categoryIndex].questions[questionIndex].value;
    const penalty = qValue * 0.5;
    const n = gs.players.length;
    const chain = gs.skipChain;
    const nextRecipient = (gs.turnIndex + 1) % n;

    // Deduct 50% from wrong answerer
    const newPlayers = gs.players.map((p, i) =>
      i === gs.turnIndex ? { ...p, score: p.score - penalty } : p
    );

    if (nextRecipient === chain.originalPlayerIndex) {
      // Full circle after wrong answer — auto-reveal
      const newBoard = gs.board.map((cat, ci) =>
        ci !== categoryIndex ? cat : {
          ...cat,
          questions: cat.questions.map((q, qi) =>
            qi !== questionIndex ? q : { ...q, status: 'answered' as const }
          )
        }
      );
      const nextTurn = (chain.originalPlayerIndex + 1) % n;
      setGameState({
        ...gs,
        players: newPlayers,
        board: newBoard,
        currentQuestion: null,
        skipChain: null,
        turnIndex: nextTurn,
      });
      navigateTo('GAME');
    } else {
      setGameState({
        ...gs,
        players: newPlayers,
        turnIndex: nextRecipient,
        skipChain: {
          ...chain,
          passedPlayerIndices: [...chain.passedPlayerIndices, gs.turnIndex],
          currentRecipientIndex: nextRecipient,
        },
      });
    }
  };

  const handleRefreshAudio = async () => {
    const gs = gameState;
    if (!gs || !gs.currentQuestion) return;
    const { categoryIndex, questionIndex } = gs.currentQuestion;
    const category = gs.board[categoryIndex].category;
    
    try {
      // Clear cache for the current term to ensure fresh fetch
      if (gs.board[categoryIndex].questions[questionIndex].searchTermAudio) {
        clearAudioCache(gs.board[categoryIndex].questions[questionIndex].searchTermAudio!);
      }

      const newQ = await generateNewAudioQuestion(category, gs.settings.difficulty);
      const newBoard = gs.board.map((cat, ci) => 
        ci !== categoryIndex ? cat : {
          ...cat,
          questions: cat.questions.map((q, qi) => 
            qi !== questionIndex ? q : {
              ...q,
              question: newQ.question,
              answer: newQ.answer,
              searchTermAudio: newQ.searchTermAudio
            }
          )
        }
      );
      setGameState({ ...gs, board: newBoard });
    } catch (e) {
      console.error("Failed to refresh audio question:", e);
    }
  };

  const renderQuestionPortal = () => {
    const gs = gameState;
    if (!gs || !gs.currentQuestion) return null;
    const { categoryIndex, questionIndex } = gs.currentQuestion;
    const currentQuestion = gs.board[categoryIndex].questions[questionIndex];
    const activePlayer = gs.players[gs.turnIndex];
    const minScore = Math.min(...gs.players.map(p => p.score));
    const isInSkipChain = !!gs.skipChain;
    const isUnderdog = !isInSkipChain && activePlayer.score === minScore;
    
    return createPortal(
      <AnimatePresence mode="wait">
        {currentScreen === 'QUESTION' && (
          <motion.div
            key="question-portal-wrap"
            initial={{ opacity: 0, scale: 1.1, clipPath: 'inset(45% 0 45% 0)' }}
            animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0 0% 0)' }}
            exit={{ opacity: 0, scale: 0.9, clipPath: 'inset(50% 0 50% 0)' }}
            transition={{ 
              duration: 0.6, 
              ease: [0.16, 1, 0.3, 1]
            }}
            className="fixed inset-0 z-[999999] bg-[#000000]"
          >
            {/* Rapid Scanline Background during transition */}
            <motion.div 
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-10 bg-[var(--color-primary-dim)] pointer-events-none opacity-20"
            />
            
            {settings.uiVersion === 'v1' ? (
              <QuestionModalV1
                question={{
                  value: currentQuestion.value,
                  question: currentQuestion.question,
                  answer: currentQuestion.answer,
                  status: currentQuestion.status,
                  searchTerm: currentQuestion.searchTerm,
                  searchTermAudio: currentQuestion.searchTermAudio
                }}
                categoryName={gs.board[categoryIndex].category}
                activePlayer={activePlayer}
                isUnderdog={isUnderdog}
                scoringMode={gs.scoringMode}
                timeLimit={gs.settings?.timeLimit ?? 0}
                onCorrect={() => {
                  const multiplier = isUnderdog ? 1.5 : 1;
                  handleTurnTransition(currentQuestion.value * multiplier, true);
                }}
                onWrong={() => {
                  const penalty = gs.scoringMode === 'normal' ? currentQuestion.value : currentQuestion.value * 0.75;
                  handleTurnTransition(-penalty, true);
                }}
                onPass={() => {
                  handleTurnTransition(0, false);
                }}
                onClose={() => {
                  setGameState(gs => gs ? { ...gs, currentQuestion: null } : null);
                  navigateTo('GAME');
                }}
              />
            ) : settings.uiVersion === 'v3' ? (
              <QuestionModalV3
                question={{ ...currentQuestion }}
                categoryName={gs.board[categoryIndex].category}
                activePlayer={activePlayer}
                isUnderdog={isUnderdog}
                scoringMode={gs.scoringMode}
                timeLimit={isInSkipChain ? 0 : (gs.settings?.timeLimit ?? 0)}
                isInSkipChain={isInSkipChain}
                skipChainOriginalPlayer={isInSkipChain
                  ? gs.players[gs.skipChain!.originalPlayerIndex].name
                  : null}
                onCorrect={() => {
                  if (isInSkipChain) {
                    handleSkipChainCorrect(categoryIndex, questionIndex);
                  } else {
                    const multiplier = isUnderdog ? 1.5 : 1;
                    updateScoreAndStatus(categoryIndex, questionIndex, currentQuestion.value * multiplier);
                  }
                }}
                onWrong={() => {
                  if (isInSkipChain) {
                    handleSkipChainWrong(categoryIndex, questionIndex);
                  } else {
                    const penalty = gs.scoringMode === 'normal'
                      ? currentQuestion.value
                      : currentQuestion.value * 0.75;
                    updateScoreAndStatus(categoryIndex, questionIndex, -penalty);
                  }
                }}
                onPass={() => handlePass(categoryIndex, questionIndex)}
                onForceReveal={() => {
                  // Host force-reveal — mark answered, next turn = player after original passer
                  const nextTurn = isInSkipChain
                    ? (gs.skipChain!.originalPlayerIndex + 1) % gs.players.length
                    : (gs.turnIndex + 1) % gs.players.length;
                  const newBoard = gs.board.map((cat, ci) =>
                    ci !== categoryIndex ? cat : {
                      ...cat,
                      questions: cat.questions.map((q, qi) =>
                        qi !== questionIndex ? q : { ...q, status: 'answered' as const }
                      )
                    }
                  );
                  setGameState({
                    ...gs,
                    board: newBoard,
                    currentQuestion: null,
                    skipChain: null,
                    turnIndex: nextTurn,
                  });
                  navigateTo('GAME');
                }}
                onClose={() => {
                  setGameState(gs => gs ? { ...gs, currentQuestion: null, skipChain: null } : null);
                  navigateTo('GAME');
                }}
                onRefreshAudio={handleRefreshAudio}
              />
            ) : (
              <QuestionModal
                question={{ ...currentQuestion }}
                categoryName={gs.board[categoryIndex].category}
                activePlayer={activePlayer}
                isUnderdog={isUnderdog}
                scoringMode={gs.scoringMode}
                timeLimit={isInSkipChain ? 0 : (gs.settings?.timeLimit ?? 0)}
                isInSkipChain={isInSkipChain}
                skipChainOriginalPlayer={isInSkipChain
                  ? gs.players[gs.skipChain!.originalPlayerIndex].name
                  : null}
                onCorrect={() => {
                  if (isInSkipChain) {
                    handleSkipChainCorrect(categoryIndex, questionIndex);
                  } else {
                    const multiplier = isUnderdog ? 1.5 : 1;
                    updateScoreAndStatus(categoryIndex, questionIndex, currentQuestion.value * multiplier);
                  }
                }}
                onWrong={() => {
                  if (isInSkipChain) {
                    handleSkipChainWrong(categoryIndex, questionIndex);
                  } else {
                    const penalty = gs.scoringMode === 'normal'
                      ? currentQuestion.value
                      : currentQuestion.value * 0.75;
                    updateScoreAndStatus(categoryIndex, questionIndex, -penalty);
                  }
                }}
                onPass={() => handlePass(categoryIndex, questionIndex)}
                onForceReveal={() => {
                  // Host force-reveal — mark answered, next turn = player after original passer
                  const nextTurn = isInSkipChain
                    ? (gs.skipChain!.originalPlayerIndex + 1) % gs.players.length
                    : (gs.turnIndex + 1) % gs.players.length;
                  const newBoard = gs.board.map((cat, ci) =>
                    ci !== categoryIndex ? cat : {
                      ...cat,
                      questions: cat.questions.map((q, qi) =>
                        qi !== questionIndex ? q : { ...q, status: 'answered' as const }
                      )
                    }
                  );
                  setGameState({
                    ...gs,
                    board: newBoard,
                    currentQuestion: null,
                    skipChain: null,
                    turnIndex: nextTurn,
                  });
                  navigateTo('GAME');
                }}
                onClose={() => {
                  setGameState(gs => gs ? { ...gs, currentQuestion: null, skipChain: null } : null);
                  navigateTo('GAME');
                }}
                onRefreshAudio={handleRefreshAudio}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  const renderScreen = () => {
    // Fullscreen loading state: Use Cyberpunk Generating Board Glitch for v3
    if (isLoading) {
      if (settings.uiVersion === 'v3') {
        return (
          <GeneratingBoardGlitch
            categories={loadingData?.categories}
            players={loadingData?.players}
          />
        );
      }

      const qCount = settings.questionsPerCategory || 5;
      const cats = loadingData?.categories || ['CATEGORY 1', 'CATEGORY 2', 'CATEGORY 3', 'CATEGORY 4', 'CATEGORY 5'];
      const players = loadingData?.players || ['PLAYER 1', 'PLAYER 2', 'PLAYER 3'];

      return (
        <div className="flex-1 flex flex-col bg-[var(--color-background)] p-6 overflow-hidden">
          {/* Skeleton Scoreboard */}
          <section className="flex flex-wrap gap-4 mb-10 shrink-0 opacity-50">
            {players.map((_, idx) => (
              <div
                key={idx}
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 90% 100%, 0 100%)' }}
                className="px-6 py-4 flex items-center gap-8 border-l-[6px] bg-[var(--color-surface-container-high)] border-[var(--color-primary-dim)]/40 w-56 animate-pulse"
              >
                <div className="flex flex-col gap-3 w-full">
                  <div className="h-2 w-12 bg-white/20 rounded"></div>
                  <div className="h-5 w-24 bg-white/20 rounded"></div>
                </div>
              </div>
            ))}
          </section>

          {/* Skeleton Board */}
          <div className="grid grid-cols-5 gap-x-10 gap-y-5 flex-1 relative" style={{ gridTemplateRows: `repeat(${qCount + 1}, minmax(${qCount > 5 ? '80px' : '100px'}, 1fr))` }}>
            
            {/* Shimmer Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
              <div className="bg-black/60 absolute inset-0 backdrop-blur-sm"></div>
              <h2 className="font-display text-4xl md:text-6xl text-[var(--color-primary-dim)] uppercase tracking-tighter text-center animate-blink-cursor relative z-20 drop-shadow-2xl flex items-center gap-4">
                <span className="material-symbols-outlined text-5xl md:text-7xl opacity-80" style={{ animation: 'spin 4s linear infinite' }}>memory</span>
                GENERATING BOARD...
              </h2>
            </div>

            {/* Category Headers */}
            {cats.map((_, i) => (
              <div
                key={i}
                style={{ clipPath: i % 2 === 0 ? 'polygon(2% 2%, 98% 0, 100% 98%, 0 100%)' : 'polygon(0 5%, 100% 0, 95% 100%, 5% 95%)' }}
                className="row-span-1 bg-[var(--color-surface-container-highest)] p-2 flex items-center justify-center border-b-2 border-[var(--color-primary-dim)]/20 animate-pulse"
              >
                 <div className="h-3 w-3/4 bg-white/20 rounded"></div>
              </div>
            ))}

            {/* Question Cells */}
            {Array.from({ length: qCount }).map((_, rowIdx) => (
              <React.Fragment key={rowIdx}>
                {cats.map((_, colIdx) => {
                  const totalIdx = rowIdx * 5 + colIdx;
                  return (
                    <div
                      key={`${colIdx}-${rowIdx}`}
                      style={{ clipPath: totalIdx % 2 === 0 ? 'polygon(2% 2%, 98% 0, 100% 98%, 0 100%)' : 'polygon(0 5%, 100% 0, 95% 100%, 5% 95%)' }}
                      className="h-full bg-[var(--color-surface-container-low)] flex flex-col items-center justify-center animate-pulse"
                    >
                      <div className="h-6 w-16 bg-[var(--color-primary-dim)]/20 rounded"></div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    // Logic Wiring: Fullscreen error state with retry functionality
    if (loadingError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center p-6 bg-surface-container-lowest">
          <div className="bg-tertiary-container/10 border-2 border-tertiary-container p-12 max-w-xl">
            <h2 className="font-display text-2xl text-tertiary-container mb-4 uppercase tracking-wider">SYSTEM_FAILURE</h2>
            <p className="font-body text-white/80 mb-8 max-w-sm mx-auto uppercase text-sm tracking-widest">{loadingError}</p>
            <button
              onClick={() => { setLoadingError(null); navigateTo('SETUP'); }}
              className="bg-white text-black font-display font-bold px-12 py-4 hover:bg-tertiary-container hover:text-white transition-colors uppercase tracking-widest text-sm"
            >
              RETRY_INITIALIZATION
            </button>
          </div>
        </div>
      );
    }

    switch (currentScreen) {
      case 'SETUP':
        if (settings.uiVersion === 'v1') {
          return <SetupV1 onStart={handleStart} onOpenSettings={() => setSettingsOpen(true)} currentSettings={settings} />;
        }
        if (settings.uiVersion === 'v3') {
          return <SetupV3 onStart={handleStart} onOpenSettings={() => setSettingsOpen(true)} currentSettings={settings} />;
        }
        return <Setup onStart={handleStart} onOpenSettings={() => setSettingsOpen(true)} currentSettings={settings} />;
      case 'GAME':
        if (!gameState) {
          if (settings.uiVersion === 'v1') return <SetupV1 onStart={handleStart} currentSettings={settings} />;
          if (settings.uiVersion === 'v3') return <SetupV3 onStart={handleStart} currentSettings={settings} />;
          return <Setup onStart={handleStart} currentSettings={settings} />;
        }
        if (settings.uiVersion === 'v1') {
          return (
            <GameBoardV1
              game={gameState}
              onSelectQuestion={(categoryIndex, questionIndex) => {
                setGameState({
                  ...gameState,
                  currentQuestion: { categoryIndex, questionIndex }
                });
                navigateTo('QUESTION');
              }}
              onEndGame={() => { clearGame(); navigateTo('END'); }}
            />
          );
        }
        if (settings.uiVersion === 'v3') {
          return (
            <GameBoardV3
              game={gameState}
              onSelectQuestion={(categoryIndex, questionIndex) => {
                setGameState({
                  ...gameState,
                  currentQuestion: { categoryIndex, questionIndex }
                });
                navigateTo('QUESTION');
              }}
              onEndGame={() => { clearGame(); navigateTo('END'); }}
            />
          );
        }
        return (
          <GameBoard
            game={gameState}
            onSelectQuestion={(categoryIndex, questionIndex) => {
              setGameState({
                ...gameState,
                currentQuestion: { categoryIndex, questionIndex }
              });
              navigateTo('QUESTION');
            }}
            onEndGame={() => { clearGame(); navigateTo('END'); }}
          />
        );
      case 'QUESTION':
        // Modal is rendered via portal at the App root — return the board underneath
        if (!gameState) {
          if (settings.uiVersion === 'v1') return <SetupV1 onStart={handleStart} currentSettings={settings} />;
          if (settings.uiVersion === 'v3') return <SetupV3 onStart={handleStart} currentSettings={settings} />;
          return <Setup onStart={handleStart} currentSettings={settings} />;
        }
        if (settings.uiVersion === 'v1') {
          return (
            <GameBoardV1
              game={gameState}
              onSelectQuestion={(categoryIndex, questionIndex) => {
                setGameState({ ...gameState, currentQuestion: { categoryIndex, questionIndex } });
                navigateTo('QUESTION');
              }}
              onEndGame={() => { clearGame(); navigateTo('END'); }}
            />
          );
        }
        if (settings.uiVersion === 'v3') {
          return (
            <GameBoardV3
              game={gameState}
              onSelectQuestion={(categoryIndex, questionIndex) => {
                setGameState({ ...gameState, currentQuestion: { categoryIndex, questionIndex } });
                navigateTo('QUESTION');
              }}
              onEndGame={() => { clearGame(); navigateTo('END'); }}
            />
          );
        }
        return (
          <GameBoard
            game={gameState}
            onSelectQuestion={(categoryIndex, questionIndex) => {
              setGameState({ ...gameState, currentQuestion: { categoryIndex, questionIndex } });
              navigateTo('QUESTION');
            }}
            onEndGame={() => { clearGame(); navigateTo('END'); }}
          />
        );
      case 'RULES':
        return <RulesScreen />;
      case 'END':
        if (!gameState) {
          if (settings.uiVersion === 'v1') return <SetupV1 onStart={handleStart} currentSettings={settings} />;
          if (settings.uiVersion === 'v3') return <SetupV3 onStart={handleStart} currentSettings={settings} />;
          return <Setup onStart={handleStart} currentSettings={settings} />;
        }
        if (settings.uiVersion === 'v1') {
          return (
            <EndScreenV1
              players={gameState.players}
              onRestart={() => {
                clearGame();
                setGameState(null);
                setLoadingError(null);
                setIsLoading(false);
                navigateTo('SETUP');
              }}
            />
          );
        }
        if (settings.uiVersion === 'v3') {
          return (
            <EndScreenV3
              players={gameState.players}
              onRestart={() => {
                clearGame();
                setGameState(null);
                setLoadingError(null);
                setIsLoading(false);
                navigateTo('SETUP');
              }}
            />
          );
        }
        return (
          <EndScreen
            players={gameState.players}
            onRestart={() => {
              clearGame();
              setGameState(null);
              setLoadingError(null);
              setIsLoading(false);
              navigateTo('SETUP');
            }}
          />
        );
      default:
        return <div>Error loading game state.</div>;
    }
  };

  return (
    <>
      <div className="h-full w-full flex flex-col bg-surface-container-lowest text-on-surface overflow-hidden font-body">

        {/* Global Settings Modal */}
        <AnimatePresence>
          {settingsOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSettingsOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: { opacity: 0, scale: 0.98, y: 15 },
                  visible: { 
                    opacity: 1, scale: 1, y: 0, 
                    transition: { type: 'spring', damping: 30, stiffness: 400, staggerChildren: 0.03, delayChildren: 0.05 } 
                  },
                  exit: { opacity: 0, scale: 0.98, y: 15, transition: { duration: 0.15 } }
                }}
                className="relative bg-[#0D0D0D] border-t-2 border-tertiary-container w-full max-w-lg p-8 flex flex-col gap-8"
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-20 h-0.5 bg-tertiary-container shadow-[0_0_10px_var(--color-tertiary-container)]"></div>
                <div className="absolute bottom-0 right-0 w-32 h-0.5 bg-tertiary-container shadow-[0_0_10px_var(--color-tertiary-container)]"></div>

                <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
                  <h2 className="font-zalando font-black text-2xl tracking-tight text-white uppercase flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary-container text-2xl">settings_system_daydream</span>
                    SYSTEM_CONFIG
                  </h2>
                </motion.div>

                <div className="flex flex-col gap-5 w-full font-mono">
                  <motion.div variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#666666]">Difficulty</span>
                    <div className="flex gap-3">
                      <OptionButton groupId="difficulty" label="EASY" sub="Common" selected={pendingSettings.difficulty === 'easy'} onClick={() => setPendingSettings(s => ({ ...s, difficulty: 'easy' }))} />
                      <OptionButton groupId="difficulty" label="MEDIUM" sub="Expertise" selected={pendingSettings.difficulty === 'medium'} onClick={() => setPendingSettings(s => ({ ...s, difficulty: 'medium' }))} />
                      <OptionButton groupId="difficulty" label="HARD" sub="Expert" selected={pendingSettings.difficulty === 'hard'} onClick={() => setPendingSettings(s => ({ ...s, difficulty: 'hard' }))} />
                    </div>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#666666]">Time Limit</span>
                    <div className="flex gap-3">
                      <OptionButton groupId="timer" label="30S" selected={pendingSettings.timeLimit === 30} onClick={() => setPendingSettings(s => ({ ...s, timeLimit: 30 }))} />
                      <OptionButton groupId="timer" label="60S" selected={pendingSettings.timeLimit === 60} onClick={() => setPendingSettings(s => ({ ...s, timeLimit: 60 }))} />
                      <OptionButton groupId="timer" label="INF" selected={pendingSettings.timeLimit === 0} onClick={() => setPendingSettings(s => ({ ...s, timeLimit: 0 }))} />
                    </div>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#666666]">Questions Per Category</span>
                    <div className="flex gap-3">
                      <OptionButton groupId="questions" label="3" selected={pendingSettings.questionsPerCategory === 3} onClick={() => setPendingSettings(s => ({ ...s, questionsPerCategory: 3 }))} />
                      <OptionButton groupId="questions" label="5" selected={pendingSettings.questionsPerCategory === 5} onClick={() => setPendingSettings(s => ({ ...s, questionsPerCategory: 5 }))} />
                      <OptionButton groupId="questions" label="7" selected={pendingSettings.questionsPerCategory === 7} onClick={() => setPendingSettings(s => ({ ...s, questionsPerCategory: 7 }))} />
                    </div>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#666666]">Scoring Mode</span>
                    <div className="flex gap-3">
                      <OptionButton groupId="scoring" label="STANDARD" sub="Persistent" selected={pendingSettings.scoringMode === 'normal'} onClick={() => setPendingSettings(s => ({ ...s, scoringMode: 'normal' }))} />
                      <OptionButton groupId="scoring" label="ADVANCED" sub="Permadeath" selected={pendingSettings.scoringMode === 'advanced'} onClick={() => setPendingSettings(s => ({ ...s, scoringMode: 'advanced' }))} />
                    </div>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#666666]">UI Version</span>
                    <div className="flex gap-3 flex-wrap">
                      <OptionButton groupId="ui" label="V1_CLASSIC" sub="Cyberpunk" selected={pendingSettings.uiVersion === 'v1'} onClick={() => setPendingSettings(s => ({ ...s, uiVersion: 'v1' }))} />
                      <OptionButton groupId="ui" label="V2_MODERN" sub="Aesthetic" selected={pendingSettings.uiVersion === 'v2'} onClick={() => setPendingSettings(s => ({ ...s, uiVersion: 'v2' }))} />
                      <OptionButton groupId="ui" label="V3_ULTRA" sub="Next Gen" selected={pendingSettings.uiVersion === 'v3'} onClick={() => setPendingSettings(s => ({ ...s, uiVersion: 'v3' }))} />
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex gap-4 mt-2 font-mono">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSettingsOpen(false)}
                    className="flex-none px-8 py-4 border border-[#333333] text-white/40 font-mono font-bold text-xs tracking-widest uppercase hover:border-white/30 hover:text-white transition-colors"
                  >
                    ABORT
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSaveSettings(pendingSettings)}
                    className="flex-1 bg-tertiary-container hover:bg-white text-black font-mono font-bold text-xs tracking-widest uppercase py-4 transition-colors [clip-path:polygon(0_0,100%_0,95%_100%,0%_100%)] flex items-center justify-center gap-2"
                  >
                    SAVE_CONFIG
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cyberpunk Edgerunners Preloader */}
        <AnimatePresence>
          {showPreloader && settings.uiVersion === 'v3' && (
            <CyberpunkPreloader onComplete={() => setShowPreloader(false)} />
          )}
        </AnimatePresence>

        {/* Top Navbar (Figma-inspired hanging notch shape) */}
        {(!showPreloader || settings.uiVersion !== 'v3') && (
          <Navbar
            currentScreen={currentScreen}
            navVisible={navVisible}
            onNavigate={(screen) => navigateTo(screen)}
            onOpenSettings={() => { setPendingSettings(settings); setSettingsOpen(true); }}
            onNewGame={() => { clearGame(); setGameState(null); navigateTo('SETUP'); }}
            onOpenLeaderboard={() => {}}
          />
        )}

        {/* CyberCN Viewport Edge Frame for V3 Setup */}
        {(!showPreloader || settings.uiVersion !== 'v3') && settings.uiVersion === 'v3' && currentScreen === 'SETUP' && (
          <CyberViewportFrame />
        )}

        {/* Main Body — Sidebar Removed */}
        <div className="flex-1 overflow-hidden flex relative">

          {/* Main Area: Non-scrollable on SETUP, scrollable on other pages */}
          {(!showPreloader || settings.uiVersion !== 'v3') && (
            <main 
              id="main-scroll-area" 
              className={`flex-1 h-full min-h-0 ${
                currentScreen === 'SETUP' ? 'overflow-hidden' : 'overflow-y-auto'
              } bg-[#000000] relative flex flex-col pt-24 sm:pt-28`}
            >
              <div className="w-full max-w-[1680px] mx-auto px-8 sm:px-14 md:px-20 lg:px-28 xl:px-36 pt-4 lg:pt-6 flex-1 flex flex-col justify-start">

                {/* Inject Active Screen Component */}
                <AnimatePresence mode="wait">
                  <div key={currentScreen} className="flex-1 flex flex-col">
                    {renderScreen()}
                  </div>
                </AnimatePresence>
              </div>
            </main>
          )}

        </div>
      </div>

      {/* Bug 1: QuestionModal as a React Portal — renders above ALL layout including sidebar/header */}
      {renderQuestionPortal()}

      <AnimatePresence>
        {showResumeBanner && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-[#000000] border border-tertiary-container/60 px-8 py-3 flex items-center gap-4"
          >
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <span className="font-mono text-xs text-white/70 tracking-widest uppercase">
              SESSION_RESTORED — Game resumed from last save
            </span>
            <button
              onClick={() => setShowResumeBanner(false)}
              className="text-white/30 hover:text-white font-mono text-xs ml-4"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;

