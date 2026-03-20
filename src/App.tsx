import { useState } from 'react';
import Setup from './screens/Setup/Setup';
import GameBoard from './screens/GameBoard/GameBoard';
import QuestionModal from './screens/QuestionModal/QuestionModal';
import EndScreen from './screens/EndScreen/EndScreen';

type Screen = 'SETUP' | 'GAME' | 'QUESTION' | 'END';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('SETUP');
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);

  const navigateTo = (screen: Screen) => {
    setPrevScreen(currentScreen);
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SETUP':
        return <Setup onStart={() => navigateTo('GAME')} />;
      case 'GAME':
        return (
          <GameBoard 
            onQuestionSelect={() => navigateTo('QUESTION')} 
            onEndGame={() => navigateTo('END')} 
          />
        );
      case 'QUESTION':
        return (
          <QuestionModal 
            onClose={() => navigateTo(prevScreen || 'GAME')} 
            onAnswerCorrect={() => navigateTo('GAME')}
            onAnswerIncorrect={() => navigateTo('GAME')}
          />
        );
      case 'END':
        return <EndScreen onRestart={() => navigateTo('SETUP')} />;
      default:
        return <div>Error loading game state.</div>;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-surface-container-lowest text-on-surface overflow-hidden font-body">
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
          <button className="hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="square" strokeLinejoin="miter" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button className="bg-tertiary-container text-on-tertiary-container font-display font-bold text-xs px-6 py-2 uppercase tracking-tight hover:bg-white hover:text-black transition-colors ml-4 [clip-path:polygon(0_0,100%_0,95%_100%,0%_100%)]">
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
              <span className="text-[#666666] text-xs font-bold tracking-[0.2em] uppercase">PHASE: SETUP</span>
            </div>
            
            <nav className="flex flex-col py-6 gap-2">
              <button className="flex items-center gap-4 px-6 py-4 text-white hover:text-tertiary hover:bg-[#1A1A1A] transition-colors text-left uppercase font-display font-bold text-sm tracking-widest">
                <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                BOARD
              </button>
              
              <button className="flex items-center gap-4 px-6 py-4 bg-tertiary-container text-on-tertiary-container transition-colors text-left uppercase font-display font-bold text-sm tracking-widest shadow-[inset_4px_0_0_rgba(255,255,255,1)]">
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
            <button className="w-full bg-error hover:bg-white text-black font-display font-bold text-sm tracking-widest uppercase py-4 transition-colors">
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
