import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSettings } from '../../types/game';
import { PageTransition } from '../../components/ui/PageTransition';
import { AntiMetalButton } from '../../components/ui/anti-metal-button';
import { CyberForm } from '../../components/ui/CyberForm';

interface SetupProps {
  onStart: (players: string[], categories: string[], settings: GameSettings) => void;
  onOpenSettings?: () => void;
  currentSettings: GameSettings;
}

// --- Cyberpunk Micro Components ---

const Title = ({ as: Component = 'h1', children, className, style }: { as?: React.ElementType; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <Component style={style} className={`font-display font-black tracking-tighter uppercase ${className}`}>
    {children}
  </Component>
);

const TechBracket = ({ position, className }: { position: 'tl' | 'tr' | 'bl' | 'br'; className?: string }) => {
  const baseClasses = "absolute w-3.5 h-3.5 pointer-events-none transition-all duration-300";
  const posMap = {
    tl: "top-0 left-0 border-t-2 border-l-2 border-tertiary-container",
    tr: "top-0 right-0 border-t-2 border-r-2 border-tertiary-container",
    bl: "bottom-0 left-0 border-b-2 border-l-2 border-tertiary-container",
    br: "bottom-0 right-0 border-b-2 border-r-2 border-tertiary-container",
  };
  return <div className={`${baseClasses} ${posMap[position]} ${className}`} />;
};

const SignalTower = () => (
  <div className="flex items-end gap-1.5 h-7">
    <motion.div animate={{ height: ['20%', '80%', '40%'] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1.5 bg-tertiary-container/40" />
    <motion.div animate={{ height: ['40%', '100%', '60%'] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1.5 bg-tertiary-container" />
    <motion.div animate={{ height: ['80%', '30%', '90%'] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 bg-tertiary-container/70" />
    <motion.div animate={{ height: ['60%', '90%', '20%'] }} transition={{ duration: 1.0, repeat: Infinity }} className="w-1.5 bg-tertiary-container" />
  </div>
);

const DataReadout = () => (
  <div className="flex items-center gap-4 text-[0.7rem] font-mono text-tertiary-container tracking-widest uppercase">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-tertiary-container rounded-full animate-ping"></span>
      <span>STREAM_83.72</span>
    </div>
  </div>
);

// Clean pure black background (all grid lines removed)
const V3Background = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-[#000000]">
    {/* Soft Yellow Glow Ambience */}
    <div className="absolute top-1/3 right-1/4 w-[40vw] h-[40vw] bg-[#fcee0a]/[0.015] rounded-full blur-[160px]" />
  </div>
);

const SystemStatusTicker = () => {
  const [latency, setLatency] = useState(2);
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 4) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 font-mono text-[11px] text-primary tracking-widest uppercase">
      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
      <span>LATENCY: {latency}MS</span>
    </div>
  );
};

// --- CyberCN HUD Box Form Inputs ---

const PlayerInput = ({
  index,
  value,
  onChange,
  onRemove
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove?: () => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: -30, filter: 'brightness(2)' }}
    animate={{ opacity: 1, x: 0, filter: 'brightness(1)' }}
    exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
    transition={{ 
      delay: 0.38 + index * 0.1, 
      duration: 0.35, 
      ease: [0.16, 1, 0.3, 1] 
    }}
    className="relative group mb-6"
  >
    {/* Label & Header Line */}
    <div className="flex items-center gap-2 mb-1">
      <label 
        style={{ fontFamily: "'Kode Mono', monospace" }}
        className="text-[0.7rem] font-bold uppercase text-[#777777] group-focus-within:text-tertiary-container transition-colors tracking-wider shrink-0"
      >
        COMPETITOR_{String(index + 1).padStart(2, '0')}
      </label>
      <div className="w-24 h-[1px] bg-[#2a2a2a] group-focus-within:bg-tertiary-container/50 transition-colors" />
    </div>

    {/* HUD Input Box */}
    <div className="relative flex items-center gap-3">
      <div className="flex-1 relative flex flex-col">
        {/* Top subtle line */}
        <div className="w-full h-[1px] bg-[#222222] group-focus-within:bg-[#444444] transition-colors" />

        {/* Middle row with side vertical tick brackets */}
        <div className="relative flex items-center py-2 px-1">
          {/* Left vertical bracket tick */}
          <div className="w-[2px] h-5 bg-[#333333] mr-3 group-focus-within:bg-tertiary-container transition-colors" />

          <input
            style={{ fontFamily: "'Kode Mono', monospace", fontWeight: 700 }}
            className="flex-1 bg-transparent outline-none font-bold text-xl md:text-2xl uppercase placeholder:text-[#333333] text-white tracking-widest"
            placeholder="CODENAME..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />

          {/* Right vertical bracket tick */}
          <div className="w-[2px] h-5 bg-[#333333] ml-3 group-focus-within:bg-tertiary-container transition-colors" />
        </div>

        {/* Bottom Yellow Accent Bar with Chamfered Cut */}
        <div 
          className="h-[3px] w-full bg-tertiary-container transition-all group-focus-within:shadow-[0_0_15px_rgba(252,238,10,0.65)]"
          style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)' }}
        />
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{ fontFamily: "'Kode Mono', monospace" }}
          className="h-11 px-3.5 text-[#555555] hover:text-tertiary-container hover:bg-white/5 border border-white/10 hover:border-tertiary-container/50 transition-all flex items-center justify-center font-black text-xl active:scale-95 shrink-0"
          title="Remove Competitor"
        >
          <motion.span whileHover={{ rotate: 90 }} className="inline-block transform-gpu">✕</motion.span>
        </button>
      )}
    </div>
  </motion.div>
);

