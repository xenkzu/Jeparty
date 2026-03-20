import React from 'react';

interface TitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}

const Title: React.FC<TitleProps> = ({ children, className = '', as: Component = 'h1' }) => {
  // Using Archivo Black (font-display) with aggressive tracking and sizing
  return (
    <Component className={`font-display text-display-lg font-bold text-on-surface uppercase ${className}`}>
      {children}
    </Component>
  );
};

export default Title;
