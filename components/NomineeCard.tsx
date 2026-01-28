
import React from 'react';

interface NomineeCardProps {
  name: string;
  isSelected: boolean;
  onSelect: () => void;
}

const NomineeCard: React.FC<NomineeCardProps> = ({ name, isSelected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left p-6 md:p-8 border-2 transition-all duration-300 relative group overflow-hidden
        ${isSelected 
          ? 'bg-white text-black border-white z-10' 
          : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-white'}
      `}
    >
      <div className="flex justify-between items-center relative z-10">
        <span className="text-sm md:text-xl font-black uppercase tracking-tight leading-none max-w-[85%]">
          {name}
        </span>
        <div className={`
          flex-shrink-0 w-5 h-5 transition-all duration-500
          ${isSelected 
            ? 'bg-black scale-100 rotate-0' 
            : 'bg-transparent border border-zinc-700 scale-75 group-hover:scale-100 rotate-45 group-hover:rotate-0'}
        `} />
      </div>
      
      {/* Background Glitch Effect on Hover */}
      {!isSelected && (
        <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      )}
    </button>
  );
};

export default NomineeCard;