const CategoryInput = ({ index, value, onChange }: { index: number; value: string; onChange: (v: string) => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 30, filter: 'brightness(2)' }}
    animate={{ opacity: 1, x: 0, filter: 'brightness(1)' }}
    transition={{ 
      delay: 0.38 + index * 0.1, 
      duration: 0.35, 
      ease: [0.16, 1, 0.3, 1] 
    }}
    className="relative group py-2.5"
  >
    <div className="flex items-center gap-4 group-focus-within:translate-x-1 transition-transform">
      {/* Index Number */}
      <span 
        style={{ fontFamily: "'Kode Mono', monospace" }}
        className={`font-bold text-2xl md:text-3xl transition-colors shrink-0 w-8 ${value.trim() ? 'text-white' : 'text-[#444444]'} group-focus-within:text-tertiary-container`}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* HUD Input Box */}
      <div className="flex-1 relative flex flex-col">
        {/* Top subtle line */}
        <div className="w-full h-[1px] bg-[#222222] group-focus-within:bg-[#444444] transition-colors" />

        {/* Middle row with side vertical tick brackets */}
        <div className="relative flex items-center py-2 px-1">
          {/* Left vertical bracket tick */}
          <div className="w-[2px] h-5 bg-[#333333] mr-3 group-focus-within:bg-tertiary-container transition-colors" />

          <input
            style={{ fontFamily: "'Kode Mono', monospace", fontWeight: 700 }}
            className="flex-1 bg-transparent outline-none font-bold text-lg md:text-xl uppercase placeholder:text-[#333333] text-white tracking-widest"
            placeholder="EMPTY SLOT..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />

          {/* Right vertical bracket tick */}
          <div className="w-[2px] h-5 bg-[#333333] ml-3 group-focus-within:bg-tertiary-container transition-colors" />
        </div>

        {/* Bottom Yellow Accent Bar with Chamfered Cut */}
        <div 
          className="h-[3px] w-full bg-tertiary-container transition-all group-focus-within:shadow-[0_0_15px_rgba(252,238,10,0.65)]"
          style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)' }}
        />
      </div>
    </div>
  </motion.div>
);

