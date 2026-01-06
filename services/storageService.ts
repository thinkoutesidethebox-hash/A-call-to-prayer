import { DailyRecord, PrayerStatus, PrayerType, StudentData, User } from '../types';
import { ALL_USERS, PRAYER_WINDOWS, SCORING, getTodayStr } from '../constants';

const DATA_STORAGE_KEY = 'nooralqalb_data_v2';
const USER_STORAGE_KEY = 'nooralqalb_users_v2';

// --- User Management ---

export const getUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) {
      // Initialize with default constants if storage is empty
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(ALL_USERS));
      return ALL_USERS;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load users from storage", e);
    return ALL_USERS;
  }
};

export const addUser = (newUser: User): User[] => {
  try {
    const users = getUsers();
    users.push(newUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    return users;
  } catch (e) {
    console.error("Failed to add user", e);
    return [];
  }
};

// --- Prayer Data Management ---

export const getStoredData = (): Record<string, StudentData> => {
  try {
    const data = localStorage.getItem(DATA_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to load data", e);
    return {};
  }
};

export const saveStoredData = (data: Record<string, StudentData>) => {
  try {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
    alert("Warning: Failed to save your progress. Your device storage might be full or disabled.");
  }
};

export const getStudentData = (studentId: string): StudentData => {
  const allData = getStoredData();
  if (!allData[studentId]) {
    // Initialize if empty
    allData[studentId] = { userId: studentId, records: {} };
    saveStoredData(allData);
  }
  return allData[studentId];
};

export const updatePrayerStatus = (
  studentId: string,
  date: string,
  prayer: PrayerType,
  status: PrayerStatus
) => {
  const allData = getStoredData();
  
  if (!allData[studentId]) {
    allData[studentId] = { userId: studentId, records: {} };
  }
  
  if (!allData[studentId].records[date]) {
    allData[studentId].records[date] = {
      date,
      prayers: {
        [PrayerType.FAJR]: PrayerStatus.NONE,
        [PrayerType.DHUHR]: PrayerStatus.NONE,
        [PrayerType.ASR]: PrayerStatus.NONE,
        [PrayerType.MAGHRIB]: PrayerStatus.NONE,
        [PrayerType.ISHA]: PrayerStatus.NONE,
      }
    };
  }

  // Ensure deep structure exists (in case of partial corruption)
  if (!allData[studentId].records[date].prayers) {
    allData[studentId].records[date].prayers = {
        [PrayerType.FAJR]: PrayerStatus.NONE,
        [PrayerType.DHUHR]: PrayerStatus.NONE,
        [PrayerType.ASR]: PrayerStatus.NONE,
        [PrayerType.MAGHRIB]: PrayerStatus.NONE,
        [PrayerType.ISHA]: PrayerStatus.NONE,
    };
  }

  allData[studentId].records[date].prayers[prayer] = status;
  saveStoredData(allData);
  return allData[studentId];
};

export const resetStudentData = (studentId: string) => {
  const allData = getStoredData();
  allData[studentId] = { userId: studentId, records: {} };
  saveStoredData(allData);
};

// Helper for local date string
const getLocalDateStr = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const hasPrayerTimePassed = (dateStr: string, prayer: PrayerType): boolean => {
  const now = new Date(); // Used for Time of Day
  const todayStr = getTodayStr(); // Dynamic Date
  
  // Future dates have not passed
  if (dateStr > todayStr) return false; 

  const window = PRAYER_WINDOWS[prayer];
  const currentTotal = now.getHours() * 60 + now.getMinutes();
  const endTotal = window.endHour * 60 + window.endMinute;

  // If calculating for Today
  if (dateStr === todayStr) {
     if (window.crossesMidnight) return false; // Ends tomorrow morning
     return currentTotal > endTotal;
  }
  
  // If calculating for Past Date
  if (dateStr < todayStr) {
     // Check for Yesterday's Isha (which might still be active in early morning)
     if (window.crossesMidnight) {
         // Create a date object for "Yesterday" relative to Today
         const yesterday = new Date(); 
         yesterday.setDate(yesterday.getDate() - 1);
         if (getLocalDateStr(yesterday) === dateStr) {
             // If we are currently before the end time (e.g. 04:00 < 05:00)
             if (currentTotal <= endTotal) return false;
         }
     }
     return true;
  }
  
  return false;
};

export const calculateDayScore = (record: DailyRecord | undefined, dateStr: string) => {
  let totalPoints = 0;
  let maxPoints = 0;
  const breakdown: { prayer: string, status: string, points: number }[] = [];

  Object.values(PrayerType).forEach(prayer => {
      // Determine Status
      let status = PrayerStatus.NONE;
      if (record && record.prayers[prayer]) {
        status = record.prayers[prayer];
      }
      
      // Check if missed (either explicit or implicit)
      let effectiveStatus = status;
      if (status === PrayerStatus.NONE && hasPrayerTimePassed(dateStr, prayer)) {
        effectiveStatus = PrayerStatus.MISSED;
      }
      
      const isPassed = hasPrayerTimePassed(dateStr, prayer);
      const isLogged = status !== PrayerStatus.NONE;
      
      // Calculate only if the event has happened (passed or logged)
      if (isPassed || isLogged) {
         const scoreRules = SCORING[prayer] || SCORING.DEFAULT;
         maxPoints += scoreRules.adaa; // Max possible is Adaa

         let points = 0;
         if (effectiveStatus === PrayerStatus.ADAA) points = scoreRules.adaa;
         else if (effectiveStatus === PrayerStatus.QADA) points = scoreRules.qada;
         else if (effectiveStatus === PrayerStatus.MISSED) points = scoreRules.missed;

         totalPoints += points;
         
         breakdown.push({
             prayer,
             status: effectiveStatus,
             points
         });
      }
  });

  if (maxPoints === 0) return { total: 0, max: 0, percentage: 100, scoreOutOf10: 10, breakdown: [] };
  
  // Calculate percentage, ensuring we don't return negative percentages for the UI bar (though points can be negative)
  const percentage = Math.max(0, Math.round((totalPoints / maxPoints) * 100));
  const scoreOutOf10 = percentage / 10;

  return {
    total: totalPoints,
    max: maxPoints,
    percentage,
    scoreOutOf10,
    breakdown
  };
};

export const calculateScore = (records: Record<string, DailyRecord>, monthIdx: number, year: number): { total: number, max: number, percentage: number, scoreOutOf10: number } => {
  let totalPoints = 0;
  let maxPoints = 0;
  
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const todayStr = getTodayStr();
  
  // Iterate from day 1 to daysInMonth
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Stop if we are looking at future dates (beyond today)
    if (dateStr > todayStr) break;
    
    // Reuse logic via calculateDayScore, but accumulate manually to get true total
    const dayScore = calculateDayScore(records[dateStr], dateStr);
    totalPoints += dayScore.total;
    maxPoints += dayScore.max;
  }

  if (maxPoints === 0) return { total: 0, max: 0, percentage: 100, scoreOutOf10: 10 };

  const percentage = Math.max(0, Math.round((totalPoints / maxPoints) * 100));
  const scoreOutOf10 = percentage / 10;

  return {
    total: totalPoints,
    max: maxPoints,
    percentage,
    scoreOutOf10
  };
};

export const calculatePrayerStats = (data: StudentData, startDate: string, endDate: string) => {
  const stats = {
    total: { adaa: 0, qada: 0, missed: 0 },
    byPrayer: {} as Record<PrayerType, { adaa: number, qada: number, missed: number }>
  };
  
  // Initialize byPrayer
  Object.values(PrayerType).forEach(p => {
    stats.byPrayer[p] = { adaa: 0, qada: 0, missed: 0 };
  });

  // Start at noon to avoid timezone issues when incrementing days
  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  const current = new Date(start);

  const todayStr = getTodayStr();

  while (current <= end) {
      const dateStr = getLocalDateStr(current);
      
      // Stop if date is in the future
      if (dateStr > todayStr) break;

      const record = data.records[dateStr];

      Object.values(PrayerType).forEach(prayer => {
          let status = PrayerStatus.NONE;
          if (record && record.prayers[prayer]) status = record.prayers[prayer];
          
          // Check implicit miss
          if (status === PrayerStatus.NONE && hasPrayerTimePassed(dateStr, prayer)) {
              status = PrayerStatus.MISSED;
          }

          if (status === PrayerStatus.ADAA) {
              stats.total.adaa++;
              stats.byPrayer[prayer].adaa++;
          } else if (status === PrayerStatus.QADA) {
              stats.total.qada++;
              stats.byPrayer[prayer].qada++;
          } else if (status === PrayerStatus.MISSED) {
              stats.total.missed++;
              stats.byPrayer[prayer].missed++;
          }
      });

      // Increment day
      current.setDate(current.getDate() + 1);
  }
  
  return stats;
};

// --- Risk Analysis ---

export const checkStudentRisk = (studentId: string): { isAtRisk: boolean; days: number } => {
  const data = getStudentData(studentId);
  let consecutiveMissed = 0;
  const todayStr = getTodayStr();
  const now = new Date(todayStr);
  
  // Look back up to 14 days (arbitrary limit for "consecutive")
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    
    const record = data.records[dateStr];
    
    // Logic: If NO prayer is Adaa or Qada on this day, count as inactive/missed day
    // This assumes that if no record exists, they didn't log, thus missed.
    // If record exists but all are Missed/None, they missed.
    
    let hasPerformance = false;
    if (record) {
      hasPerformance = Object.values(record.prayers).some(
        s => s === PrayerStatus.ADAA || s === PrayerStatus.QADA
      );
    }
    
    if (!hasPerformance) {
      consecutiveMissed++;
    } else {
      break; // Streak of missing days ended here
    }
  }
  
  // Trigger if 3 or more consecutive days missed
  return {
    isAtRisk: consecutiveMissed >= 3,
    days: consecutiveMissed
  };
};