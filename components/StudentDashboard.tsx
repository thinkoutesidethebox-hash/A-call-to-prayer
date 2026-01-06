import React, { useState, useEffect } from 'react';
import { User, StudentData } from '../types';
import { getStudentData, calculateScore } from '../services/storageService';
import { getTodayStr } from '../constants';
import { Button } from './Button';
import { PrayerBoard } from './PrayerBoard';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const [data, setData] = useState<StudentData | null>(null);

  // Helper to trigger re-renders if needed (PrayerBoard manages its own state, but header needs sync)
  useEffect(() => {
    const loadData = () => {
      const d = getStudentData(user.id);
      setData(d);
    };
    loadData();
    // Refresh header data every few seconds to catch updates from PrayerBoard
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [user.id]);

  const todayStr = getTodayStr();
  const simulatedDate = new Date(todayStr);
  const currentMonthIdx = simulatedDate.getMonth();
  const currentYear = simulatedDate.getFullYear();
  const monthlyScore = data ? calculateScore(data.records, currentMonthIdx, currentYear) : { total: 0, max: 0, percentage: 0, scoreOutOf10: 0 };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm z-10 p-4 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
             <svg className="w-6 h-6 transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
             </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-serif">A Call to Prayer</h1>
            <p className="text-xs text-slate-500">Welcome, {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
             <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Month</p>
             <p className={`text-lg font-bold ${monthlyScore.percentage >= 80 ? 'text-emerald-600' : monthlyScore.percentage >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
               {monthlyScore.scoreOutOf10} <span className="text-sm text-slate-400 font-normal">/ 10</span>
             </p>
           </div>
           <Button variant="ghost" onClick={onLogout}>Logout</Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full">
         <PrayerBoard studentId={user.id} studentName={user.name} isAdmin={false} />
      </main>
    </div>
  );
};