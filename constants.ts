import { PrayerType, User, UserRole, PrayerWindow } from './types';

// Mock Users
export const ADMIN_USER: User = {
  id: 'admin-001',
  username: 'admin',
  name: 'Head Teacher',
  role: UserRole.ADMIN,
  password: 'admin123'
};

// Start with no students (Admin adds them manually)
export const STUDENTS: User[] = [];

export const ALL_USERS = [ADMIN_USER, ...STUDENTS];

// Global Date Simulation - Uses current local date
export const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const SIMULATED_TODAY = getTodayStr();

// Prayer Input Windows
// Subh (Fajr): 05:00 AM – 07:30 AM
// Dhuhr: 12:30 PM – 06:25 PM
// Asr: 04:00 PM – 06:25 PM
// Maghrib: 06:15 PM – 07:30 PM
// Isha: 07:30 PM – 05:00 AM (Next Day)

export const PRAYER_WINDOWS: Record<PrayerType, PrayerWindow> = {
  [PrayerType.FAJR]: { startHour: 5, startMinute: 0, endHour: 7, endMinute: 30 },
  [PrayerType.DHUHR]: { startHour: 12, startMinute: 30, endHour: 18, endMinute: 25 },
  [PrayerType.ASR]: { startHour: 16, startMinute: 0, endHour: 18, endMinute: 25 },
  [PrayerType.MAGHRIB]: { startHour: 18, startMinute: 15, endHour: 19, endMinute: 30 },
  [PrayerType.ISHA]: { startHour: 19, startMinute: 30, endHour: 5, endMinute: 0, crossesMidnight: true },
};

export const PRAYER_ORDER = [
  PrayerType.FAJR,
  PrayerType.DHUHR,
  PrayerType.ASR,
  PrayerType.MAGHRIB,
  PrayerType.ISHA
];

export const PRAYER_NAMES_AR: Record<PrayerType, string> = {
  [PrayerType.FAJR]: 'الفجر',
  [PrayerType.DHUHR]: 'الظهر',
  [PrayerType.ASR]: 'العصر',
  [PrayerType.MAGHRIB]: 'المغرب',
  [PrayerType.ISHA]: 'العشاء'
};

export const SCORING = {
  [PrayerType.FAJR]: { adaa: 10, qada: 5, missed: -10 },
  DEFAULT: { adaa: 10, qada: 5, missed: -10 }
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];