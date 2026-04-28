import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Title from '../../components/ui/Title';
import { GameSettings } from '../../types/game';
import { PageTransition } from '../../components/ui/PageTransition';

interface SetupProps {
  onStart: (players: string[], categories: string[], settings: GameSettings) => void;
  onOpenSettings?: () => void;
  currentSettings: GameSettings;
}

// Full-page background canvas
const CyberpunkBackground = () => {
  // Dot grid
  const dots = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 2 + Math.random() * 3,
  }));

  // Horizontal scan lines — sparse, full width
  const scanLines = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    top: 15 + i * 22,
    duration: 8 + i * 3,
    delay: i * 2,
  }));

  // Vertical lines — sparse
  const vertLines = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    left: 5 + i * 20,
    duration: 12 + i * 2,
    delay: i * 1.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Sparse dot grid across full page */}
      {dots.map(dot => (
        <motion.div
          key={dot.id}
          className="absolute w-px h-px bg-tertiary-container rounded-full"
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: dot.duration, repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Full-width horizontal scan lines */}
      {scanLines.map(line => (
        <motion.div
          key={line.id}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${line.top}%`,
            background: 'linear-gradient(to right, transparent, rgba(254,0,0,0.15) 30%, rgba(254,0,0,0.15) 70%, transparent)',
          }}
          animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1, 0.3] }}
          transition={{ duration: line.duration, repeat: Infinity, delay: line.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Sparse vertical lines */}
      {vertLines.map(line => (
        <motion.div
          key={line.id}
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${line.left}%`,
            background: 'linear-gradient(to bottom, transparent, rgba(254,0,0,0.08) 40%, rgba(254,0,0,0.08) 60%, transparent)',
          }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: line.duration, repeat: Infinity, delay: line.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Corner accents — all four corners */}
      {[
        { top: '2%', left: '1%' },
        { top: '2%', right: '1%' },
        { bottom: '2%', left: '1%' },
        { bottom: '2%', right: '1%' },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-16"
          style={pos}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
        >
          <div className="absolute top-0 left-0 w-full h-px bg-tertiary-container/50" />
          <div className="absolute top-0 left-0 w-px h-full bg-tertiary-container/50" />
        </motion.div>
      ))}

      {/* Floating coordinate labels — scattered in the empty zones */}
      {[
        { x: '3%', y: '15%', label: 'X:0042' },
        { x: '88%', y: '25%', label: 'Y:0189' },
        { x: '5%', y: '72%', label: 'Z:0031' },
        { x: '90%', y: '65%', label: 'X:0097' },
        { x: '50%', y: '90%', label: 'SYS:OK' },
      ].map((item, i) => (
        <motion.span
          key={i}
          className="absolute font-mono text-[9px] text-tertiary-container/20 tracking-widest"
          style={{ left: item.x, top: item.y }}
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 0.8 }}
        >
          {item.label}
        </motion.span>
      ))}
    </div>
  );
};


// Live scrambling readout — visible text
const DataReadout = () => {
  const [val, setVal] = useState('00.00');
  const [label, setLabel] = useState('SYNC');
  const labels = ['SYNC', 'AUTH', 'INIT', 'SCAN', 'LOAD'];
  useEffect(() => {
    const timer = setInterval(() => {
      setVal((Math.random() * 100).toFixed(2).padStart(5, '0'));
      setLabel(labels[Math.floor(Math.random() * labels.length)]);
    }, 120);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="font-mono text-[10px] text-tertiary-container/60 tracking-[.25em] uppercase flex items-center gap-2">
      <motion.div
        className="w-1.5 h-1.5 bg-tertiary-container rounded-full"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.4, repeat: Infinity }}
      />
      <span>{label}_{val}</span>
    </div>
  );
};

