import React from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '../../components/ui/PageTransition';

const RulesScreen: React.FC = () => {
  const STYLES = {
    shard: { clipPath: 'polygon(0 0, 98% 0, 100% 20%, 100% 100%, 2% 100%, 0% 80%)' },
    ghostGrid: { backgroundImage: 'radial-gradient(circle, rgba(235,0,0,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }
  };

  const sections = [
    {
      title: "CORE_LOOP",
      subtitle: "SEQUENTIAL_OPERATIONS",
      rules: [
        { label: "INITIATION", desc: "Board control starts with the last successful player. They choose category & value." },
        { label: "SELECTION", desc: "Tile activation locks the board. Full-screen visual/audio focus initiated." },
        { label: "ANSWERING", desc: "Open protocol. Any player can buzz. Moderator validates via system portal." },
        { label: "RESOLUTION", desc: "CORRECT = +Value & Control. INCORRECT = -Value & Transition." },
        { label: "SKIPPING", desc: "Moderator reveal. 0pt delta. Control persists with active player." }
      ]
    },
    {
      title: "SCORING_MATRIX",
      subtitle: "CALIBRATION_LOGIC",
      rules: [
        { label: "POSITIVE_VALIDATION", desc: "User receives +100% of tile value. Score updated in real-time." },
        { label: "NEGATIVE_VALIDATION", desc: "User receives -100% of tile value. No partial deductions." }
      ]
    },
    {
      title: "SYSTEM_OVERRIDES",
      subtitle: "MODERATOR_TERMINAL",
      rules: [
        { label: "MANUAL_ADJUST", desc: "Direct override via [+] and [-] triggers in the question dashboard." },
        { label: "VISUAL_RELOAD", desc: "Cycle image assets if metadata is corrupt or unclear. Same answer." },
        { label: "AUDIO_REGEN", desc: "Full re-generation of question/answer pair if stream is dead." }
      ]
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen w-full bg-[#0A0A0A] flex flex-col lg:flex-row relative overflow-hidden font-body text-white">
        
        {/* Background Layer */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 opacity-20" style={STYLES.ghostGrid}></div>
          <div className="absolute -bottom-20 -right-20 text-[30vw] font-display font-black text-white/5 italic uppercase select-none leading-none tracking-tighter">
            RIOT
          </div>
        </div>

        {/* Left Metadata Gutter - Removed Width as requested (w-0) */}
        <div className="hidden lg:flex w-0 border-r border-white/10 flex-col justify-between py-12 items-center relative z-20 shrink-0 overflow-hidden" />

        {/* Main Content Area */}
        <main className="flex-1 relative z-10 flex flex-col">
          {/* Hero Header - Adjusted based on Debugger Values */}
          <header 
            className="pt-20 px-0 mb-24 max-w-[1726px]"
          >
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 
                className="text-tertiary-container font-display font-black leading-[0.85] tracking-tighter uppercase italic origin-left mb-8 animate-glitch whitespace-nowrap"
                style={{ 
                  fontSize: '5rem',
                  transform: 'scaleY(1.01)'
                }}
              >
                GAMEPLAY_RULES
              </h1>
              <div className="flex items-center gap-12 border-t border-white/10 pt-8">
                <div className="bg-[#1A1A1A] w-fit px-4 py-2 text-[0.65rem] font-bold tracking-[0.2em] text-[#666666] uppercase">
                  AUTH_VERIFIED // LOADING_GAME_RULES
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-500/70 font-mono text-[10px] tracking-[0.4em] uppercase">SYSTEM_STATE: STABLE</span>
                </div>
              </div>
            </motion.div>
          </header>

          {/* Section 01: Core Loop - Adjusted based on Debugger Values */}
          <section 
            className="px-0 mb-16 max-w-[1726px]"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {sections[0].rules.map((rule, idx) => (
                <motion.div 
                  key={rule.label}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex-1 bg-white/[0.03] p-8 border-l border-white/10 relative group hover:bg-white/5 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2 font-display font-black text-4xl text-white/5 group-hover:text-tertiary-container/10 transition-colors">0{idx + 1}</div>
                  <h3 className="text-tertiary-container font-display font-bold text-[10px] tracking-[0.3em] uppercase mb-4 relative z-10">{rule.label}</h3>
                  <p className="text-white/70 font-body text-xs leading-relaxed uppercase tracking-wide relative z-10">{rule.desc}</p>
                  <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-tertiary-container group-hover:w-full transition-all duration-500"></div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Section 02 & 03: Split Grid - Adjusted based on Debugger Values */}
          <div 
            className="px-0 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-[1726px]"
          >
            {/* Scoring Matrix */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              style={STYLES.shard}
              className="bg-tertiary-container text-black p-12 lg:p-16 relative overflow-hidden"
            >
              <div className="absolute top-[-20%] right-[-10%] text-[15rem] font-display font-black text-black/5 italic select-none">DATA</div>
              <div className="relative z-10">
                <h2 className="font-display font-black text-6xl italic tracking-tighter uppercase mb-4 leading-none">SCORING_MATRIX</h2>
                <span className="font-mono text-[11px] font-bold tracking-[0.5em] opacity-40 uppercase block mb-16">POINT_CALIBRATION_LOGIC</span>
                
                <div className="space-y-10">
                  {sections[1].rules.map(rule => (
                    <div key={rule.label} className="border-b border-black/10 pb-6 group cursor-default">
                      <span className="font-display font-bold text-[10px] tracking-widest uppercase block mb-2 opacity-60 group-hover:opacity-100 transition-opacity">{rule.label}</span>
                      <p className="font-display font-black text-2xl lg:text-3xl leading-tight uppercase italic transform group-hover:translate-x-2 transition-transform">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Moderator Terminal */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="border border-white/10 bg-white/[0.01] p-12 lg:p-16 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-white font-display font-black text-6xl italic tracking-tighter uppercase mb-4 leading-none">MOD_TERMINAL</h2>
                <span className="text-white/20 font-mono text-[11px] tracking-[0.5em] uppercase block mb-16">SYSTEM_OVERRIDES_PORTAL</span>

                <div className="space-y-12">
                  {sections[2].rules.map(rule => (
                    <div key={rule.label} className="group cursor-crosshair">
                      <div className="flex items-center gap-6 mb-3">
                        <div className="w-3 h-3 bg-white/10 group-hover:bg-tertiary-container group-hover:shadow-[0_0_10px_#EB0000] transition-all"></div>
                        <span className="text-white/40 group-hover:text-white font-display font-bold text-[10px] tracking-widest uppercase transition-colors">{rule.label}</span>
                      </div>
                      <p className="text-white/50 font-body text-[13px] leading-relaxed max-w-sm pl-9 border-l border-white/5 group-hover:border-tertiary-container/40 transition-all uppercase tracking-wider">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-20 pt-10 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-white/20 font-mono text-[9px] tracking-[0.5em]">AUTH_KEY_SEQUENCE:</span>
                  <span className="text-white/60 font-mono text-[10px] tracking-[0.2em]">0XEB_RIOT_PROT_V4_882</span>
                </div>
                <div className="px-6 py-2 bg-tertiary-container/10 border border-tertiary-container/20 text-tertiary-container text-[10px] font-black tracking-[0.4em] uppercase">
                  SECURITY_STATE: SECURED
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer CTA */}
          <footer className="mt-12 mb-32 flex flex-col items-center">
            <div className="w-px h-24 bg-gradient-to-b from-tertiary-container to-transparent mb-12"></div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group bg-white px-20 py-8 transform -skew-x-12"
            >
              <div className="absolute inset-0 bg-tertiary-container translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16, 1, 0.3, 1]"></div>
              <span className="relative z-10 text-black font-display font-black text-4xl lg:text-5xl italic tracking-tighter uppercase whitespace-nowrap">
                INITIALIZE_ARENA
              </span>
            </motion.button>
            <div className="mt-12 text-white/10 font-display font-black text-[10px] tracking-[1.5em] uppercase">
              TERMINUS_OS // [2026_RIOT_EDITION]
            </div>
          </footer>
        </main>
      </div>
    </PageTransition>
  );
};

export default RulesScreen;
