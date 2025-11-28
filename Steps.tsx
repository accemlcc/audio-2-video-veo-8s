import React from 'react';
import { AppStatus } from '../types';

interface StepsProps {
  status: AppStatus;
}

const Steps: React.FC<StepsProps> = ({ status }) => {
  const steps = [
    { id: AppStatus.IDLE, label: 'Upload' },
    { id: AppStatus.ANALYZING, label: 'Analyze' },
    { id: AppStatus.REVIEW, label: 'Prompt' },
    { id: AppStatus.GENERATING, label: 'Generate' },
    { id: AppStatus.COMPLETED, label: 'Result' },
  ];

  const getStatusIndex = (s: AppStatus) => {
     if (s === AppStatus.ERROR) return 0;
     return steps.findIndex(step => step.id === s);
  };
  
  const currentIndex = getStatusIndex(status);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between w-full max-w-3xl mx-auto relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-800 -z-10" />
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-500 transition-all duration-500 -z-10" 
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
        
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-900 px-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300
                ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}
                ${isCurrent ? 'ring-4 ring-indigo-500/20 scale-110' : ''}
              `}>
                {index + 1}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Steps;