export interface Booking {
    id: number;
    start_date: string;
    end_date: string;
    checkin_time: string; 
    checkout_time: string; 
    guest_name: string;
    guest_phone: string;
    amount: number;
    prepayment: number;
    notes: string;
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

export interface expenses {
    id: number;
    date: string;
    end_date: string;
    description: string;
    amount: number;
    cateogry: string;
    created_at: string;
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