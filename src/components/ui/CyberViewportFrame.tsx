import React from 'react';
import { motion } from 'framer-motion';

interface CyberViewportFrameProps {
  className?: string;
}

export const CyberViewportFrame: React.FC<CyberViewportFrameProps> = ({
  className = '',
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className={`fixed inset-0 pointer-events-none z-30 select-none overflow-hidden ${className}`}
    >
      {/* Outer Perimeter Wireframe Border - draws top-to-bottom */}
      <motion.div 
        initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
        animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
        className="absolute inset-0 border border-[#fcee0a]/30 pointer-events-none"
      >
        {/* Top-left corner crosshair */}
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#fcee0a]" />
        
        {/* Top-right corner crosshair */}
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#fcee0a]" />
        
        {/* Bottom-left corner crosshair */}
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#fcee0a]" />
        
        {/* Bottom-right corner crosshair */}
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#fcee0a]" />
      </motion.div>

      {/* Bottom Center Notch */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          className="w-48 sm:w-64 md:w-80 h-3.5 bg-[#fcee0a] shadow-[0_0_12px_rgba(252,238,10,0.4)] origin-center"
          style={{
            clipPath: 'polygon(12% 0, 88% 0, 100% 100%, 0% 100%)',
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* LEFT SIDE CYBERCN BILATERAL FRAME RAIL (DRAW DOWN) */}
      {/* ========================================================= */}
      <motion.div 
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ transformOrigin: 'top' }}
        className="absolute left-0 top-20 bottom-0 w-7 sm:w-9 md:w-11 flex flex-col justify-between pointer-events-none"
      >
        {/* Main Left Chamfered Bracket */}
        <div 
          className="w-full flex-1 bg-[#fcee0a] shadow-[0_0_15px_rgba(252,238,10,0.35)] relative"
          style={{
            clipPath: 'polygon(0% 0%, 100% 36px, 100% calc(100% - 36px), 36px 100%, 0% 100%, 0% 0%)',
          }}
        >
          {/* Inner Black Cutout to create the signature thick CyberCN frame rail */}
          <div 
            className="absolute inset-0 top-0 left-0 bottom-0 right-[7px] sm:right-[9px] bg-[#000000]"
            style={{
              clipPath: 'polygon(0% 0%, 100% 30px, 100% calc(100% - 30px), 28px 100%, 0% 100%, 0% 0%)',
            }}
          />
        </div>

        {/* Bottom Left Angled Wedge Accent */}
        <div 
          className="w-full h-8 sm:h-11 bg-[#fcee0a] shadow-[0_0_10px_rgba(252,238,10,0.4)] mt-2.5 mb-0"
          style={{
            clipPath: 'polygon(0% 0%, 36px 0%, 100% 100%, 0% 100%)',
          }}
        />
      </motion.div>

      {/* ========================================================= */}
      {/* RIGHT SIDE CYBERCN BILATERAL FRAME RAIL (DRAW DOWN) */}
      {/* ========================================================= */}
      <motion.div 
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ transformOrigin: 'top' }}
        className="absolute right-0 top-20 bottom-0 w-7 sm:w-9 md:w-11 flex flex-col justify-between pointer-events-none"
      >
        {/* Main Right Chamfered Bracket */}
        <div 
          className="w-full flex-1 bg-[#fcee0a] shadow-[0_0_15px_rgba(252,238,10,0.35)] relative"
          style={{
            clipPath: 'polygon(100% 0%, 0% 36px, 0% calc(100% - 36px), calc(100% - 36px) 100%, 100% 100%, 100% 0%)',
          }}
        >
          {/* Inner Black Cutout to create the signature thick CyberCN frame rail */}
          <div 
            className="absolute inset-0 top-0 right-0 bottom-0 left-[7px] sm:left-[9px] bg-[#000000]"
            style={{
              clipPath: 'polygon(100% 0%, 0% 30px, 0% calc(100% - 30px), calc(100% - 28px) 100%, 100% 100%, 100% 0%)',
            }}
          />
        </div>

        {/* Bottom Right Angled Wedge Accent */}
        <div 
          className="w-full h-8 sm:h-11 bg-[#fcee0a] shadow-[0_0_10px_rgba(252,238,10,0.4)] mt-2.5 mb-0"
          style={{
            clipPath: 'polygon(100% 0%, calc(100% - 36px) 0%, 0% 100%, 100% 100%)',
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default CyberViewportFrame;
