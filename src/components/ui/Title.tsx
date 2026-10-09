import React from 'react';

interface TitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  style?: React.CSSProperties;
}

const Title: React.FC<TitleProps> = ({ children, className = '', as: Component = 'h1', style }) => {
  return (
    <Component 
      style={{ fontFamily: "'Zalando Sans Expanded', sans-serif", ...style }}
      className={`font-zalando font-black text-on-surface uppercase tracking-tight ${className}`}
    >
      {children}
    </Component>
  );
};

export default Title;
