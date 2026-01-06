import React, { useState, useEffect } from 'react';
import { PrayerType, PrayerStatus, DailyRecord, StudentData } from '../types';
import { PRAYER_ORDER, MONTH_NAMES, PRAYER_NAMES_AR, getTodayStr } from '../constants';
import { getStudentData, updatePrayerStatus, calculateScore, calculateDayScore, hasPrayerTimePassed } from '../services/storageService';
import { PrayerCard } from './PrayerCard';
import { Button } from './Button';
import { generateSpiritualReport } from '../services/geminiService';
import { CircularProgress } from './CircularProgress';

interface PrayerBoardProps {
  studentId: string;
  studentName: string;
  isAdmin?: boolean;
}

export const PrayerBoard: React.FC<PrayerBoardProps> = ({ studentId, studentName, isAdmin = false }) => {
  const [data, setData] = useState<StudentData | null>(null);
  
  // Initialize with Session Storage check to persist view on refresh
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const saved = sessionStorage.getItem(`last_viewed_date_${studentId}`);
    return saved || getTodayStr();
  });

  const [reportLoading, setReportLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const d = getStudentData(studentId);
    setData(d);
  }, [studentId]);

  // Persist selected date when it changes
  useEffect(() => {
    sessionStorage.setItem(`last_viewed_date_${studentId}`, selectedDate);
  }, [selectedDate, studentId]);

  const handleUpdatePrayer = (prayer: PrayerType, status: PrayerStatus) => {
    if (!data) return;
    const newData = updatePrayerStatus(studentId, selectedDate, prayer, status);
    setData({ ...newData });
  };

  const getRecordForDate = (date: string): DailyRecord | undefined => {
    return data?.records[date];
  };

  const currentRecord = getRecordForDate(selectedDate);

  const currentMonthIdx = new Date(selectedDate).getMonth();
  const currentYear = new Date(selectedDate).getFullYear();
  const monthlyScore = data ? calculateScore(data.records, currentMonthIdx, currentYear) : { total: 0, max: 0, percentage: 0, scoreOutOf10: 0 };
  
  const dailyScore = calculateDayScore(currentRecord, selectedDate);

  const getMotivation = (percentage: number) => {
    if (percentage === 100) return "Perfect! MashaAllah!";
    if (percentage >= 80) return "Excellent work! Keep it up.";
    if (percentage >= 50) return "Good effort. Keep improving.";
    return "Don't give up. Every prayer counts.";
  };

  const handleGenerateReport = async () => {
    if (!data) return;
    setReportLoading(true);
    
    const startOfMonth = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
    const endOfMonth = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    try {
      const text = await generateSpiritualReport(
        studentName, 
        data, 
        startOfMonth, 
        endOfMonth, 
        isAdmin
      );
      setReportText(text);
      setShowReportModal(true);
    } catch (e) {
      alert("Failed to generate report. Ensure API Key is set.");
    } finally {
      setReportLoading(false);
    }
  };

  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentYear, currentMonthIdx, i + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    const rec = data?.records[localDateStr];
    
    let adaa = 0;
    let qada = 0;
    let missed = 0;

    PRAYER_ORDER.forEach(p => {
       let status = PrayerStatus.NONE;
       if (rec && rec.prayers[p]) status = rec.prayers[p];

       if (status === PrayerStatus.NONE && hasPrayerTimePassed(localDateStr, p)) {
         status = PrayerStatus.MISSED;
       }

       if (status === PrayerStatus.ADAA) adaa++;
       else if (status === PrayerStatus.QADA) qada++;
       else if (status === PrayerStatus.MISSED) missed++;
    });

    const total = adaa + qada + missed;
    
    let statusColor = 'bg-slate-100 text-slate-400 hover:bg-slate-200'; 
    if (total > 0) {
       if (missed > 0) statusColor = 'bg-rose-400 text-white';
       else if (qada > 0) statusColor = 'bg-amber-400 text-white';
       else if (adaa > 0) statusColor = 'bg-emerald-500 text-white'; 
    }

    return { day: i + 1, dateStr: localDateStr, statusColor };
  });

  return (
    <div className="flex-1 w-full">
        {/* Date Selector */}
        <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">
               {MONTH_NAMES[currentMonthIdx]} {currentYear}
            </h2>
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
             />
        </div>

        {/* Prayer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRAYER_ORDER.map(p => (
                    <PrayerCard 
                      key={p}
                      prayer={p}
                      date={selectedDate}
                      currentStatus={currentRecord?.prayers[p] || PrayerStatus.NONE}
                      onUpdate={(s) => handleUpdatePrayer(p, s)}
                      isAdmin={isAdmin}
                    />
                ))}
            </div>
            
            {/* Sidebar / Stats */}
            <div className="flex flex-col gap-6">
                
                {/* Score Summary Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-6">
                   
                   {/* Daily Score */}
                   <div>
                       <h3 className="font-bold text-slate-700 mb-2 border-b pb-2 flex justify-between items-center">
                         <span>Daily Score</span>
                         <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{selectedDate}</span>
                       </h3>
                       
                       <div className="flex flex-col items-center justify-center py-4">
                          <CircularProgress 
                             percentage={dailyScore.percentage}
                             value={dailyScore.total}
                             subLabel="Points"
                             colorClass={getColorClass(dailyScore.percentage)}
                             size={140}
                          />
                          <p className={`text-sm font-medium mt-3 ${getColorClass(dailyScore.percentage).replace('text-', 'text-opacity-90 text-')}`}>
                              {getMotivation(dailyScore.percentage)}
                          </p>
                       </div>
                       
                       {/* Point Breakdown */}
                       <div className="mt-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Point Breakdown</p>
                          <div className="space-y-2">
                              {dailyScore.breakdown.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic text-center">No active prayers logged yet.</p>
                              ) : (
                                  dailyScore.breakdown.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-sm">
                                          <div className="flex items-center gap-2">
                                              <span className={`w-2 h-2 rounded-full ${item.status === PrayerStatus.ADAA ? 'bg-emerald-500' : item.status === PrayerStatus.QADA ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                                              <span className="text-slate-700 font-medium">{PRAYER_NAMES_AR[item.prayer as PrayerType]} <span className="text-xs font-normal text-slate-400 opacity-75">({item.status})</span></span>
                                          </div>
                                          <span className={`font-bold ${item.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                              {item.points > 0 ? '+' : ''}{item.points}
                                          </span>
                                      </div>
                                  ))
                              )}
                          </div>
                       </div>
                   </div>

                   {/* Monthly Score */}
                   <div>
                       <h3 className="font-bold text-slate-700 mb-2 border-b pb-2">Monthly Score</h3>
                       <div className="flex flex-col items-center justify-center py-4">
                          <CircularProgress 
                             percentage={monthlyScore.percentage}
                             value={monthlyScore.scoreOutOf10}
                             subLabel="/ 10"
                             colorClass={getColorClass(monthlyScore.percentage)}
                             size={120}
                          />
                          <div className="text-center mt-3">
                              <p className="text-xs text-slate-400">Total Points Accumalated</p>
                              <p className="text-lg font-bold text-slate-800">{monthlyScore.total}</p>
                          </div>
                       </div>
                   </div>

                   <Button onClick={handleGenerateReport} isLoading={reportLoading} className="w-full text-sm">
                     View AI Report
                   </Button>
                </div>

                {/* Mini Calendar Visualization */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-4">Calendar Overview</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((d) => (
                           <div 
                              key={d.day} 
                              onClick={() => setSelectedDate(d.dateStr)}
                              className={`
                                aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer 
                                transition-all duration-200 ease-out 
                                ${d.statusColor} 
                                ${selectedDate === d.dateStr 
                                    ? 'ring-2 ring-offset-2 ring-slate-800 shadow-lg scale-110 z-10' 
                                    : 'hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-slate-200'
                                }
                              `}
                           >
                             {d.day}
                           </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
           <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Spiritual Mentor's Report</h3>
              <div className="prose prose-slate prose-sm mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                 {reportText?.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line.replace(/\*\*/g, '')}</p>
                 ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowReportModal(false)}>Close</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};