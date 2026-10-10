import React from 'react';
import { motion } from 'framer-motion';
import { Screen } from '../../types/game';
import { AntiMetalButton } from './anti-metal-button';
import { CyberpunkSettingsLogo } from './CyberpunkSettingsLogo';

interface NavbarProps {
  currentScreen: Screen;
  navVisible: boolean;
  onNavigate: (screen: Screen) => void;
  onOpenSettings: () => void;
  onNewGame: () => void;
  onOpenLeaderboard?: () => void;
}

// ==========================================
// 🎛️ NAVBAR POSITION & SVG CONTROLS
// Adjust these numbers directly to move/scale the SVG notch:
// ==========================================
export const NAVBAR_CONFIG = {
  // Negative values shift the notch UP, positive values shift DOWN:
  notchYOffset: -24, // <-- CHANGE THIS to move the SVG notch up/down in pixels (e.g. -20, -15, -10, 0)

  // Height of the central hanging notch:
  notchHeight: 70, // in pixels

  // Width of the central hanging notch:
  notchWidth: 720, // in pixels

  // Vertical position adjustment for the text/tab items inside the notch:
  tabsYOffset: 12, // in pixels (shifts nav tabs up/down inside the notch)

  // Vertical position adjustment for the left (Logo) and right (Actions) wings:
  wingsYOffset: 0, // in pixels (shifts the rest of the navbar components up/down)
};

const NAV_TABS = [
  { id: 'GAME' as Screen, label: 'BOARD', screens: ['GAME', 'QUESTION'] },
  { id: 'SETUP' as Screen, label: 'PLAYERS', screens: ['SETUP'] },
  { id: 'RULES' as Screen, label: 'RULES', screens: ['RULES', 'END'] },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  navVisible,
  onNavigate,
  onOpenSettings,
  onNewGame,
  onOpenLeaderboard,
}) => {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: navVisible ? 0 : -100, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none select-none"
    >
      {/* Center: Hanging Notch Navigation Bar */}
      <div
        className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-auto z-30 transition-all"
        style={{
          top: `${NAVBAR_CONFIG.notchYOffset}px`,
          height: `${NAVBAR_CONFIG.notchHeight}px`,
          width: `${NAVBAR_CONFIG.notchWidth}px`,
        }}
      >
        {/* SVG Shape from Figma node 59:24 / 59:25 */}
        <div className="absolute inset-0 w-full h-full text-tertiary-container">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1148.72 101.5"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M112.726 96.2237L75.1272 74.7237C22.6685 44.7262 -3.56089 29.7274 0.388802 14.8637C4.33849 0 34.5534 0 94.9833 0H1064.18C1117.28 0 1143.83 0 1148.18 14.1087C1152.53 28.2174 1130.59 43.1644 1086.7 73.0585L1055.14 94.5585C1050.09 98.003 1047.56 99.7253 1044.68 100.613C1041.8 101.5 1038.74 101.5 1032.62 101.5H132.582C127.297 101.5 124.655 101.5 122.131 100.829C119.607 100.158 117.313 98.8469 112.726 96.2237Z"
              fill="#fcee0a"
            />
          </svg>
        </div>

        {/* Navigation Links inside Notch (Centered mathematically in the notch) */}
        <div
          className="absolute inset-0 z-10 w-full flex items-center justify-center gap-6 lg:gap-8"
          style={{ transform: `translateY(${NAVBAR_CONFIG.tabsYOffset}px)` }}
        >
          {NAV_TABS.map((tab) => {
            const isActive = tab.screens.includes(currentScreen);
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                style={{ fontFamily: "'Kode Mono', monospace" }}
                className={`relative px-4 py-1.5 font-turret font-extrabold uppercase tracking-wider text-[14px] transition-colors ${isActive
                  ? 'text-black font-black'
                  : 'text-black/60 hover:text-black'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Header Background Bar */}
      <div
        className="w-full max-w-[1680px] mx-auto flex items-center justify-between px-8 sm:px-14 md:px-20 lg:px-28 xl:px-36 py-2 pointer-events-auto relative transition-all"
        style={{ transform: `translateY(${NAVBAR_CONFIG.wingsYOffset}px)` }}
      >

        {/* Left Wing: Cyberpunk Logo */}
        <div className="flex items-center gap-4 z-20">
          <button
            onClick={() => onNavigate('SETUP')}
            className="group relative flex items-center transition-transform active:scale-95 focus:outline-none"
          >
            <img
              src="/Logo_Cyberpunk.png"
              alt="JEPARDY CYBERPUNK"
              className="h-16 sm:h-20 lg:h-22 w-auto object-contain transition-opacity duration-200 hover:opacity-90"
            />
          </button>
        </div>

        {/* Right Wing: Actions */}
        <div className="flex items-center gap-3 sm:gap-4 z-20">
          <button
            onClick={onOpenLeaderboard}
            className="p-2 text-white/60 hover:text-tertiary-container flex items-center justify-center transition-colors"
            title="Leaderboard"
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'wght' 200, 'opsz' 24" }}
            >
              leaderboard
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-white/60 hover:text-tertiary-container flex items-center justify-center transition-colors group"
            title="Settings"
          >
            <CyberpunkSettingsLogo size={20} spinOnHover={true} />
          </button>

          <AntiMetalButton
            label="NEW GAME"
            onClick={onNewGame}
            accentFrom="#fcee0a"
            accentTo="#fcee0a"
            dotColor="#000000"
            className="h-9 min-w-[148px] border-[1.5px] border-white/20 hover:border-white/40"
          />
        </div>
      </div>

      {/* Mobile Nav Tabs (Visible only below md breakpoint) */}
      <div className="md:hidden w-full bg-[#fcee0a] border-b border-[#ddcc00] px-4 py-2 flex items-center justify-around pointer-events-auto">
        {NAV_TABS.map((tab) => {
          const isActive = tab.screens.includes(currentScreen);
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              style={{ fontFamily: "'Kode Mono', monospace" }}
              className={`px-3 py-1 text-sm font-turret font-extrabold uppercase tracking-wider ${isActive ? 'text-black font-black' : 'text-black/60'
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </motion.header>
  );
};

export default Navbar;
