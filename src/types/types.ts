export interface Booking {
    id: string;
    start_date: string;
    end_date: string;
    checkin_time?: string;
    checkout_time?: string;
    guest_name: string;
    guest_phone: string;
    amount: number;
    prepayment: number;
    notes: string;
    user_id?: string; // Optional, matches schema (NULL allowed, defaults to auth.uid())
    source: string; // Added field
}

export interface SeasonalPricing {
    id: number;
    start_date: string;
    end_date: string;
    monday_price: number;
    tuesday_price: number;
    wednesday_price: number;
    thursday_price: number;
    friday_price: number;
    saturday_price: number;
    sunday_price: number;
    created_at: string;
}

export interface Expense {
    id: string;
    date: string;
    category: string;
    amount: number;
    description: string;
    created_at: string;
    user_id: string;
    months: string[];
}

export interface profiles {
    id: number;
    created_at: string;
    updated_at: string;
    company_name: string;
    phone_number: string;
    email: string;
    address: string;
    instagram: string;
    logo_url: string;
    }