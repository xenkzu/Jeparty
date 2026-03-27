import { useState } from 'react';
import Title from '../../components/ui/Title';

interface SetupProps {
  onStart: (players: string[], categories: string[], scoringMode: 'normal' | 'advanced') => void;
}

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
  <div className="flex flex-col gap-1 mb-6 animate-in fade-in slide-in-from-left-2 duration-300">
    <label className="text-[0.65rem] font-display font-bold uppercase tracking-[0.2em] text-surface-bright pl-1">
      Player_{String(index + 1).padStart(2, '0')}
    </label>
    <div className="flex h-14 bg-[#1A1A1A] [clip-path:polygon(0_0,100%_0,95%_100%,0%_100%)] items-center">
      <div className="w-1.5 bg-tertiary-container h-full mr-4 shrink-0"></div>
      <input
        className="w-full bg-transparent outline-none font-display font-bold text-lg uppercase placeholder:text-[#333333] text-on-surface"
        placeholder="ENTER CODENAME..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {/* Logic Wiring: Delete trigger using existing branding patterns */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="px-6 h-full text-tertiary-container hover:text-white transition-colors flex items-center justify-center font-display font-bold text-xl uppercase"
          aria-label="Delete entry"
        >
          ✕
        </button>
      )}
    </div>
  </div>
);

const CategoryInput = ({ index, value, onChange }: { index: number; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center gap-4 mb-6 text-on-surface font-display font-bold text-xl md:text-2xl uppercase">
    <span className="text-[#333333]">{String(index + 1).padStart(2, '0')}</span>
    <input
      className="bg-transparent outline-none w-full placeholder:text-[#333333] text-on-surface"
      placeholder="EMPTY SLOT..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const Setup: React.FC<SetupProps> = ({ onStart }) => {
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [categories, setCategories] = useState<string[]>(['', '', '', '', '']);
  const [advancedMode, setAdvancedMode] = useState(true);

  const addPlayer = () => {
    if (players.length < 8) setPlayers([...players, '']);
  };

  /**
   * Logic Wiring: Remove player by index, maintaining minimum of 2.
   */
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

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-12 pb-24">
      {/* Header Section */}
      <header className="flex flex-col gap-4">
        <Title as="h1" className="text-tertiary-container leading-[0.85] text-[4rem] md:text-[7rem] tracking-tighter">
          INITIALIZE<br />CARNAGE
        </Title>
        <div className="bg-[#1A1A1A] w-fit px-4 py-2 text-[0.65rem] font-bold tracking-[0.2em] text-[#666666] uppercase">
          Assembling Competitors // Selecting Data Streams
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

        {/* Left Column: Players & Settings */}
        <div className="flex flex-col gap-6">

          {/* Players Block */}
          <div className="bg-[#0D0D0D] p-6 relative border-t-2 border-l border-r border-b border-[#1A1A1A]">
            <div className="absolute top-0 left-0 w-16 h-0.5 bg-tertiary-container shadow-[0_0_10px_rgba(254,0,0,0.5)]"></div>
            <div className="absolute bottom-0 right-0 w-24 h-0.5 bg-tertiary-container shadow-[0_0_10px_rgba(254,0,0,0.5)]"></div>

            <div className="flex justify-between items-end mb-8">
              <h2 className="text-white font-display font-bold text-3xl md:text-4xl tracking-tight">PLAYERS</h2>
              <span className="bg-white text-black font-display font-bold text-xs px-2 py-0.5 tracking-tight border border-tertiary-container">LIMIT: 08</span>
            </div>

            <div className="flex flex-col">
              {players.map((p: string, i: number) => (
                <PlayerInput
                  key={i}
                  index={i}
                  value={p}
                  onChange={(v: string) => updatePlayer(i, v)}
                  onRemove={players.length > 2 ? () => removePlayer(i) : undefined}
                />
              ))}

              {players.length < 8 && (
                <button
                  onClick={addPlayer}
                  className="w-full py-4 mt-2 border-2 border-dashed border-[#333333] text-[#666666] font-display font-bold text-sm tracking-widest uppercase hover:text-white hover:border-[#666666] transition-colors"
                >
                  + Add Competitor
                </button>
              )}
            </div>
          </div>

          {/* Settings / Alert Block */}
          <button
            onClick={() => setAdvancedMode(!advancedMode)}
            className="w-full flex items-stretch gap-4 bg-[#1A1A1A] hover:bg-[#222222] transition-colors text-left"
          >
            <div className={`w-12 flex items-center justify-center transition-colors ${advancedMode ? 'bg-tertiary-container' : 'bg-[#333333]'}`}>
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center py-4 pr-4">
              <span className="text-white font-display font-bold text-base md:text-lg">
                {advancedMode ? 'PERMANENT DEATH ENABLED' : 'STANDARD SCORING ENABLED'}
              </span>
              <span className="text-[#666666] font-body text-xs mt-1">
                {advancedMode
                  ? 'Scores reset upon exit. Players disconnected during the prompt phase will be purged.'
                  : 'Scores persist. A more resilient option for casual data streams.'}
              </span>
            </div>
          </button>
        </div>

        {/* Right Column: Categories & Start */}
        <div className="flex flex-col gap-8">

          {/* Categories Block */}
          <div className="bg-[#1A1A1A] p-6 lg:p-10 [clip-path:polygon(0_0,100%_2%,100%_100%,0%_98%)] border-l-4 border-tertiary-container flex flex-col gap-6">
            <h2 className="text-tertiary-container font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">CATEGORIES</h2>

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

          {/* Start Game Button */}
          {/* Logic Wiring: trimmed data passed to onStart with correctly mapped scoringMode string */}
          <button
            disabled={!isFormValid}
            onClick={() => onStart(
              players.map(p => p.trim()),
              categories.map(c => c.trim()),
              advancedMode ? 'advanced' : 'normal'
            )}
            className={`mt-4 relative group transition-all duration-300 ${!isFormValid ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-1 hover:translate-x-1'}`}
          >
            {/* White Shadow Background Component */}
            <div className="absolute inset-0 bg-white [clip-path:polygon(0_0,100%_0,95%_100%,0%_100%)] translate-y-2 -translate-x-2 group-hover:translate-y-4 group-hover:-translate-x-4 transition-transform duration-300"></div>

            <div className="relative bg-tertiary-container flex items-center justify-between p-8 md:p-12 [clip-path:polygon(0_0,100%_0,95%_100%,0%_100%)]">
              <span className="font-display font-bold text-5xl md:text-7xl uppercase leading-[0.85] text-on-tertiary-container tracking-tighter text-left">
                START<br />GAME
              </span>
              <svg className="w-16 h-16 md:w-24 md:h-24 text-on-tertiary-container" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9v8l10-12h-9l0-8z" />
              </svg>
            </div>
          </button>

          {!isFormValid && (
            <p className="text-tertiary-container text-right text-xs uppercase font-bold tracking-widest mt-2 pr-4">
              ⚠ Fill all required data streams to initialize
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default Setup;
