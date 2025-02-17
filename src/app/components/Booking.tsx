"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Modal from './Modal';
import BookingForm from './BookingForm';
import BookingInvoice from './BookingInvoice';

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

const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const Booking = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [sortBy, setSortBy] = useState<'date' | 'name' | 'amount'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('bookings')
                .select('*');

            // Apply date filters
            if (startDate) {
                query = query.gte('start_date', startDate);
            }
            if (endDate) {
                query = query.lte('end_date', endDate);
            }

            // Apply sorting
            switch (sortBy) {
                case 'date':
                    query = query.order('start_date', { ascending: sortOrder === 'asc' });
                    break;
                case 'name':
                    query = query.order('guest_name', { ascending: sortOrder === 'asc' });
                    break;
                case 'amount':
                    query = query.order('amount', { ascending: sortOrder === 'asc' });
                    break;
            }

            const { data, error } = await query;

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            alert('Error loading bookings. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, sortBy, sortOrder]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleBookingSuccess = async (newBooking: Omit<Booking, 'id'>) => {
        // For existing bookings, we exclude the current booking when checking for overlaps
        const otherBookings = modalMode === 'edit' && selectedBooking 
            ? bookings.filter(b => b.id !== selectedBooking.id)
            : bookings;

        const hasOverlap = otherBookings.some(booking => {
            const existingStart = new Date(booking.start_date);
            const existingEnd = new Date(booking.end_date);
            const newStart = new Date(newBooking.start_date);
            const newEnd = new Date(newBooking.end_date);

            return (newStart < existingEnd && newEnd > existingStart);
        });

        if (hasOverlap) {
            alert('The selected dates are already booked. Please choose different dates.');
            return;
        }
        setIsModalOpen(false);
        setSelectedBooking(null);
        await fetchBookings();
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

    const handleDelete = async (bookingId: number) => {
        if (!confirm('Are you sure you want to delete this booking?')) return;
        
        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId);

            if (error) throw error;
            await fetchBookings();
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert('Error deleting booking. Please try again.');
        }
    };

    const handleInvoice = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsInvoiceModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading bookings...</p>
            </div>
        );
    }

    const handleSort = (newSortBy: 'date' | 'name' | 'amount') => {
        if (sortBy === newSortBy) {
            // If clicking the same sort option, toggle the order
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // If clicking a different sort option, set it with ascending order
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Filter and Sort UI */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded p-2"
                        placeholder="Start Date"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded p-2"
                        placeholder="End Date"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSort('date')}
                        className={`px-3 py-1 rounded ${sortBy === 'date' ? 'bg-[#FF385C] text-white' : 'bg-gray-100'}`}
                    >
                        Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('name')}
                        className={`px-3 py-1 rounded ${sortBy === 'name' ? 'bg-[#FF385C] text-white' : 'bg-gray-100'}`}
                    >
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('amount')}
                        className={`px-3 py-1 rounded ${sortBy === 'amount' ? 'bg-[#FF385C] text-white' : 'bg-gray-100'}`}
                    >
                        Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                </div>
            </div>
            {/* Add Booking Button */}
            <button
                onClick={handleAdd}
                className="fixed bottom-20 right-4 sm:right-8 z-30 w-14 h-14 bg-[#FF385C] rounded-full flex items-center justify-center shadow-lg hover:bg-[#FF385C]/90 transition-colors"
            >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {/* Bookings List */}
            <div className="space-y-4">
                {bookings.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No bookings found. Add your first booking!</p>
                    </div>
                ) : (
                    bookings.map((booking) => (
                        <div 
                            key={booking.id}
                            className="border border-gray-200 rounded-xl p-6 hover:border-[#FF385C]/30 transition-colors bg-white shadow-sm"
                        >
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                {/* Left Section */}
                                <div className="flex-1 space-y-3">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            {booking.guest_name}
                                        </h3>
                                        {booking.notes && (
                                            <p className="text-gray-600 text-sm italic">
                                                {booking.notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                       
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <span className="hidden sm:inline">•</span>
                                            <a href={`tel:${booking.guest_phone}`} className="hover:text-[#FF385C] transition-colors">
                                                {booking.guest_phone}
                                            </a>
                                        </div>

                                        <div className="bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                                            {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section */}
                                <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-4">
                                    <div className="space-y-2">
                                        <p className="text-2xl font-bold text-[#FF385C]">
                                            {formatAmount(booking.amount)}
                                        </p>
                                        {booking.prepayment > 0 && (
                                            <p className="text-sm text-gray-600">
                                                Parapagim: {formatAmount(booking.prepayment)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleInvoice(booking)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            title="Generate Invoice"
                                        >
                                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleEdit(booking)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            title="Edit booking"
                                        >
                                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(booking.id)}
                                            className="p-2 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete booking"
                                        >
                                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Booking Modal */}
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

            {/* Invoice Modal */}
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
