export interface Booking {
    id: number;
    start_date: string;
    end_date: string;
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
