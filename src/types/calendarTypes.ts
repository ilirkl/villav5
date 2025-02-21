// calendarTypes.ts
export interface Booking {
    id: number;
    start_date: string; // ISO date string (e.g., "2025-02-20")
    end_date: string;   // ISO date string
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    amount: number;
    prepayment: number;
    notes: string;
  }
  
  export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    borderColor: string;
    classNames: string[];
    allDay: boolean;
    extendedProps: Booking;
  }
  
  export interface TitleFormatArg {
    start: {
      month: number; // 0–11 (zero-based)
      year: number;
      day: number;   // 1–31
    };
    end?: {
      month: number;
      year: number;
      day: number;
    };
  }