export interface Booking {
    id: number;
    start_date: string;
    end_date: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    amount: number;
    prepayment: number;
    notes: string;
}
