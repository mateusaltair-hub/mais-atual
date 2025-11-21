import React from 'react';
import { GroupingItem } from '../types';

interface BreakdownListProps {
  items: GroupingItem[];
}

const BreakdownList: React.FC<BreakdownListProps> = ({ items }) => {
  if (items.length === 0) {
    return <p className="text-gray-500">Aguardando dados...</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <div key={index} className="bg-gray-700 p-3 rounded-xl border-l-4 border-primary shadow-sm hover:shadow-md transition duration-150">
          <p className="text-xs font-medium text-gray-300 truncate" title={item.description}>{item.description}</p>
          <div className="flex items-baseline mt-1">
            <span className="text-xl font-bold text-white">{item.count.toLocaleString('pt-BR')}</span>
            <span className="text-sm font-normal text-gray-400 ml-2">({item.percentage}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BreakdownList;