import React from 'react';

interface CircularProgressProps { 
  percentage: number; 
  value: string | number; 
  subLabel?: string; 
  size?: number; 
  strokeWidth?: number; 
  colorClass: string; 
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  percentage, 
  value, 
  subLabel, 
  size = 120, 
  strokeWidth = 10, 
  colorClass 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-slate-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
        {subLabel && <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">{subLabel}</span>}
      </div>
    </div>
  );
};