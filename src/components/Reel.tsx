interface ReelProps {
  label: string;
  value: string;
  accent: string;
  spinning: boolean;
  small?: boolean;
}

export function Reel({ label, value, accent, spinning, small }: ReelProps) {
  return (
    <div className="relative">
      <div
        className="absolute -top-2 left-4 px-2 text-[10px] tracking-[0.25em] z-10"
        style={{ color: accent, backgroundColor: '#0a0510' }}
      >
        {label}
      </div>
      <div
        className="p-4 md:p-5 min-h-[72px] md:min-h-[88px] flex items-center transition-all duration-200"
        style={{
          border: `2px solid ${accent}`,
          boxShadow: spinning
            ? `0 0 24px ${accent}55, inset 0 0 24px ${accent}15`
            : `0 0 8px ${accent}20`,
          backgroundColor: spinning ? `${accent}08` : 'rgba(0,0,0,0.3)',
        }}
      >
        <div
          className={`leading-tight transition-all duration-100 ${
            spinning ? 'blur-[1.5px] opacity-80' : ''
          } ${small ? 'text-sm md:text-base' : 'text-base md:text-xl'}`}
          style={{ fontFamily: "'Bungee', cursive", color: accent }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
