import { useState, useEffect } from 'react';
import Setup from './screens/Setup/Setup';
import GameBoard from './screens/GameBoard/GameBoard';
import QuestionModal from './screens/QuestionModal/QuestionModal';
import EndScreen from './screens/EndScreen/EndScreen';
import { generateBoard } from './services/aiService';
import { prefetchBoardImages } from './services/imageService';
import { Game, GameSettings } from './types/game';

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  timeLimit: 60,
  questionsPerCategory: 5,
  scoringMode: 'normal',
};

function OptionButton({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 text-left border transition-colors ${
        selected
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
  if (gameState) console.debug("GAME_STREAM_INITIALIZED:", gameState.players.length, "players active");

  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Settings state — lives in App so cog button can open it from anywhere
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

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
      navigateTo('GAME');
    } catch (error) {
      setLoadingError(error instanceof Error ? error.message : 'System initialization failed.');
    } finally {
      setIsLoading(false);
    }
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
        return <Setup onStart={handleStart} currentSettings={settings} />;
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
        if (!gameState) return <Setup onStart={handleStart} currentSettings={settings} />;
        if (!gameState.currentQuestion) { navigateTo('GAME'); return null; }
        
        const { categoryIndex, questionIndex } = gameState.currentQuestion;
        const currentQuestion = gameState.board[categoryIndex].questions[questionIndex];
        const activePlayer = gameState.players[gameState.turnIndex];
        
        // Wire underdog boost: all players tied at the minimum score get the 1.5x multiplier
        const minScore = Math.min(...gameState.players.map(p => p.score));
        const isUnderdog = activePlayer.score === minScore;

        const updateScoreAndStatus = (scoreDelta: number) => {
          const newPlayers = [...gameState.players];
          newPlayers[gameState.turnIndex].score += scoreDelta;

          const newBoard = [...gameState.board];
          newBoard[categoryIndex].questions[questionIndex].status = 'answered';

          setGameState({
            ...gameState,
            players: newPlayers,
            board: newBoard,
            currentQuestion: null,
            turnIndex: (gameState.turnIndex + 1) % gameState.players.length
          });
          navigateTo('GAME');
        };

        return (
          <QuestionModal
            question={{
              value: currentQuestion.value,
              question: currentQuestion.question,
              answer: currentQuestion.answer,
              status: currentQuestion.status,
              searchTerm: currentQuestion.searchTerm
            }}
            categoryName={gameState.board[categoryIndex].category}
            activePlayer={activePlayer}
            isUnderdog={isUnderdog}
            scoringMode={gameState.scoringMode}
            timeLimit={gameState.settings?.timeLimit ?? 0}
            onCorrect={() => {
              const multiplier = isUnderdog ? 1.5 : 1;
              updateScoreAndStatus(currentQuestion.value * multiplier);
            }}
            onWrong={() => {
              const penalty = gameState.scoringMode === 'normal' ? currentQuestion.value : currentQuestion.value * 0.75;
              updateScoreAndStatus(-penalty);
            }}
            onPass={() => {
              const penalty = gameState.scoringMode === 'normal' ? currentQuestion.value * 0.5 : currentQuestion.value * 0.375;
              updateScoreAndStatus(-penalty);
            }}
            onClose={() => {
              setGameState({ ...gameState, currentQuestion: null });
              navigateTo('GAME');
            }}
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
    <div className="h-screen w-full flex flex-col bg-surface-container-lowest text-on-surface overflow-hidden font-body">

      {/* Global Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0D0D0D] border-t-2 border-tertiary-container w-full max-w-lg relative p-8 flex flex-col gap-8">
            <div className="absolute top-0 left-0 w-16 h-0.5 bg-tertiary-container shadow-[0_0_10px_rgba(254,0,0,0.5)]"></div>
            <div className="absolute bottom-0 right-0 w-24 h-0.5 bg-tertiary-container shadow-[0_0_10px_rgba(254,0,0,0.5)]"></div>

            <h2 className="font-display font-bold text-3xl tracking-tight text-white uppercase">SETTINGS</h2>

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
                CANCEL
              </button>
              <button
                onClick={() => { setSettings(pendingSettings); setSettingsOpen(false); }}
                className="flex-1 bg-tertiary-container text-on-tertiary-container font-display font-bold text-sm tracking-widest uppercase py-4 hover:bg-white hover:text-black transition-colors [clip-path:polygon(0_0,100%_0,95%_100%,0%_100%)]"
              >
                SAVE SETTINGS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="h-20 shrink-0 border-b-2 border-tertiary-container flex items-center justify-between px-6 z-20 bg-surface-container-lowest relative">
        <div className="text-tertiary-container font-display font-bold text-3xl italic tracking-tighter uppercase">
          JEPARTY
        </div>

        {/* Center Nav */}
        <nav className="hidden lg:flex items-center gap-12 font-bold text-xs tracking-[0.2em] text-tertiary-container transition-all">
          <button className="hover:text-white transition-colors">ARENA</button>
          <button className="hover:text-white transition-colors">STAKES</button>
          <button className="hover:text-white transition-colors">LEGENDS</button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-6 text-tertiary-container">
          <button className="hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M3 3v18h18M9 9l3 3 3-3 6 6" /></svg>
          </button>
          <button
            onClick={() => { setPendingSettings(settings); setSettingsOpen(true); }}
            className="hover:text-white transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="square" strokeLinejoin="miter" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button
            onClick={() => { setGameState(null); navigateTo('SETUP'); }}
            className="bg-tertiary-container text-on-tertiary-container font-display font-bold text-xs px-6 py-2 uppercase tracking-tight hover:bg-white hover:text-black transition-colors ml-4 [clip-path:polygon(0_0,100%_0,95%_100%,0%_100%)]">
            NEW GAME
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-hidden flex relative">

        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 bg-surface-container-lowest border-r-2 border-tertiary-container flex flex-col justify-between hidden md:flex z-10">
          <div className="flex flex-col">
            <div className="px-6 py-8 border-b border-[#1A1A1A] flex flex-col gap-1">
              <span className="text-tertiary-container font-display font-bold text-xl tracking-wider">HOST_01</span>
              <span className="text-[#666666] text-xs font-bold tracking-[0.2em] uppercase">PHASE: {currentScreen}</span>
            </div>

            <nav className="flex flex-col py-6 gap-2">
              <button
                onClick={() => navigateTo('GAME')}
                className="flex items-center gap-4 px-6 py-4 text-white hover:text-tertiary hover:bg-[#1A1A1A] transition-colors text-left uppercase font-display font-bold text-sm tracking-widest">
                <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                BOARD
              </button>

              <button
                onClick={() => navigateTo('SETUP')}
                className={`flex items-center gap-4 px-6 py-4 transition-colors text-left uppercase font-display font-bold text-sm tracking-widest ${currentScreen === 'SETUP' ? 'bg-tertiary-container text-on-tertiary-container shadow-[inset_4px_0_0_rgba(255,255,255,1)]' : 'text-white hover:bg-[#1A1A1A]'}`}>
                <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                PLAYERS
              </button>

              <button className="flex items-center gap-4 px-6 py-4 text-white hover:text-tertiary hover:bg-[#1A1A1A] transition-colors text-left uppercase font-display font-bold text-sm tracking-widest">
                <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                RULES
              </button>

              <button className="flex items-center gap-4 px-6 py-4 text-white hover:text-tertiary hover:bg-[#1A1A1A] transition-colors text-left uppercase font-display font-bold text-sm tracking-widest">
                <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                EXIT
              </button>
            </nav>
          </div>

          <div className="p-6">
            <button
              onClick={() => { setGameState(null); navigateTo('SETUP'); }}
              className="w-full bg-error hover:bg-white text-black font-display font-bold text-sm tracking-widest uppercase py-4 transition-colors">
              TERMINATE
            </button>
          </div>
        </aside>

        {/* Scrollable Main Area (Where Setup Lives) */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-[#0A0A0A] relative flex flex-col">
          <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 lg:pt-20 flex-1 flex flex-col">

            {/* Inject Active Screen Component */}
            {renderScreen()}

            {/* Global Footer (Visible underneath screens) */}
            <footer className="mt-8 mb-4 border-t-4 border-tertiary-container pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-8">
              <span className="text-surface-bright font-display font-bold text-4xl tracking-tight opacity-70">
                JEPARTY_SYSTEM_V.4.02
              </span>
              <div className="flex gap-4 md:gap-8 flex-wrap">
                <span className="text-[#666666] text-xs font-bold tracking-[0.2em]">ENCRYPTED</span>
                <span className="text-[#666666] text-xs font-bold tracking-[0.2em]">LOW_LATENCY</span>
                <span className="text-[#666666] text-xs font-bold tracking-[0.2em]">MAX_ENERGY</span>
              </div>
            </footer>
          </div>
        </main>

      </div>
    </div>
  );
}

export default App;

