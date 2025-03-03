"use client";

import React, { useState } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import Modal from '../Modal';
import BookingForm from '../booking/BookingForm';
import BookingInvoice from './BookingInvoice';
import { useBookings } from './useBookings';
import { FilterControls } from './FilterControls';
import { BookingList } from './BookingList';
import { AddButton } from './AddButton';

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
}

export const formatAmount = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);

export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const Booking = () => {
  const {
    bookings,
    setBookings,
    isLoading,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortBy,
    sortOrder,
    handleSort,
  } = useBookings();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const handleBookingSuccess = async (newBooking: Omit<Booking, 'id'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Please log in to save a booking.');
      return;
    }

    const otherBookings = modalMode === 'edit' && selectedBooking
      ? bookings.filter(b => b.id !== selectedBooking.id)
      : bookings;

    const hasOverlap = otherBookings.some(b => {
      const existingStart = new Date(b.start_date);
      const existingEnd = new Date(b.end_date);
      const newStart = new Date(newBooking.start_date);
      const newEnd = new Date(newBooking.end_date);
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasOverlap) {
      alert('The selected dates are already booked.');
      return;
    }

    if (modalMode === 'create') {
      const { data, error } = await supabase.from('bookings').insert({ ...newBooking, notes: newBooking.notes || '' }).select().single();
      if (!error) setBookings(prev => [...prev, data as Booking]);
    } else if (selectedBooking) {
      const { data, error } = await supabase.from('bookings').update({ ...newBooking, notes: newBooking.notes || '' }).eq('id', selectedBooking.id).select().single();
      if (!error) setBookings(prev => prev.map(b => b.id === selectedBooking.id ? data as Booking : b));
    }

    setIsModalOpen(false);
    setSelectedBooking(null);
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
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch {
      alert('Error deleting booking.');
    }
  };

  const handleInvoice = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsInvoiceModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <FilterControls
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
      />
      <BookingList
        bookings={bookings}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onInvoice={handleInvoice}
      />
      <AddButton onClick={handleAdd} />
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedBooking(null); }}
        title={modalMode === 'edit' ? 'Ndrysho Rezervim' : 'Shto Rezervim'}
      >
        <BookingForm
          mode={modalMode}
          booking={selectedBooking || undefined}
          onSuccess={handleBookingSuccess}
          onCancel={() => { setIsModalOpen(false); setSelectedBooking(null); }}
        />
      </Modal>
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => { setIsInvoiceModalOpen(false); setSelectedBooking(null); }}
        title="Booking Invoice"
      >
        {selectedBooking && <BookingInvoice booking={selectedBooking} />}
      </Modal>
    </div>
  );
};

export default Booking;