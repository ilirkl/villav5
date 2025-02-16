"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Booking {
    id?: number;
    start_date: string;
    end_date: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    amount: number;
    prepayment: number;
    notes: string;
}

interface BookingFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    booking?: Booking;
    mode: 'create' | 'edit';
}

const BookingForm = ({ onSuccess, onCancel, booking, mode }: BookingFormProps) => {
    const [newBooking, setNewBooking] = useState<Booking>({
        start_date: '',
        end_date: '',
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        amount: 0,
        prepayment: 0,
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && booking) {
            console.log('Setting initial booking data:', booking);
            setNewBooking({
                ...booking,
                start_date: booking.start_date,
                end_date: booking.end_date,
            });
        }
    }, [mode, booking]);

    const validateForm = () => {
        if (!newBooking.guest_name.trim()) {
            alert('Please enter a guest name');
            return false;
        }
        if (!newBooking.guest_email.trim()) {
            alert('Please enter a guest email');
            return false;
        }
        if (!newBooking.guest_phone.trim()) {
            alert('Please enter a guest phone');
            return false;
        }
        if (!newBooking.start_date) {
            alert('Please select a check-in date');
            return false;
        }
        if (!newBooking.end_date) {
            alert('Please select a check-out date');
            return false;
        }
        if (newBooking.amount <= 0) {
            alert('Please enter a valid amount');
            return false;
        }
        if (newBooking.prepayment < 0) {
            alert('Prepayment amount cannot be negative');
            return false;
        }
        if (newBooking.prepayment > newBooking.amount) {
            alert('Prepayment cannot be greater than total amount');
            return false;
        }
        if (new Date(newBooking.end_date) <= new Date(newBooking.start_date)) {
            alert('Check-out date must be after check-in date');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        try {
            const bookingData = {
                start_date: newBooking.start_date,
                end_date: newBooking.end_date,
                guest_name: newBooking.guest_name,
                guest_email: newBooking.guest_email,
                guest_phone: newBooking.guest_phone,
                amount: newBooking.amount,
                prepayment: newBooking.prepayment,
                notes: newBooking.notes
            };

            console.log('Submitting booking data:', bookingData);

            if (mode === 'edit' && booking?.id) {
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update(bookingData)
                    .eq('id', booking.id);

                if (updateError) {
                    throw updateError;
                }

                console.log('Booking updated successfully');
            } else {
                const { error: insertError } = await supabase
                    .from('bookings')
                    .insert([bookingData]);

                if (insertError) {
                    throw insertError;
                }

                console.log('New booking created successfully');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving booking:', error);
            alert(`Error saving booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Guest Name *</label>
                <input 
                    type="text" 
                    value={newBooking.guest_name} 
                    onChange={(e) => setNewBooking({ ...newBooking, guest_name: e.target.value })} 
                    placeholder="Enter guest name" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Guest Email *</label>
                <input 
                    type="email" 
                    value={newBooking.guest_email} 
                    onChange={(e) => setNewBooking({ ...newBooking, guest_email: e.target.value })} 
                    placeholder="Enter guest email" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Guest Phone *</label>
                <input 
                    type="tel" 
                    value={newBooking.guest_phone} 
                    onChange={(e) => setNewBooking({ ...newBooking, guest_phone: e.target.value })} 
                    placeholder="Enter guest phone" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Check-in Date *</label>
                <input 
                    type="date" 
                    value={newBooking.start_date} 
                    onChange={(e) => setNewBooking({ ...newBooking, start_date: e.target.value })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Check-out Date *</label>
                <input 
                    type="date" 
                    value={newBooking.end_date} 
                    onChange={(e) => setNewBooking({ ...newBooking, end_date: e.target.value })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Total Amount *</label>
                <input 
                    type="number" 
                    value={newBooking.amount} 
                    onChange={(e) => setNewBooking({ ...newBooking, amount: Number(e.target.value) })} 
                    placeholder="Enter total amount" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    required
                    min="0"
                    step="0.01"
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Prepayment Amount</label>
                <input 
                    type="number" 
                    value={newBooking.prepayment} 
                    onChange={(e) => setNewBooking({ ...newBooking, prepayment: Number(e.target.value) })} 
                    placeholder="Enter prepayment amount" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    min="0"
                    max={newBooking.amount}
                    step="0.01"
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea 
                    value={newBooking.notes} 
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })} 
                    placeholder="Add any additional notes" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    rows={3}
                />
            </div>
            <div className="flex gap-3 mt-6">
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#FF385C]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Booking' : 'Add Booking'}
                </button>
                <button 
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
            </div>
            <p className="text-sm text-gray-500">* Required fields</p>
        </div>
    );
};

export default BookingForm;
