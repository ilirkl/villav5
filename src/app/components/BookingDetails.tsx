const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

interface BookingDetailsProps {
    booking: {
        guest_name: string;
        guest_email: string;
        guest_phone: string;
        amount: number;
        prepayment: number;
        start_date: string;
        end_date: string;
        notes?: string;
    };
}

const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

const BookingDetails = ({ booking }: BookingDetailsProps) => {
    const remainingAmount = booking.amount - booking.prepayment;

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium text-gray-900">{booking.guest_name}</h3>
                <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{booking.guest_email}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{booking.guest_phone}</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Check-in</span>
                    <span className="text-sm text-gray-900">{formatDate(booking.start_date)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Check-out</span>
                    <span className="text-sm text-gray-900">{formatDate(booking.end_date)}</span>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Total Amount</span>
                    <span className="text-sm font-medium text-[#FF385C]">{formatAmount(booking.amount)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Prepayment</span>
                    <span className="text-sm text-gray-900">{formatAmount(booking.prepayment)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Remaining</span>
                    <span className="text-sm text-gray-900">{formatAmount(remainingAmount)}</span>
                </div>
            </div>

            {booking.notes && (
                <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{booking.notes}</p>
                </div>
            )}
        </div>
    );
};

export default BookingDetails;
