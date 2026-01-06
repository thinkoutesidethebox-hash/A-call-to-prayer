import React, { useEffect, useState } from 'react';
import { PRAYER_WINDOWS, PRAYER_NAMES_AR, getTodayStr } from '../constants';
import { PrayerStatus, PrayerType } from '../types';
import { hasPrayerTimePassed } from '../services/storageService';

interface PrayerCardProps {
  prayer: PrayerType;
  currentStatus: PrayerStatus;
  onUpdate: (status: PrayerStatus) => void;
  date: string;
  isAdmin?: boolean;
}

export const PrayerCard: React.FC<PrayerCardProps> = ({ prayer, currentStatus, onUpdate, date, isAdmin = false }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [windowText, setWindowText] = useState('');
  const [autoMissed, setAutoMissed] = useState(false);

  // Determine the window string for display
  const getWindowString = (p: PrayerType) => {
    const w = PRAYER_WINDOWS[p];
    const formatTime = (h: number, m: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    return `${formatTime(w.startHour, w.startMinute)} – ${formatTime(w.endHour, w.endMinute)}${w.crossesMidnight ? ' (Next Day)' : ''}`;
  };

  const checkState = () => {
    if (isAdmin) {
      setIsLocked(false);
      setAutoMissed(false);
      return;
    }

    const now = new Date(); // Only used for Time of Day
    const todayStr = getTodayStr(); // Dynamic Date Comparison

    // 1. Check if strictly missed (Time Passed) using robust logic from storageService
    if (hasPrayerTimePassed(date, prayer)) {
       setIsLocked(true);
       if (currentStatus === PrayerStatus.NONE) setAutoMissed(true);
       else setAutoMissed(false);
       return;
    }
    
    // 2. Check if future (Date is future)
    if (date > todayStr) {
       setIsLocked(true);
       setAutoMissed(false);
       return;
    }
    
    // 3. Current Window Check (Is it currently active?)
    const currentTotal = now.getHours() * 60 + now.getMinutes();
    const window = PRAYER_WINDOWS[prayer];
    const startTotal = window.startHour * 60 + window.startMinute;
    
    let isActive = false;
    
    if (date === todayStr) {
       if (currentTotal >= startTotal) isActive = true; 
    } else {
       // Yesterday (only reaches here if hasPrayerTimePassed is false => Isha in early morning)
       isActive = true;
    }
    
    setIsLocked(!isActive);
    setAutoMissed(false);
  };

  useEffect(() => {
    checkState();
    setWindowText(getWindowString(prayer));
    const interval = setInterval(checkState, 60000);
    return () => clearInterval(interval);
  }, [date, prayer, currentStatus, isAdmin]);

  const getStatusColor = (s: PrayerStatus) => {
    switch (s) {
      case PrayerStatus.ADAA: return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case PrayerStatus.QADA: return 'bg-amber-100 text-amber-800 border-amber-300';
      case PrayerStatus.MISSED: return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getStatusLabel = (s: PrayerStatus) => {
    switch (s) {
      case PrayerStatus.ADAA: return 'أداء';
      case PrayerStatus.QADA: return 'قضاء';
      default: return s;
    }
  };

  const renderButtons = () => (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <button 
        onClick={() => onUpdate(PrayerStatus.ADAA)}
        className="py-2 px-1 rounded-lg text-xs font-bold border bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm"
      >
        أداء
      </button>
      <button 
         onClick={() => onUpdate(PrayerStatus.QADA)}
         className="py-2 px-1 rounded-lg text-xs font-bold border bg-white text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm"
      >
        قضاء
      </button>
    </div>
  );

  const isLockedNow = isLocked;
  const isCompleted = currentStatus === PrayerStatus.ADAA || currentStatus === PrayerStatus.QADA;
  
  // Explicit Missed or Auto-Missed
  if (currentStatus === PrayerStatus.MISSED || autoMissed) {
    return (
      <div className={`p-4 rounded-xl border bg-rose-50 border-rose-200 shadow-sm transition-all`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg text-rose-800">{PRAYER_NAMES_AR[prayer]}</h3>
          <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            Missed
          </span>
        </div>
        <div className="text-center py-2">
           <p className="text-sm text-rose-600 font-medium">Time Window Passed</p>
           <p className="text-xs text-rose-400">-10 Points</p>
        </div>
        
        {!isAdmin && (
            <div className="mt-2">
                 <button 
                    onClick={() => onUpdate(PrayerStatus.QADA)}
                    className="w-full py-2 rounded-lg text-xs font-bold border bg-white text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm flex items-center justify-center gap-1"
                 >
                    <span>Make up (Qada)</span>
                 </button>
            </div>
        )}

        {isAdmin && renderButtons()}
      </div>
    );
  }

  // Completed State
  if (isCompleted) {
    return (
      <div className={`p-4 rounded-xl border ${getStatusColor(currentStatus)} shadow-sm transition-all`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">{PRAYER_NAMES_AR[prayer]}</h3>
          <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-white/50 border border-black/10">
            {getStatusLabel(currentStatus)}
          </span>
        </div>
        <div className="bg-white/40 rounded-lg p-3 text-center border border-black/5 flex flex-col items-center justify-center min-h-[80px]">
           <svg className="w-6 h-6 mb-1 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <p className="text-sm font-bold opacity-90">Saved</p>
        </div>
        {isAdmin && renderButtons()}
      </div>
    );
  }

  // Default State (Pending or Locked)
  return (
    <div className={`p-4 rounded-xl border bg-white border-slate-200 shadow-sm transition-all`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">{PRAYER_NAMES_AR[prayer]}</h3>
      </div>

      {isLockedNow ? (
        <div className="bg-slate-100 rounded-lg p-3 text-center border border-slate-200">
          <svg className="w-6 h-6 mx-auto text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs text-slate-500 font-semibold uppercase">Time Locked</p>
          <p className="text-xs text-slate-400 mt-1">{windowText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => onUpdate(PrayerStatus.ADAA)}
            className="py-3 px-1 rounded-lg text-sm font-bold border bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm"
          >
            أداء
          </button>
          <button 
             onClick={() => onUpdate(PrayerStatus.QADA)}
             className="py-3 px-1 rounded-lg text-sm font-bold border bg-white text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm"
          >
            قضاء
          </button>
        </div>
      )}
    </div>
  );
};