// Animated signal bars — more visible, right-aligned
const SignalTower = () => (
  <div className="flex flex-col gap-[3px] items-end">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="h-[2px] bg-tertiary-container"
        animate={{ width: [8, 20 + i * 6, 8], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

// Corner bracket — slightly more visible
const TechBracket = ({ className, position }: { className?: string; position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const rotation = { tl: '0deg', tr: '90deg', br: '180deg', bl: '270deg' }[position];
  return (
    <div className={`absolute w-8 h-8 ${className}`} style={{ transform: `rotate(${rotation})` }}>
      <div className="absolute top-0 left-0 w-full h-[2px] bg-tertiary-container/60" />
      <div className="absolute top-0 left-0 w-[2px] h-full bg-tertiary-container/60" />
      <motion.div
        className="absolute top-0 left-0 w-2 h-2 bg-tertiary-container"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
};


// Top-right corner: live system status ticker
const SystemStatusTicker = () => {
  const statuses = [
    'NODE_LINK: STABLE',
    'ENCRYPTION: AES-256',
    'LATENCY: 4ms',
    'PLAYERS: ONLINE',
    'AI_CORE: ACTIVE',
    'SYNC: 99.8%',
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % statuses.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="w-2 h-2 bg-green-500 rounded-full"
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="font-mono text-[10px] text-green-500/70 tracking-widest uppercase"
        >
          {statuses[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};



// Typewriter boot sequence — shows below the title
const BootSequence = () => {
  const lines = [
    '> JEPARTY_OS v4.02 LOADED',
    '> INITIALIZING ARENA PROTOCOLS...',
    '> AI_CORE ONLINE',
    '> AWAITING COMPETITORS_',
  ];
  const [visibleCount, setVisibleCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visibleCount < lines.length) {
      const t = setTimeout(() => setVisibleCount(v => v + 1), 500);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setDone(true), 2000);
      return () => clearTimeout(t);
    }
  }, [visibleCount]);

  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex flex-col"
        initial={{ opacity: 1 }}
        animate={done ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {lines.slice(0, visibleCount).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-mono text-[8px] text-tertiary-container/20 tracking-widest leading-none mb-1"
          >
            {line}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

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
    initial={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
    animate={{ opacity: 1, x: 0, height: 'auto', marginBottom: 40 }}
    exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    className="relative group overflow-hidden"
  >
    {/* Block Shadow */}
    <div className="absolute inset-0 bg-tertiary-container/30 translate-x-2 translate-y-2 input-shard group-focus-within:translate-x-3 group-focus-within:translate-y-3 group-focus-within:bg-tertiary-container/60 transition-all duration-300"></div>
    
    {/* Container */}
    <div className="relative flex h-20 bg-[#111111] items-center input-shard transition-all border-b-4 border-tertiary-container group-focus-within:bg-[#1a1a1a]">
      <div className="w-2 bg-tertiary-container h-12 mr-6 group-focus-within:h-full transition-all"></div>
      <div className="flex flex-col flex-1 py-2">
        <label className="text-[0.65rem] font-display font-light uppercase text-[#444444] group-focus-within:text-tertiary-container transition-colors">
          COMPETITOR_{String(index + 1).padStart(2, '0')}
        </label>
        <input
          style={{ fontWeight: 300 }}
          className="w-full bg-transparent outline-none font-display text-xl md:text-2xl uppercase placeholder:text-[#222222] text-white"
          placeholder="CODENAME..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="px-8 h-full text-[#333333] hover:text-tertiary-container transition-colors flex items-center justify-center font-display font-black text-2xl"
        >
          <motion.span whileHover={{ rotate: 90 }} className="inline-block transform-gpu">✕</motion.span>
        </button>
      )}
    </div>
  </motion.div>
);

const CategoryInput = ({ index, value, onChange }: { index: number; value: string; onChange: (v: string) => void }) => (
  <div 
    className="relative group mb-6 animate-power-on"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="flex items-center gap-6 group-focus-within:translate-x-2 transition-transform">
      <span className={`font-display font-light text-3xl md:text-4xl transition-colors ${value.trim() ? 'text-white' : 'text-[#1a1a1a]'} group-focus-within:text-tertiary-container`}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex-1 relative flex flex-col">
        <input
          className="bg-transparent outline-none w-full placeholder:text-[#222222] text-white font-display font-light text-xl md:text-2xl uppercase border-b-4 border-[#1a1a1a] focus:border-tertiary-container py-2 transition-all"
          placeholder="EMPTY SLOT..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  </div>
);

const Setup: React.FC<SetupProps> = ({ onStart, onOpenSettings, currentSettings }) => {
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [categories, setCategories] = useState<string[]>(['', '', '', '', '']);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut: Ctrl + Shift + A
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
      const newPlayers = [...players];
      newPlayers.splice(index, 1);
      setPlayers(newPlayers);
    }
  };

  const updatePlayer = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const updateCategory = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
  };

  const isFormValid = players.every((p: string) => p.trim() !== '') && categories.every((c: string) => c.trim() !== '');

  // Auto-scroll when form is valid
  useEffect(() => {
    if (isFormValid) {
      const timer = setTimeout(() => {
        const startBtn = document.getElementById('initialize-carnage-trigger');
        if (startBtn) {
          startBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFormValid]);

  const settingsSummary = [
    currentSettings.difficulty.toUpperCase(),
    currentSettings.timeLimit === 0 ? 'UNLIMITED' : `${currentSettings.timeLimit}S`,
    `${currentSettings.questionsPerCategory}Q`,
    currentSettings.scoringMode === 'advanced' ? 'ADVANCED' : 'STANDARD',
  ].join(' · ');

  return (
    <PageTransition>
      <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-12 pb-24 relative">
      <CyberpunkBackground />
      {/* Header Section */}
      {/* Main Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-32 items-start">
        
        {/* Left Side: Header + Players */}
        <div className="flex flex-col gap-4 lg:gap-6 relative">
          <header className="flex flex-col gap-8 relative">
            <div className="absolute -left-12 top-0 h-full w-px bg-gradient-to-b from-transparent via-tertiary-container/40 to-transparent hidden xl:block" />
            
            {/* Absolute log to the left — doesn't push title */}
            <div className="absolute -left-44 top-0 hidden 2xl:block w-32 text-right">
              <BootSequence />
            </div>

            <Title as="h1" className="text-tertiary-container leading-[0.85] text-[4rem] md:text-[6rem] tracking-tighter animate-glitch mt-[-8px]">
              INITIALIZE<br />CARNAGE
            </Title>
            
            <div className="absolute top-0 -right-20 hidden 2xl:block">
              <SignalTower />
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="bg-[#1A1A1A] w-fit px-4 py-2 text-[0.65rem] font-bold tracking-[0.2em] text-[#666666] uppercase">
                Assembling Competitors // Selecting Data Streams
              </div>
              {/* On smaller screens show boot sequence here instead of fixed left */}
              <div className="2xl:hidden w-full">
                <BootSequence />
              </div>
              <DataReadout />
            </div>
          </header>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            {/* Players Block content follows... */}

          {/* Players Block */}
          <div className="relative bg-[#111111] border-l-4 border-tertiary-container p-1 overflow-hidden min-h-[500px]">
            <TechBracket position="tl" className="top-3 left-3" />
            <TechBracket position="tr" className="top-3 right-3" />
            <TechBracket position="bl" className="bottom-3 left-3" />
            <TechBracket position="br" className="bottom-3 right-3" />
            <div className="bg-[#111111] p-10 flex flex-col relative z-20">
              <div className="flex justify-between items-end mb-12">
                <div className="flex flex-col gap-1">
                  <h2 
                    style={{ fontWeight: 300 }}
                    className="text-tertiary-container font-display text-3xl md:text-4xl uppercase"
                  >
                    PLAYERS
                  </h2>
                  <SystemStatusTicker />
                </div>
                <span className="bg-white text-black font-display font-bold text-[10px] px-3 py-1 border-2 border-tertiary-container">LIMIT: 08</span>
              </div>

              <div className="flex flex-col">
                <AnimatePresence initial={false} mode="popLayout">
                  {players.map((p: string, i: number) => (
                    <PlayerInput
                      key={`player-${i}`} // Stable key for animation
                      index={i}
                      value={p}
                      onChange={(v: string) => updatePlayer(i, v)}
                      onRemove={players.length > 2 ? () => removePlayer(i) : undefined}
                    />
                  ))}
                </AnimatePresence>

                {players.length < 8 && (
                  <button
                    onClick={addPlayer}
                    className="w-full py-6 mt-4 border-4 border-dashed border-[#333333] text-[#666666] font-display font-bold text-sm tracking-[0.4em] uppercase hover:text-tertiary-container hover:border-tertiary-container transition-all"
                  >
                    + ADD_COMPETITOR
                  </button>
                )}
            </div>
          </div>

          {/* Settings Button — now just a read-only summary; clicking opens global modal via nav cog */}
          </div>
        </motion.div>

        {/* Global Settings Trigger — Docked tightly below Players */}
        <motion.button
          whileHover={{ scale: 1.01, backgroundColor: '#222222' }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenSettings}
          className="w-full flex items-stretch gap-4 bg-[#1A1A1A] text-left transition-colors group relative overflow-hidden mt-4"
        >
          <div className="w-12 flex items-center justify-center bg-[#333333] group-hover:bg-tertiary-container transition-colors">
            <svg className="w-6 h-6 text-white group-hover:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="square" strokeLinejoin="miter" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col justify-center py-4 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-display font-bold text-sm tracking-tight">GAME SETTINGS</span>
              <span className="text-[10px] bg-tertiary-container text-black px-1.5 font-black">CONFIG</span>
            </div>
            <span className="text-tertiary-container/60 font-body text-[10px] mt-0.5 tracking-[0.2em] uppercase leading-none">{settingsSummary}</span>
          </div>
        </motion.button>
        </div>

        {/* Right Side: Categories (Aligned to top) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col"
        >

          {/* Categories Block */}
          <div className="relative bg-[#111111] pt-8 pb-10 px-10 border-l-4 border-tertiary-container flex flex-col gap-10 overflow-hidden min-h-[500px]">
            <TechBracket position="tl" className="top-3 left-3" />
            <TechBracket position="tr" className="top-3 right-3" />
            <TechBracket position="bl" className="bottom-3 left-3" />
            <TechBracket position="br" className="bottom-3 right-3" />
            <div className="absolute top-10 right-12 opacity-10">
              <div className="w-20 h-1 bg-tertiary-container mb-1" />
              <div className="w-12 h-1 bg-tertiary-container" />
            </div>
            <div className="relative z-20 flex flex-col gap-10">
              <div className="flex justify-between items-end">
                <h2 
                  style={{ fontWeight: 300 }}
                  className="text-tertiary-container font-display text-3xl md:text-4xl uppercase"
                >
                  CATEGORIES
                </h2>
              </div>

            <div className="flex flex-col">
              {categories.map((c: string, i: number) => (
                <CategoryInput key={i} index={i} value={c} onChange={(v: string) => updateCategory(i, v)} />
              ))}
            </div>

            {/* Auto-fill Block */}
            <div className="mt-4 bg-[#0D0D0D] p-4 flex flex-col gap-3 relative">
              <span className="text-[0.6rem] font-bold tracking-[0.2em] text-[#666666] uppercase">Auto_Fill_Options</span>
              <div className="flex flex-wrap gap-2">
                {['RETRO_GAMING', '80S_SYNTH', 'KITCHEN_SINK'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newCat = [...categories];
                      const emptyIndex = newCat.findIndex(c => c === '');
                      if (emptyIndex !== -1) {
                        newCat[emptyIndex] = tag.replace('_', ' ');
                        setCategories(newCat);
                      }
                    }}
                    className="bg-[#222222] hover:bg-white hover:text-black text-white px-3 py-1 text-[0.65rem] font-bold tracking-widest uppercase transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 hidden sm:block">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              </div>
            </div>
          </div>

          {/* Start Game Button - Technical Industrial Redesign */}
          <motion.button
            id="initialize-carnage-trigger"
            whileTap={isFormValid ? { scale: 0.98 } : {}}
            disabled={!isFormValid}
            onClick={() => onStart(
              players.map(p => p.trim()),
              categories.map(c => c.trim()),
              currentSettings
            )}
            className={`mt-12 relative group overflow-hidden ${!isFormValid ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Background Layers */}
            <div 
              className="bg-tertiary-container p-0.5 pt-1 transition-all duration-300"
              style={{ clipPath: 'polygon(0 0, 98% 0, 100% 20%, 100% 100%, 2% 100%, 0% 80%)' }}
            >
              <div 
                className="flex items-center justify-between p-5 md:p-8 relative overflow-hidden transition-colors duration-300 bg-[#0A0A0A] group-hover:bg-tertiary-container"
                style={{ clipPath: 'polygon(0 0, 98% 0, 100% 20%, 100% 100%, 2% 100%, 0% 80%)' }}
              >
                {/* Robust Light Sweep Implementation - Restored and Fixed */}
                {isFormValid && (
                  <motion.div
                    className="absolute -top-[50%] h-[200%] w-64 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-[25deg] pointer-events-none z-20"
                    animate={{ left: ['-100%', '300%'] }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity, 
                      repeatDelay: 2.5,
                      ease: "easeInOut" 
                    }}
                  />
                )}

                {/* Subtle scanning bar */}
                <motion.div 
                  className="absolute inset-0 w-full h-[1px] bg-tertiary-container/10 z-0"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />

                <span className="font-display font-black text-3xl md:text-5xl italic uppercase leading-none text-tertiary-container group-hover:text-black tracking-tight whitespace-nowrap transition-colors relative z-10">
                  START GAME
                </span>

                <motion.svg 
                  className="w-10 h-10 md:w-12 md:h-12 text-tertiary-container group-hover:text-black transition-colors relative z-10" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  animate={{ opacity: [1, 0.7, 1, 0.9, 1] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.4, 0.6, 1] }}
                >
                  <path d="M13 2L3 14h9v8l10-12h-9l0-8z" />
                </motion.svg>
              </div>
            </div>

            {/* Corner Decals */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tertiary-container opacity-40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tertiary-container opacity-40" />
          </motion.button>

          {!isFormValid && (
            <p className="text-tertiary-container text-right text-xs uppercase font-bold tracking-widest mt-2 pr-4">
              ⚠ Fill all required data streams to initialize
            </p>
          )}

        </motion.div>
      </div>

    </div>
    </PageTransition>
  );
};

export default Setup;
