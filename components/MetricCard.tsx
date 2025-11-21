import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  colorClass: string;
  textColorClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, colorClass, textColorClass }) => {
  return (
    <div className={`${colorClass} p-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md`}>
      <p className={`text-sm font-medium opacity-80 ${textColorClass}`}>{title}</p>
      <p className={`text-3xl font-bold mt-1 ${textColorClass}`}>{value}</p>
    </div>
  );
};

export default MetricCard;