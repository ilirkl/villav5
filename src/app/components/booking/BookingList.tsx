import React, { useState } from 'react';
import { Booking } from './Booking';
import { BookingItem } from './BookingItem';

interface BookingListProps {
  bookings: Booking[];
  isLoading: boolean;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onInvoice: (booking: Booking) => void;
}

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  isLoading,
  onEdit,
  onDelete,
  onInvoice,
}) => {
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpandedBookingId(expandedBookingId === id ? null : id);

  return (
    <div className="space-y-4">
      {bookings.length === 0 && !isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No bookings found. Add your first booking!</p>
        </div>
      ) : (
        bookings.map((booking) => (
          <BookingItem
            key={booking.id}
            booking={booking}
            expanded={expandedBookingId === booking.id}
            onToggleExpand={toggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onInvoice={onInvoice}
          />
        ))
      )}
      {isLoading && <p className="text-center text-gray-500 py-4">Loading more bookings...</p>}
    </div>
  );
};