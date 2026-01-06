export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
}

export enum PrayerType {
  FAJR = 'Fajr',
  DHUHR = 'Dhuhr',
  ASR = 'Asr',
  MAGHRIB = 'Maghrib',
  ISHA = 'Isha'
}

export enum PrayerStatus {
  ADAA = 'Adaa',   // On time
  QADA = 'Qada',   // Late
  MISSED = 'Missed', // Missed completely (or not logged)
  NONE = 'None'    // Not yet acted upon
}

export interface DailyRecord {
  date: string; // ISO Date string YYYY-MM-DD
  prayers: {
    [key in PrayerType]: PrayerStatus;
  };
}

export interface StudentData {
  userId: string;
  records: Record<string, DailyRecord>; // Keyed by date string
}

export interface PrayerWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  crossesMidnight?: boolean;
}