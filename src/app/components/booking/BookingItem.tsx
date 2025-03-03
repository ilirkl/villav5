import React, { memo } from 'react';
import { Booking } from './Booking';
import { formatAmount, formatDate } from './Booking';

interface BookingItemProps {
  booking: Booking;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onInvoice: (booking: Booking) => void;
}

export const BookingItem = memo(({
  booking,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onInvoice,
}: BookingItemProps) => (
  <div
    className="border border-gray-200 rounded-xl p-4 hover:border-[#FF385C]/30 transition-all bg-white shadow-sm hover:shadow-md cursor-pointer"
    onClick={() => onToggleExpand(booking.id)}
  >
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      <div className="flex-1 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">{booking.guest_name}</h3>
        <p className="text-xl font-bold text-[#FF385C]">{formatAmount(booking.amount)}</p>
      </div>
      {expanded && (
        <div className="flex-1 space-y-3">
          {booking.notes && <p className="text-gray-600 text-sm italic">{booking.notes}</p>}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd><a href={`tel:${booking.guest_phone}`} className="text-blue-600 hover:underline">{booking.guest_phone}</a></dd>
            </div>
            <div>
              <dt className="text-gray-500">Dates & Times</dt>
              <dd>
                {formatDate(booking.start_date)} {booking.checkin_time && `at ${booking.checkin_time}`} –{' '}
                {formatDate(booking.end_date)} {booking.checkout_time && `at ${booking.checkout_time}`}
              </dd>
            </div>
          </dl>
          <div className="flex justify-end gap-2">
            <button onClick={(e) => { e.stopPropagation(); onInvoice(booking); }} className="p-2 hover:bg-gray-100 rounded-full" title="Generate Invoice">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(booking); }} className="p-2 hover:bg-gray-100 rounded-full" title="Edit booking">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(booking.id); }} className="p-2 hover:bg-red-50 rounded-full" title="Delete booking">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
));

BookingItem.displayName = 'BookingItem';