"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Modal from './Modal';
import BookingForm from './BookingForm';

interface Booking {
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

const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const Booking = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('start_date', { ascending: true });

            if (error) {
                throw error;
            }

            if (data) {
                console.log('Fetched bookings:', data);
                setBookings(data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            alert('Error loading bookings. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleBookingSuccess = async () => {
        console.log('Booking operation successful, refreshing list...');
        setIsModalOpen(false);
        setSelectedBooking(null);
        await fetchBookings();
    };

    const handleEdit = (booking: Booking) => {
        console.log('Editing booking:', booking);
        setSelectedBooking(booking);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedBooking(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading bookings...</p>
            </div>
        );
    }

    return (
        <div className="relative">
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
                            className="border border-gray-200 rounded-lg p-4 hover:border-[#FF385C] transition-colors bg-white"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-gray-600 text-sm">
                                            {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                                        </span>
                                    </div>
                                    <h4 className="font-medium text-lg">{booking.guest_name}</h4>
                                    <div className="text-sm text-gray-600">
                                        <p>{booking.guest_email}</p>
                                        <p>{booking.guest_phone}</p>
                                    </div>
                                    {booking.notes && (
                                        <p className="mt-2 text-gray-600 text-sm">{booking.notes}</p>
                                    )}
                                </div>
                                <div className="mt-2 sm:mt-0 flex flex-col items-end gap-1">
                                    <span className="font-medium text-[#FF385C] text-lg">
                                        {formatAmount(booking.amount)}
                                    </span>
                                    {booking.prepayment > 0 && (
                                        <span className="text-sm text-gray-600">
                                            Prepaid: {formatAmount(booking.prepayment)}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleEdit(booking)}
                                        className="p-2 text-gray-600 hover:text-[#FF385C] transition-colors"
                                        title="Edit booking"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
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
                title={modalMode === 'edit' ? 'Edit Booking' : 'Add New Booking'}
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
        </div>
    );
};

export default Booking;
