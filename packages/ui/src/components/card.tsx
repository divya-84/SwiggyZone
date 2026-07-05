import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = true,
  glass = false,
  className = '',
  ...props
}) => {
  const baseStyle = 'rounded-2xl border p-5 transition-all duration-300';

  const styles = glass
    ? 'bg-white/5 backdrop-blur-lg border-white/10 text-white shadow-xl shadow-black/10'
    : 'bg-dark-surface border-dark-border text-dark-text shadow-md';

  const hoverStyle = hoverable
    ? glass
      ? 'hover:-translate-y-1 hover:bg-white/10 hover:border-white/20'
      : 'hover:-translate-y-1 hover:shadow-xl hover:border-dark-border/80'
    : '';

  return (
    <div className={`${baseStyle} ${styles} ${hoverStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};
