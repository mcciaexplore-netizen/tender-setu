interface IconProps {
  path: string;
  className?: string;
}

export const Icon = ({ path, className = 'h-5 w-5' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d={path} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
