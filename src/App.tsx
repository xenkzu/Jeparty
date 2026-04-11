import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './components/ui/Logo';
import Setup from './screens/Setup/Setup';
import GameBoard from './screens/GameBoard/GameBoard';
import QuestionModal from './screens/QuestionModal/QuestionModal';
import EndScreen from './screens/EndScreen/EndScreen';
import { generateBoard } from './services/aiService';
import { prefetchBoardImages } from './services/imageService';
import { prefetchBoardAudio } from './services/audioService';
import { Game, GameSettings } from './types/game';

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  timeLimit: 60,
  questionsPerCategory: 5,
  scoringMode: 'normal',
};

const FooterVisualizer = () => {
  const [isHovered, setIsHovered] = useState(false);
  // Generate stable random idle heights once
  const [idleHeights] = useState(() => [...Array(120)].map(() => 4 + Math.random() * 20));

  return (
    <div
      className="flex items-center gap-[2px] group cursor-crosshair h-20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {idleHeights.map((idleH, i) => (
        <motion.div
          key={i}
          className="w-[2px] bg-[#222222] group-hover:bg-tertiary-container transition-all duration-500 shadow-[0_0_8px_rgba(254,0,0,0)] group-hover:shadow-[0_0_12px_rgba(254,0,0,0.5)]"
          initial={{ height: idleH, opacity: 0.2 }}
          animate={isHovered ? {
            height: [idleH, idleH + 40, idleH + 10, idleH + 50, idleH],
            opacity: [0.3, 1, 0.4, 1, 0.3]
          } : {
            height: idleH,
            opacity: 0.2
          }}
          transition={{
            duration: 1.5 + (Math.random() * 1),
            repeat: isHovered ? Infinity : 0,
            delay: isHovered ? (i * 0.01) : 0,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

function OptionButton({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 text-left border transition-colors ${selected
        ? 'bg-tertiary-container text-on-tertiary-container border-tertiary-container'
        : 'bg-[#1A1A1A] text-white/60 border-[#333333] hover:border-white/30'
        }`}
    >
      <span className="font-display font-bold text-sm uppercase tracking-widest block">{label}</span>
      {sub && <span className="font-body text-[0.6rem] tracking-widest opacity-60 mt-0.5 block">{sub}</span>}
    </button>
  );
}

type Screen = 'SETUP' | 'GAME' | 'QUESTION' | 'END';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('SETUP');
  const [gameState, setGameState] = useState<Game | null>(null);
  const gameStateRef = useRef<Game | null>(null);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  if (gameState) console.debug("GAME_STREAM_INITIALIZED:", gameState.players.length, "players active");

  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Settings state — lives in App so cog button can open it from anywhere
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

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
          settings: { difficulty: 'medium', timeLimit: 60, questionsPerCategory: 5, scoringMode: 'normal' },
          turnIndex: 0,
          currentQuestion: screen === 'question' ? { categoryIndex: 0, questionIndex: 0 } : null
        };

        setGameState(dummyGame);
        if (screen === 'question') navigateTo('QUESTION');
        else if (screen === 'game') navigateTo('GAME');
        else if (screen === 'winner') navigateTo('END');
      }
    }
  }, []);

  /**
   * Logic Wiring: Handle game initialization via AI service.
   * Maps players, categories and scoring mode into a full Game state.
   */
  const handleStart = async (players: string[], categories: string[], settings: GameSettings) => {
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
        currentQuestion: null
      };

      setGameState(newGame);
      prefetchBoardImages(board);
      prefetchBoardAudio(board);
      navigateTo('GAME');
    } catch (error) {
      setLoadingError(error instanceof Error ? error.message : 'System initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateScoreAndStatus = (categoryIndex: number, questionIndex: number, scoreDelta: number) => {
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
      turnIndex: (gs.turnIndex + 1) % gs.players.length
    });
    navigateTo('GAME');
  };

  const renderQuestionPortal = () => {
    if (currentScreen !== 'QUESTION' || !gameState || !gameState.currentQuestion) return null;
    const { categoryIndex, questionIndex } = gameState.currentQuestion;
    const currentQuestion = gameState.board[categoryIndex].questions[questionIndex];
    const activePlayer = gameState.players[gameState.turnIndex];
    const minScore = Math.min(...gameState.players.map(p => p.score));
    const isUnderdog = activePlayer.score === minScore;
    return createPortal(
      <QuestionModal
        question={{
          value: currentQuestion.value,
          question: currentQuestion.question,
          answer: currentQuestion.answer,
          status: currentQuestion.status,
          searchTerm: currentQuestion.searchTerm,
          searchTermAudio: currentQuestion.searchTermAudio
        }}
        categoryName={gameState.board[categoryIndex].category}
        activePlayer={activePlayer}
        isUnderdog={isUnderdog}
        scoringMode={gameState.scoringMode}
        timeLimit={gameState.settings?.timeLimit ?? 0}
        onCorrect={() => {
          const multiplier = isUnderdog ? 1.5 : 1;
          updateScoreAndStatus(categoryIndex, questionIndex, currentQuestion.value * multiplier);
        }}
        onWrong={() => {
          const penalty = gameState.scoringMode === 'normal' ? currentQuestion.value : currentQuestion.value * 0.75;
          updateScoreAndStatus(categoryIndex, questionIndex, -penalty);
        }}
        onPass={() => {
          const penalty = gameState.scoringMode === 'normal' ? currentQuestion.value * 0.5 : currentQuestion.value * 0.375;
          updateScoreAndStatus(categoryIndex, questionIndex, -penalty);
        }}
        onClose={() => {
          const gs = gameStateRef.current;
          if (!gs) return;
          setGameState({ ...gs, currentQuestion: null });
          navigateTo('GAME');
        }}
      />,
      document.body
    );
  };

  const renderScreen = () => {
    // Logic Wiring: Fullscreen loading state using existing aesthetics
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-pulse bg-surface-container-lowest">
          <div className="w-16 h-1 bg-tertiary-container shadow-[0_0_15px_rgba(254,0,0,0.5)]"></div>
          <h2 className="font-display text-4xl md:text-6xl text-tertiary-container uppercase tracking-tighter text-center animate-blink-cursor">
            GENERATING BOARD...
          </h2>
          <div className="w-16 h-1 bg-tertiary-container shadow-[0_0_15px_rgba(254,0,0,0.5)]"></div>
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
        return <Setup onStart={handleStart} onOpenSettings={() => setSettingsOpen(true)} currentSettings={settings} />;
      case 'GAME':
        if (!gameState) return <Setup onStart={handleStart} currentSettings={settings} />;
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
            onEndGame={() => navigateTo('END')}
          />
        );
      case 'QUESTION':
        // Modal is rendered via portal at the App root — return the board underneath
        if (!gameState) return <Setup onStart={handleStart} currentSettings={settings} />;
        return (
          <GameBoard
            game={gameState}
            onSelectQuestion={(categoryIndex, questionIndex) => {
              setGameState({ ...gameState, currentQuestion: { categoryIndex, questionIndex } });
              navigateTo('QUESTION');
            }}
            onEndGame={() => navigateTo('END')}
          />
        );
      case 'END':
        if (!gameState) return <Setup onStart={handleStart} currentSettings={settings} />;
        return <EndScreen players={gameState.players} onRestart={() => {
          setGameState(null);
          setLoadingError(null);
          setIsLoading(false);
          navigateTo('SETUP');
        }} />;
      default:
        return <div>Error loading game state.</div>;
    }
  };

  return (
    <>
      <div className="h-screen w-full flex flex-col bg-surface-container-lowest text-on-surface overflow-hidden font-body">

        {/* Global Settings Modal */}
        <AnimatePresence>
          {settingsOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSettingsOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                className="relative bg-[#0D0D0D] border-t-2 border-tertiary-container w-full max-w-lg p-8 flex flex-col gap-8 shadow-[0_0_50px_rgba(254,0,0,0.2)]"
              >
                <div className="absolute top-0 left-0 w-16 h-0.5 bg-tertiary-container shadow-[0_0_10px_rgba(254,0,0,0.5)]"></div>
                <div className="absolute bottom-0 right-0 w-24 h-0.5 bg-tertiary-container shadow-[0_0_10px_rgba(254,0,0,0.5)]"></div>

                <h2 className="font-display font-bold text-3xl tracking-tight text-white uppercase">SETTINGS_STREAM</h2>

                <div className="flex flex-col gap-3">
                  <span className="text-[0.65rem] font-display font-bold uppercase tracking-[0.2em] text-[#666666]">Difficulty</span>
                  <div className="flex gap-2">
                    <OptionButton label="EASY" sub="Common knowledge" selected={pendingSettings.difficulty === 'easy'} onClick={() => setPendingSettings(s => ({ ...s, difficulty: 'easy' }))} />
                    <OptionButton label="MEDIUM" sub="Topic expertise" selected={pendingSettings.difficulty === 'medium'} onClick={() => setPendingSettings(s => ({ ...s, difficulty: 'medium' }))} />
                    <OptionButton label="HARD" sub="Expert level" selected={pendingSettings.difficulty === 'hard'} onClick={() => setPendingSettings(s => ({ ...s, difficulty: 'hard' }))} />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[0.65rem] font-display font-bold uppercase tracking-[0.2em] text-[#666666]">Time Limit</span>
                  <div className="flex gap-2">
                    <OptionButton label="30S" selected={pendingSettings.timeLimit === 30} onClick={() => setPendingSettings(s => ({ ...s, timeLimit: 30 }))} />
                    <OptionButton label="60S" selected={pendingSettings.timeLimit === 60} onClick={() => setPendingSettings(s => ({ ...s, timeLimit: 60 }))} />
                    <OptionButton label="UNLIMITED" selected={pendingSettings.timeLimit === 0} onClick={() => setPendingSettings(s => ({ ...s, timeLimit: 0 }))} />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[0.65rem] font-display font-bold uppercase tracking-[0.2em] text-[#666666]">Questions Per Category</span>
                  <div className="flex gap-2">
                    <OptionButton label="3" selected={pendingSettings.questionsPerCategory === 3} onClick={() => setPendingSettings(s => ({ ...s, questionsPerCategory: 3 }))} />
                    <OptionButton label="5" selected={pendingSettings.questionsPerCategory === 5} onClick={() => setPendingSettings(s => ({ ...s, questionsPerCategory: 5 }))} />
                    <OptionButton label="7" selected={pendingSettings.questionsPerCategory === 7} onClick={() => setPendingSettings(s => ({ ...s, questionsPerCategory: 7 }))} />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[0.65rem] font-display font-bold uppercase tracking-[0.2em] text-[#666666]">Scoring Mode</span>
                  <div className="flex gap-2">
                    <OptionButton label="STANDARD" sub="Scores persist" selected={pendingSettings.scoringMode === 'normal'} onClick={() => setPendingSettings(s => ({ ...s, scoringMode: 'normal' }))} />
                    <OptionButton label="ADVANCED" sub="Permanent death" selected={pendingSettings.scoringMode === 'advanced'} onClick={() => setPendingSettings(s => ({ ...s, scoringMode: 'advanced' }))} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="flex-none px-6 py-4 border border-[#333333] text-white/40 font-display font-bold text-sm tracking-widest uppercase hover:border-white/30 transition-colors"
                  >
                    ABORT
                  </button>
                  <button
                    onClick={() => { setSettings(pendingSettings); setSettingsOpen(false); }}
                    className="flex-1 bg-tertiary-container text-black font-display font-bold text-sm tracking-widest uppercase py-4 hover:bg-white transition-colors [clip-path:polygon(0_0,100%_0,95%_100%,0%_100%)]"
                  >
                    SAVE_CONFIG
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Top Navbar */}
        <motion.nav
          animate={{ y: navVisible ? 0 : -100 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="w-full bg-[#0e0e0e] fixed top-0 z-50 border-b-4 border-tertiary-container shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        >
          <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 gap-4">
            {/* Left Section: Logo + Tabs */}
            <div className="flex items-center gap-12">
              <div
                onClick={() => navigateTo('SETUP')}
                className="h-10 cursor-pointer hover:animate-glitch transition-all group pr-8 border-r border-[#1a1a1a]"
              >
                <Logo className="h-full w-auto text-white group-hover:text-tertiary-container transition-colors origin-left scale-x-[1.1]" />
              </div>
            <div className="flex items-center bg-[#131313] p-1 gap-1 overflow-hidden">
                {[
                  { id: 'GAME', label: 'BOARD', icon: 'grid_view', screens: ['GAME', 'QUESTION'] },
                  { id: 'SETUP', label: 'PLAYERS', icon: 'groups', screens: ['SETUP'] },
                  { id: 'END', label: currentScreen === 'END' ? 'RESULTS' : 'RULES', icon: 'gavel', screens: ['END'] },
                ].map((tab) => {
                  const isActive = tab.screens.includes(currentScreen);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigateTo(tab.id as Screen)}
                      className="relative px-6 py-2 font-sans font-black uppercase tracking-[0.1em] text-[10px] flex items-center gap-2 transition-all group"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-selection"
                          className="absolute inset-0 bg-tertiary-container nav-clip z-0"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className={`relative z-10 flex items-center gap-2 transition-colors ${isActive ? 'text-black' : 'text-white group-hover:text-white/80'}`}>
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-[#1a1a1a] mx-2 hidden md:block"></div>
              <div className="flex items-center gap-4">
                <button className="text-tertiary-container hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-xl">leaderboard</span>
                </button>
                <button
                  onClick={() => { setPendingSettings(settings); setSettingsOpen(true); }}
                  className="text-tertiary-container hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">settings</span>
                </button>
                <button
                  onClick={() => { setGameState(null); navigateTo('SETUP'); }}
                  className="bg-tertiary-container text-black px-6 py-2 font-sans font-black text-[10px] uppercase hover:bg-white transition-all btn-riot"
                >
                  NEW GAME
                </button>
              </div>
            </div>
          </div>
        </motion.nav>



        {/* Main Body — Sidebar Removed */}
        <div className="flex-1 overflow-hidden flex relative">

          {/* Scrollable Main Area (Where Setup Lives) */}
          <main id="main-scroll-area" className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-[#0A0A0A] relative flex flex-col pt-20">
            <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-4 lg:pt-8 flex-1 flex flex-col">

              {/* Inject Active Screen Component */}
              <AnimatePresence mode="wait">
                <div key={currentScreen} className="flex-1 flex flex-col">
                  {renderScreen()}
                </div>
              </AnimatePresence>
            </div>

            {/* Global Footer (Deconstructed & Minimally Integrated) */}
            <footer className="mt-20 w-full bg-transparent">
              <div className="w-full px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-8">
                {/* Left: Identity & Status */}
                <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse shadow-[0_0_8px_rgba(254,0,0,0.6)]"></div>
                    <span className="text-[9px] font-display font-bold tracking-[0.2em] uppercase text-[#444444]">SYS_OP: ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/20 font-display text-sm tracking-tighter uppercase italic">Jeparty_OS</span>
                    <div className="w-1 h-1 rounded-full bg-[#222222]"></div>
                    <span className="text-[10px] font-body font-bold tracking-[0.1em] uppercase text-tertiary-container/60">
                      BY YASH KAUL
                    </span>
                  </div>
                </div>

                {/* Center: Interactive Visualizer (Slimmer) */}
                <div className="hidden lg:flex flex-col items-center gap-2 group">
                  <FooterVisualizer />
                  <div className="text-[7px] font-display font-bold tracking-[0.4em] text-[#222222] group-hover:text-tertiary-container/30 transition-colors uppercase">Stream_Active</div>
                </div>

                {/* Right: Socials */}
                <div className="flex flex-col gap-3 items-center md:items-end">
                  <div className="flex gap-8 text-[10px] font-display font-black tracking-[0.1em] uppercase">
                    <a href="#" className="text-white/40 hover:text-white transition-all">GIT</a>
                    <a href="#" className="text-white/40 hover:text-white transition-all">LNK</a>
                    <a href="#" className="text-white/40 hover:text-white transition-all">X_SO</a>
                  </div>
                  <div className="text-[8px] font-body tracking-[0.4em] text-[#222222] uppercase">
                    ©2026_ANRCHY
                  </div>
                </div>
              </div>
            </footer>
          </main>

        </div>
      </div>

      {/* Bug 1: QuestionModal as a React Portal — renders above ALL layout including sidebar/header */}
      {renderQuestionPortal()}
    </>
  );
}

export default App;

