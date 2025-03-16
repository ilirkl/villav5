"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import Modal from '../Modal';
import BookingForm from '../booking/BookingForm';
import BookingInvoice from './BookingInvoice';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

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
  user_id?: string;
  source: string;
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Booking = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 10;

  // Memoize fetchBookings without including offset in dependencies so that it doesn't change unnecessarily.
  const fetchBookings = useCallback(
    async (reset = false) => {
        if (!reset && (!hasMore || isLoading)) {
            return;
          }

      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;
      


      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const userId = session.user.id;

      try {
        let query = supabase
          .from('bookings')
          .select(
            'id, start_date, end_date, checkin_time, checkout_time, guest_name, guest_phone, amount, prepayment, notes, user_id, source'
          )
          .eq('user_id', userId)
          .range(currentOffset, currentOffset + limit - 1);

        if (startDate) query = query.gte('start_date', startDate);
        if (endDate) query = query.lte('end_date', endDate);
        if (sourceFilter) query = query.eq('source', sourceFilter);

        switch (sortBy) {
          case 'date':
            query = query.order('start_date', { ascending: sortOrder === 'asc' });
            break;
         }

        const { data, error } = await query;
        if (error) throw error;

        const fetchedBookings = data as Booking[];

        setBookings((prev) => {
          if (reset) {
            return fetchedBookings;
          }
          const newBookings = fetchedBookings.filter(
            (newBooking) => !prev.some((existing) => existing.id === newBooking.id)
          );
          return [...prev, ...newBookings];
        });

        setOffset((prev) => (reset ? limit : prev + limit));
        setHasMore(fetchedBookings.length === limit);
       
      } catch (error) {
        console.error('Error fetching bookings:', error);
        alert('Error loading bookings. Please try again.');
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    },
    // Only include dependencies that should trigger a new fetch
    [startDate, endDate, sourceFilter, sortBy, sortOrder, offset, hasMore, isLoading]
  );

  // Reset effect when filters change (we intentionally exclude fetchBookings to avoid a loop)
  useEffect(() => {
    setBookings([]);
    setOffset(0);
    setHasMore(true);
    fetchBookings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, sourceFilter, sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    fetchBookings(true);
  }, []); // Run once on mount

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
        hasMore &&
        !isLoading
      ) {
        fetchBookings();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, fetchBookings]);

  // Other handlers (handleBookingSuccess, handleEdit, handleAdd, handleDelete, handleInvoice, handleSort, toggleExpand)
  const handleBookingSuccess = async (newBooking: Omit<Booking, 'id'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Please log in to save a booking.');
      return;
    }

    const otherBookings =
      modalMode === 'edit' && selectedBooking
        ? bookings.filter((b) => b.id !== selectedBooking.id)
        : bookings;

    const hasOverlap = otherBookings.some((booking) => {
      const existingStart = new Date(booking.start_date);
      const existingEnd = new Date(booking.end_date);
      const newStart = new Date(newBooking.start_date);
      const newEnd = new Date(newBooking.end_date);
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasOverlap) {
      alert('The selected dates are already booked. Please choose different dates.');
      return;
    }

    setIsModalOpen(false);
    setSelectedBooking(null);
    fetchBookings(true);
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedBooking(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      fetchBookings(true);
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking. Please try again.');
    }
  };

  const handleInvoice = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsInvoiceModalOpen(true);
  };

  const handleSort = (newSortBy: 'date' | 'name' | 'amount') => {
    if (sortBy === newSortBy) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
    } else {
      console.log(`Changing sort to ${newSortBy} with order asc`);
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Filter inputs and sort buttons */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded p-2 text-sm focus:ring-[#FF385C] focus:border-[#FF385C]"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded p-2 text-sm focus:ring-[#FF385C] focus:border-[#FF385C]"
          />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border border-gray-300 rounded p-2 text-sm focus:ring-[#FF385C] focus:border-[#FF385C]"
          >
            <option value="">All Sources</option>
            <option value="Direkt">Direkt</option>
            <option value="Airbnb">Airbnb</option>
            <option value="Booking">Booking</option>
          </select>
          <button
            onClick={() => handleSort('date')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'date' ? 'bg-[#FF385C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Data {sortBy === 'date' && (sortOrder === 'asc' ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />)}
          </button>
        </div>
      </div>

      {/* Add booking button */}
      <button
        onClick={handleAdd}
        className="fixed bottom-20 right-4 sm:right-8 z-30 w-14 h-14 bg-[#FF385C] rounded-full flex items-center justify-center shadow-lg hover:bg-[#FF385C]/90 transition-colors"
      >
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Booking list */}
      <div className="space-y-4">
        {bookings.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No bookings found. Add your first booking!</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-[#FF385C]/30 transition-all bg-white shadow-sm hover:shadow-md cursor-pointer"
              onClick={() => toggleExpand(booking.id)}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">{booking.guest_name}</h3>
                  <p className="text-xl font-bold text-[#FF385C]">{formatAmount(booking.amount)}</p>
                </div>
                {expandedBookingId === booking.id && (
                  <div className="flex-1 space-y-3">
                    {booking.notes && <p className="text-gray-600 text-sm italic">{booking.notes}</p>}
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Burimi</span>
                          <span className="text-sm text-gray-900">{booking.source}</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <dt className="text-gray-500">Phone</dt>
                          <dd>
                            <a href={`tel:${booking.guest_phone}`} className="text-blue-600 hover:underline">
                              {booking.guest_phone}
                            </a>
                          </dd>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <dt className="text-gray-500">Dates & Times</dt>
                          <dd>
                            {formatDate(booking.start_date)}{' '}
                            {booking.checkin_time && `at ${booking.checkin_time}`} –{' '}
                            {formatDate(booking.end_date)}{' '}
                            {booking.checkout_time && `at ${booking.checkout_time}`}
                          </dd>
                        </div>
                      </div>
                    </dl>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvoice(booking);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Generate Invoice"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(booking);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Edit booking"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(booking.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete booking"
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && <p className="text-center text-gray-500 py-4">Loading more bookings...</p>}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBooking(null);
        }}
        title={modalMode === 'edit' ? 'Ndrysho Rezervim' : 'Shto Rezervim'}
      >
        <BookingForm
          mode={modalMode}
          booking={selectedBooking || undefined}
          onSuccess={handleBookingSuccess}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedBooking(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedBooking(null);
        }}
        title="Booking Invoice"
      >
        {selectedBooking && <BookingInvoice booking={selectedBooking} />}
      </Modal>
    </div>
  );
};

export default Booking;
