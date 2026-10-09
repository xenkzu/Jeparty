import React from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import Title from '../../components/ui/Title';

import { motion } from 'framer-motion';

interface RulesScreenProps {
}

// Replicate Tech Elements from Setup
const CyberpunkBackground = () => {
  const dots = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 2 + Math.random() * 3,
  }));

  const scanLines = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    top: 20 + i * 30,
    duration: 10 + i * 5,
    delay: i * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
      {dots.map(dot => (
        <motion.div
          key={dot.id}
          className="absolute w-px h-px bg-tertiary-container rounded-full"
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: dot.duration, repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
        />
      ))}
      {scanLines.map(line => (
        <motion.div
          key={line.id}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${line.top}%`,
            background: 'linear-gradient(to right, transparent, var(--color-tertiary-container) 30%, var(--color-tertiary-container) 70%, transparent)',
            opacity: 0.2,
          }}
          animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1, 0.3] }}
          transition={{ duration: line.duration, repeat: Infinity, delay: line.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

const TechBracket = ({ className, position }: { className?: string; position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const rotation = { tl: '0deg', tr: '90deg', br: '180deg', bl: '270deg' }[position];
  return (
    <div className={`absolute w-6 h-6 ${className}`} style={{ transform: `rotate(${rotation})` }}>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-tertiary-container/40" />
      <div className="absolute top-0 left-0 w-[1px] h-full bg-tertiary-container/40" />
    </div>
  );
};

const RulesScreen: React.FC<RulesScreenProps> = () => {
  return (
    <PageTransition>
      <div 
        className="font-body selection:bg-tertiary-container selection:text-on-tertiary-container min-h-screen transition-colors duration-300"
        style={{ 
          backgroundColor: 'var(--rules-bg-color, #000000)',
          color: 'var(--on-surface, #FFFFFF)',
          fontSize: 'var(--rules-body-size, 14px)',
          lineHeight: 'var(--rules-body-line-height, 1.4)',
          letterSpacing: 'var(--rules-letter-spacing, -0.05em)',
          transitionDuration: 'var(--rules-transition-speed, 300ms)'
        } as any}
      >
        <CyberpunkBackground />
        
        {/* CRT Scanline Effect */}
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.03]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        </div>


        <main 
          className="w-full pb-24 mx-auto" 
          style={{ 
            maxWidth: 'var(--rules-content-max-width, 2500px)',
            paddingLeft: 'var(--rules-side-padding, 0px)',
            paddingRight: 'var(--rules-side-padding, 0px)',
          }}
        >
          {/* Hero Section */}
          <section 
            className="flex flex-col md:flex-row md:items-end gap-8 relative"
            style={{ 
              paddingTop: 'var(--rules-hero-top-padding, 6px)',
              paddingBottom: 'var(--rules-section-gap, 58px)'
            }}
          >
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Title 
                as="h1" 
                className="text-tertiary-container leading-[0.85] text-[4rem] md:text-[6rem] tracking-tighter animate-glitch mt-[-8px]"
              >
                GAMEPLAY<br />RULES
              </Title>
            </div>
            <div className="absolute top-0 right-0 p-4 border-l border-white/10 max-w-lg text-right">
              <p className="text-[0.65rem] font-bold tracking-[0.2em] text-[#666666] uppercase leading-relaxed opacity-60">
                Jeparty is a host-controlled trivia game. The host manages scores and reveals questions from their device while players compete to answer.
              </p>
            </div>
          </section>

          {/* Bento Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-12" style={{ gap: 'var(--rules-section-gap, 58px)' }}>
            
            {/* Section 1: Setup */}
            <div 
              className="md:col-span-7 p-10 flex flex-col gap-6 relative overflow-hidden group transition-all"
              style={{ 
                backgroundColor: 'var(--rules-surface-color, #111111)',
                '--hover-translate': 'var(--rules-hover-lift, -4px)'
              } as any}
            >
              <TechBracket position="tl" className="top-2 left-2" />
              <TechBracket position="tr" className="top-2 right-2" />
              <div className="absolute top-4 left-10 font-mono text-[8px] text-tertiary-container/30 tracking-[0.4em] animate-pulse">ARENA_INIT_01</div>
              <h2 className="font-display font-bold text-4xl uppercase tracking-tighter" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>01 // SETUP</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold uppercase text-xs tracking-widest mb-2" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>CAPACITY</h3>
                  <p className="text-2xl font-body font-bold">2-8 PLAYERS</p>
                  <p className="text-white/60 mt-2 leading-relaxed">Optimal engagement achieved with 4+ players. Supports team-based tactical play.</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase text-xs tracking-widest mb-2" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>GAME BOARD</h3>
                  <p className="text-2xl font-body font-bold">5 CATEGORIES</p>
                  <p className="text-white/60 mt-2 leading-relaxed">The board has 5 categories, each with questions ranging from 100 to 700 points.</p>
                </div>
              </div>
              <div className="mt-4 p-6 border-t-2 bg-white/5" style={{ borderColor: 'var(--rules-accent-color, #fe0000)' }}>
                <p className="font-body text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--primary, #FFFFFF)' }}>Special Categories</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-black px-2 py-0.5" style={{ backgroundColor: 'var(--rules-accent-color, #fe0000)', color: 'var(--color-on-tertiary-container, #000000)' }}>-V</span>
                    <span className="text-xs uppercase">IMAGE QUESTION</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black px-2 py-0.5" style={{ backgroundColor: 'var(--rules-accent-color, #fe0000)', color: 'var(--color-on-tertiary-container, #000000)' }}>-A</span>
                    <span className="text-xs uppercase">AUDIO QUESTION</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 overflow-hidden border border-white/5 bg-white/5 rounded">
                <table className="w-full text-[10px] uppercase tracking-wider text-white/40">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="p-2 text-left">GAME SETTING</th>
                      <th className="p-2 text-left">OPTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-white/5">
                      <td className="p-2">THEME</td>
                      <td className="p-2">CYBER_RED / EDGERUNNERS</td>
                    </tr>
                    <tr className="border-t border-white/5">
                      <td className="p-2">DIFFICULTY</td>
                      <td className="p-2">EASY / MEDIUM / HARD</td>
                    </tr>
                    <tr className="border-t border-white/5">
                      <td className="p-2">TIME LIMIT</td>
                      <td className="p-2">30S / 60S / UNLIMITED</td>
                    </tr>
                    <tr className="border-t border-white/5">
                      <td className="p-2">SCORING MODE</td>
                      <td className="p-2">STANDARD / ADVANCED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: The Board */}
            <div 
              className="md:col-span-5 p-10 flex flex-col justify-between transition-all"
              style={{ backgroundColor: 'var(--rules-accent-color, #fe0000)', color: 'var(--color-on-tertiary-container, #000000)' }}
            >
              <TechBracket position="bl" className="bottom-2 left-2" />
              <TechBracket position="br" className="bottom-2 right-2" />
              <div>
                <h2 className="font-display font-black text-4xl uppercase tracking-tighter mb-4">02 // THE BOARD</h2>
                <p className="font-medium leading-snug">A 5xN grid of questions. Once a category and value are chosen, the question is shown and the game follows passing rules if needed.</p>
              </div>
              <div className="grid grid-cols-5 gap-1 mt-8 h-32 opacity-80">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-black/20" style={{ opacity: 0.1 + (i * 0.1) }}></div>
                ))}
              </div>
            </div>

            {/* Section 3: Standard Scoring */}
            <div 
              className="md:col-span-12 p-10 flex flex-col md:flex-row gap-12 items-center"
              style={{ backgroundColor: 'var(--rules-surface-color, #111111)' }}
            >
              <div className="md:w-1/3 relative">
                <TechBracket position="bl" className="bottom-0 left-0" />
                <h2 className="font-display font-bold text-5xl uppercase tracking-tighter leading-none" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>03 // SCORING RULES</h2>
              </div>
              <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4 items-start">
                  <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>add_circle</span>
                  <div>
                    <p className="font-body font-bold text-xl uppercase">CORRECT ANSWER</p>
                    <p className="text-white/60">+100% of the question value. The current player keeps control of the board.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="material-symbols-outlined text-error text-4xl">do_not_disturb_on</span>
                  <div>
                    <p className="font-body font-bold text-xl uppercase">WRONG ANSWER</p>
                    <p className="text-white/60">-100% of the question value. The player cannot answer again for this turn.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="material-symbols-outlined text-white text-4xl">forward</span>
                  <div>
                    <p className="font-body font-bold text-xl uppercase">SKIP QUESTION</p>
                    <p className="text-white/60">-50% of the value. The question then passes to the next players.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--primary, #FFFFFF)' }}>trending_up</span>
                  <div>
                    <p className="font-body font-bold text-xl uppercase">UNDERDOG BOOST</p>
                    <p className="text-white/60">If you are tied for the lowest score, your correct answers get a 1.5x Multiplier. (Correct answers only).</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start col-span-2 p-4 bg-white/5 rounded border-l-2 border-white/20">
                  <div>
                    <p className="font-body font-bold text-xs uppercase tracking-widest opacity-60">ADVANCED MODE SCORING</p>
                    <p className="text-white/40 text-[11px] mt-1">Wrong Answer: -75% | First Skip: -37.5%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Skip Chain */}
            <div 
              className="md:col-span-6 p-10 relative overflow-hidden group"
              style={{ backgroundColor: 'var(--rules-surface-color, #111111)' }}
            >
              <TechBracket position="tl" className="top-2 left-2" />
              <div className="flex flex-col gap-6 relative z-10">
                <h2 className="font-display font-bold text-4xl uppercase tracking-tighter" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>04 // PASSING RULES</h2>
                <p className="text-white/80 leading-relaxed">If the first player gets it wrong or skips, the question passes to each remaining player in order. After the passing is done, the turn moves to the person after the one who first skipped.</p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2" style={{ backgroundColor: 'var(--rules-accent-color, #fe0000)' }}></div>
                    <span className="font-bold uppercase tracking-widest">NEXT PLAYER CORRECT: +50% VALUE</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-error"></div>
                    <span className="font-bold uppercase tracking-widest">NEXT PLAYER WRONG: -50% VALUE</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 text-white/40 border border-white/20"></div>
                    <span className="font-bold uppercase tracking-widest">NEXT PLAYER SKIP: NO PENALTY</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-white/5 rounded border border-white/10">
                   <p className="text-[11px] uppercase tracking-widest opacity-60 font-bold mb-1">FULL CIRCLE RULE</p>
                   <p className="text-[11px] text-white/40">If a question passes through everyone and returns to the original person, it is revealed with no one scoring.</p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-5">
                <span className="material-symbols-outlined text-[300px]">hub</span>
              </div>
            </div>

            {/* Section 5: Host Controls */}
            <div 
              className="md:col-span-6 p-0 overflow-hidden flex flex-col"
              style={{ backgroundColor: 'var(--rules-surface-color, #111111)' }}
            >
              <div className="p-10 bg-white/5">
                <h2 className="font-display font-bold text-4xl uppercase tracking-tighter" style={{ color: 'var(--primary, #FFFFFF)' }}>05 // HOST CONTROLS</h2>
              </div>
              <div className="flex-grow p-6">
                <table className="w-full text-left font-body uppercase tracking-wider">
                  <thead className="border-b border-white/10" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>
                    <tr>
                      <th className="py-4 font-black">COMMAND</th>
                      <th className="py-4 font-black">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60 divide-y divide-white/5">
                    <tr>
                      <td className="py-3 font-bold" style={{ color: 'var(--primary, #FFFFFF)' }}>CORRECT</td>
                      <td className="py-3 italic">Give points to the active player</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold" style={{ color: 'var(--primary, #FFFFFF)' }}>WRONG</td>
                      <td className="py-3 italic">Remove points and lock player</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold" style={{ color: 'var(--primary, #FFFFFF)' }}>SKIP</td>
                      <td className="py-3 italic">Pass question to the next player</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold" style={{ color: 'var(--primary, #FFFFFF)' }}>REVEAL</td>
                      <td className="py-3 italic">Show the answer to everyone</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-error">TERMINATE</td>
                      <td className="py-3 italic">End the current game session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 6: Persistence & AI */}
            <div 
              className="md:col-span-12 p-10 flex flex-col md:flex-row gap-12"
              style={{ backgroundColor: 'var(--rules-surface-color, #111111)' }}
            >
              <div className="md:w-1/2">
                <h2 className="font-display font-bold text-4xl uppercase tracking-tighter mb-4" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>06 // AUTO-SAVE & AI</h2>
                <div className="space-y-4">
                  <div>
                    <p className="font-bold uppercase text-xs tracking-widest opacity-60">SESSION PERSISTENCE</p>
                    <p className="text-white/40 mt-1">Games are automatically saved to your browser. If you refresh, the board and scores are restored instantly.</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-xs tracking-widest opacity-60">AI TOPIC MEMORY</p>
                    <p className="text-white/40 mt-1">The system remembers the last 5 games and avoids repeating questions from those topics.</p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 border-l border-white/10 pl-12 flex items-center">
                <div className="p-6 bg-white/5 rounded-lg w-full flex items-center gap-6">
                  <span className="material-symbols-outlined text-5xl opacity-20">cloud_done</span>
                  <p className="text-[11px] leading-relaxed italic opacity-40">SYSTEM STATUS: ALL OPERATIONS PERSISTED TO LOCAL STORAGE REPOSITORY. AI NEURAL LINK ESTABLISHED.</p>
                </div>
              </div>
            </div>

            {/* Section 7: Quick Summary */}
            <div 
              className="md:col-span-12 p-12 flex flex-col items-center gap-10 border-t-4" 
              style={{ 
                backgroundColor: '#111111',
                borderColor: 'var(--rules-accent-color, #fe0000)',
                color: 'white'
              }}
            >
              <h2 className="font-display font-bold text-3xl uppercase tracking-tighter" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>QUICK SUMMARY</h2>
              <div className="flex flex-wrap justify-center gap-12 md:gap-24">
                <div className="flex flex-col items-center">
                  <span className="font-body font-black text-5xl tracking-tighter">+100%</span>
                  <span className="font-body font-bold uppercase text-[10px] tracking-[0.3em] opacity-40 mt-1">CORRECT</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-body font-black text-5xl tracking-tighter" style={{ color: 'var(--rules-accent-color, #fe0000)' }}>-100%</span>
                  <span className="font-body font-bold uppercase text-[10px] tracking-[0.3em] opacity-40 mt-1">WRONG</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-body font-black text-5xl tracking-tighter">-50%</span>
                  <span className="font-body font-bold uppercase text-[10px] tracking-[0.3em] opacity-40 mt-1">PASS</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-body font-black text-5xl tracking-tighter">+50%</span>
                  <span className="font-body font-bold uppercase text-[10px] tracking-[0.3em] opacity-40 mt-1">CHAIN_WIN</span>
                </div>
              </div>
            </div>

          </div>



        </main>


      </div>
    </PageTransition>
  );
};

export default RulesScreen;