const SetupV3: React.FC<SetupProps> = ({ onStart, currentSettings }) => {
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [categories, setCategories] = useState<string[]>(['', '', '', '', '']);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setPlayers(['DEV1', 'DEV2']);
        setCategories(['Maths', 'Science', 'Pop Culture', 'Anime Hard -v', 'Urban Legends -v']);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addPlayer = () => {
    if (players.length < 8) setPlayers([...players, '']);
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index: number, val: string) => {
    const updated = [...players];
    updated[index] = val;
    setPlayers(updated);
  };

  const updateCategory = (index: number, val: string) => {
    const updated = [...categories];
    updated[index] = val;
    setCategories(updated);
  };

  const isFormValid =
    players.every((p: string) => p.trim() !== '') &&
    categories.every((c: string) => c.trim() !== '');

  return (
    <PageTransition>
      <CyberForm
        onSubmit={(e) => {
          e.preventDefault();
          if (isFormValid) {
            onStart(
              players.map(p => p.trim()),
              categories.map(c => c.trim()),
              currentSettings
            );
          }
        }}
        className="w-full max-w-[1640px] mx-auto flex flex-col relative space-y-0"
      >
        <V3Background />
        
        {/* Main Asymmetric Grid (70:30 split) extending to bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 lg:gap-10 items-stretch min-h-[calc(100vh-170px)] pb-2">
          
          {/* Left Side (70%): Header + Players */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6 relative">
            
            {/* Step 1 in sequence: Header Title */}
            <motion.header 
              initial={{ opacity: 0, y: -30, filter: 'brightness(2)' }}
              animate={{ opacity: 1, y: 0, filter: 'brightness(1)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              className="flex flex-col gap-3.5 relative"
            >
              <div className="flex items-center justify-between">
                <Title as="h1" style={{ fontFamily: "'Kode Mono', monospace", fontWeight: 800 }} className="font-turret font-extrabold leading-[0.85] text-[3.6rem] md:text-[5rem] lg:text-[5.8rem] tracking-tight animate-glitch mt-[-8px]">
                  <span className="text-tertiary-container">INITIALIZE</span><br />
                  <span className="text-white">CARNAGE</span>
                </Title>
                <div className="hidden sm:block">
                  <SignalTower />
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
                className="flex items-center gap-4 flex-wrap font-mono mt-1"
              >
                <div className="bg-[#1A1A1A] w-fit px-3.5 py-1.5 text-[0.7rem] font-bold tracking-[0.2em] text-[#777777] uppercase font-mono">
                  Assembling Competitors // Selecting Data Streams
                </div>
                <DataReadout />
              </motion.div>
            </motion.header>

            {/* Step 2 in sequence: Players Block */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col"
            >
              <div 
                className="relative bg-[#000000] border-2 border-tertiary-container p-6 md:p-8 flex-1 flex flex-col justify-between overflow-hidden"
              >
                <TechBracket position="tl" className="top-2 left-2" />
                <TechBracket position="tr" className="top-2 right-2" />
                <TechBracket position="bl" className="bottom-2 left-2" />
                <TechBracket position="br" className="bottom-2 right-2" />
                
                <div className="flex-1 flex flex-col justify-between relative z-20">
                  <div>
                    <div className="flex justify-between items-end mb-8">
                      <div className="flex flex-col gap-1.5">
                        <h2 
                          style={{ fontFamily: "'Kode Mono', monospace" }}
                          className="text-tertiary-container font-turret font-extrabold text-2xl md:text-3xl uppercase tracking-wider"
                        >
                          PLAYERS
                        </h2>
                        <SystemStatusTicker />
                      </div>
                      <span className="bg-white text-black font-mono font-bold text-[11px] px-3.5 py-1 border-2 border-tertiary-container">LIMIT: 08</span>
                    </div>

                    <div className="flex flex-col">
                      <AnimatePresence initial={false} mode="popLayout">
                        {players.map((p: string, i: number) => (
                          <PlayerInput
                            key={`player-${i}`}
                            index={i}
                            value={p}
                            onChange={(v: string) => updatePlayer(i, v)}
                            onRemove={players.length > 2 ? () => removePlayer(i) : undefined}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {players.length < 8 && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.60, duration: 0.3 }}
                      onClick={addPlayer}
                      style={{ fontFamily: "'Kode Mono', monospace" }}
                      className="w-full py-4 mt-4 border-2 border-dashed border-[#333333] text-[#777777] font-turret font-bold text-sm tracking-[0.3em] uppercase hover:text-tertiary-container hover:border-tertiary-container transition-all"
                    >
                      + ADD_COMPETITOR
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Step 2 in sequence: Right Side (30%): Categories Box */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-3 flex flex-col justify-between gap-5 h-full"
          >
            <div 
              className="relative bg-[#000000] p-6 md:p-8 border-2 border-tertiary-container flex-1 flex flex-col justify-between overflow-hidden"
            >
              <TechBracket position="tl" className="top-2 left-2" />
              <TechBracket position="tr" className="top-2 right-2" />
              <TechBracket position="bl" className="bottom-2 left-2" />
              <TechBracket position="br" className="bottom-2 right-2" />
              
              <div className="absolute top-8 right-8 flex flex-col gap-1 opacity-20 pointer-events-none">
                <div className="w-14 h-[2px] bg-tertiary-container" />
                <div className="w-8 h-[2px] bg-tertiary-container" />
              </div>

              <div className="relative z-20 flex flex-col justify-between h-full">
                <div className="flex justify-between items-end mb-4">
                  <h2 
                    style={{ fontFamily: "'Kode Mono', monospace" }}
                    className="text-tertiary-container font-turret font-extrabold text-2xl md:text-3xl uppercase tracking-wider"
                  >
                    CATEGORIES
                  </h2>
                </div>

                <div className="flex-1 flex flex-col justify-around py-2">
                  {categories.map((c: string, i: number) => (
                    <CategoryInput key={i} index={i} value={c} onChange={(v: string) => updateCategory(i, v)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: Start Game Button (AntiMetalButton) */}
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.88, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col w-full shrink-0"
            >
              <AntiMetalButton
                id="initialize-carnage-trigger-v3"
                size="lg"
                label="START GAME"
                accentFrom="#fcee0a"
                accentTo="#fcee0a"
                dotColor="#000000"
                disabled={!isFormValid}
                type="submit"
                className={`w-full h-16 rounded-xl border transition-all ${
                  !isFormValid 
                    ? 'border-white/10 opacity-40 cursor-not-allowed' 
                    : 'border-tertiary-container/30 cursor-pointer hover:border-tertiary-container hover:shadow-[0_0_20px_rgba(252,238,10,0.15)]'
                }`}
              />

              {!isFormValid && (
                <p className="text-tertiary-container text-right text-[11px] uppercase font-bold tracking-widest mt-2 pr-2 font-mono">
                  ⚠ Fill all required data streams to initialize
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </CyberForm>
    </PageTransition>
  );
};

export default SetupV3;
