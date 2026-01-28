
import React from 'react';
import NomineeCard from './NomineeCard';

interface CategorySectionProps {
  categoryName: string;
  nominees: string[];
  selectedNominee: string | undefined;
  onSelect: (nominee: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  categoryName, 
  nominees, 
  selectedNominee, 
  onSelect 
}) => {
  return (
    <section className="mb-32 scroll-mt-32">
      <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6 mb-10 pb-4">
        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none">
          {categoryName}
        </h2>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${selectedNominee ? 'bg-green-500' : 'bg-zinc-800 animate-pulse'}`} />
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedNominee ? 'text-white' : 'text-zinc-700'}`}>
            {selectedNominee ? 'Complete' : 'Vote Required'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900 border-zinc-900 border">
        {nominees.map((nominee) => (
          <NomineeCard
            key={nominee}
            name={nominee}
            isSelected={selectedNominee === nominee}
            onSelect={() => onSelect(nominee)}
          />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
