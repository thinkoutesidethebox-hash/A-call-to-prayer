import { GoogleGenAI } from "@google/genai";
import { StudentData, PrayerStatus, PrayerType } from "../types";
import { hasPrayerTimePassed } from "./storageService";
import { PRAYER_NAMES_AR, getTodayStr } from "../constants";

export const generateSpiritualReport = async (
  studentName: string, 
  data: StudentData, 
  startDate: string, 
  endDate: string, 
  isForAdmin: boolean = false
) => {
  // Initialize the GoogleGenAI client with the API key from environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Helper to format date as YYYY-MM-DD
  const formatDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayStr();

  // Initialize detailed stats
  const prayerStats: Record<string, { adaa: number, qada: number, missed: number }> = {
    [PrayerType.FAJR]: { adaa: 0, qada: 0, missed: 0 },
    [PrayerType.DHUHR]: { adaa: 0, qada: 0, missed: 0 },
    [PrayerType.ASR]: { adaa: 0, qada: 0, missed: 0 },
    [PrayerType.MAGHRIB]: { adaa: 0, qada: 0, missed: 0 },
    [PrayerType.ISHA]: { adaa: 0, qada: 0, missed: 0 },
  };

  let totalAdaa = 0;
  let totalQada = 0;
  let totalMissed = 0;

  // Create date objects for iteration (assuming input is YYYY-MM-DD)
  // We use noon to avoid timezone rolling issues when adding days
  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  const current = new Date(start);

  // Iterate through date range
  while (current <= end) {
    const dateStr = formatDate(current);
    
    // Stop if we reach future days
    if (dateStr > todayStr) break;

    const record = data.records[dateStr];

    Object.values(PrayerType).forEach(prayer => {
       let status = PrayerStatus.NONE;
       if (record && record.prayers[prayer]) {
           status = record.prayers[prayer];
       }

       // Determine effective status (Auto-Missed logic)
       let effectiveStatus = status;
       if (status === PrayerStatus.NONE && hasPrayerTimePassed(dateStr, prayer)) {
           effectiveStatus = PrayerStatus.MISSED;
       }

       if (prayerStats[prayer]) {
           if (effectiveStatus === PrayerStatus.ADAA) {
               prayerStats[prayer].adaa++;
               totalAdaa++;
           } else if (effectiveStatus === PrayerStatus.QADA) {
               prayerStats[prayer].qada++;
               totalQada++;
           } else if (effectiveStatus === PrayerStatus.MISSED) {
               prayerStats[prayer].missed++;
               totalMissed++;
           }
       }
    });

    // Increment day
    current.setDate(current.getDate() + 1);
  }

  // Create a formatted string for the specific prayer breakdown
  let breakdownString = "";
  Object.entries(prayerStats).forEach(([prayer, stats]) => {
      const arabicName = PRAYER_NAMES_AR[prayer as PrayerType] || prayer;
      breakdownString += `- **${arabicName}** (${prayer}): Adaa (${stats.adaa}), Qada (${stats.qada}), Missed (${stats.missed})\n`;
  });

  const prompt = `
    You are a compassionate and wise spiritual mentor for students.
    Student Name: ${studentName}
    Period: ${startDate} to ${endDate}
    ${isForAdmin ? '(This report is for the Admin/Teacher view)' : ''}
    
    Overall Summary:
    - Total Prayers On Time (Adaa): ${totalAdaa}
    - Total Prayers Late (Qada): ${totalQada}
    - Total Prayers Missed: ${totalMissed}

    Detailed Breakdown by Prayer:
    ${breakdownString}

    Please generate a comprehensive spiritual progress report (max ${isForAdmin ? '300' : '200'} words).
    
    Structure:
    ${isForAdmin ? '1. **Statistical Breakdown**: Create a bulleted list showing the Adaa, Qada, and Missed counts for each prayer (Fajr, Dhuhr, Asr, Maghrib, Isha) based on the provided breakdown.' : ''}
    ${isForAdmin ? '2' : '1'}. **Detailed Analysis**: Discuss their performance. Specifically mention which prayers they are maintaining well and which ones (e.g., Fajr or Isha) they are struggling with based on the breakdown.
    ${isForAdmin ? '3' : '2'}. **Specific Advice**: Provide targeted advice based on their specific weak points (e.g., if Fajr is missed often, suggest sleeping earlier).
    ${isForAdmin ? '4' : '3'}. **Encouragement**: End with a motivating Dua or quote (in English) relevant to consistency.

    Tone: Gentle, inspiring, non-judgmental, and constructive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Ensure we always return a string, even if text is undefined
    return response.text || "No report generated.";
  } catch (error) {
    console.error("Error generating report:", error);
    throw new Error("Failed to generate report. Please try again later.");
  }
};