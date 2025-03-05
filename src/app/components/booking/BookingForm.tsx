"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Booking, SeasonalPricing } from '../../../types/types';

interface BookingFormProps {
    onSuccess: (newBooking: Omit<Booking, 'id'>) => void;
    onCancel: () => void;
    booking?: Booking;
    mode: 'create' | 'edit';
}

const BookingForm = ({ onSuccess, onCancel, booking, mode }: BookingFormProps) => {
    // Initialize state with checkin_time and checkout_time
    const [newBooking, setNewBooking] = useState<Booking>({
        id: '',
        start_date: '',
        end_date: '',
        checkin_time: '',
        checkout_time: '',
        guest_name: '',
        guest_phone: '',
        amount: 0,
        prepayment: 0,
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [seasonalPricing, setSeasonalPricing] = useState<SeasonalPricing[]>([]);

    // Populate form with existing booking data in edit mode
    useEffect(() => {
        if (mode === 'edit' && booking) {
            setNewBooking({
                ...booking,
                checkin_time: booking.checkin_time || '', // Use '' if null
                checkout_time: booking.checkout_time || '', // Use '' if null
            });
        }
        fetchSeasonalPricing();
    }, [mode, booking]);

    const fetchSeasonalPricing = async () => {
        try {
            const { data, error } = await supabase
                .from('seasonal_pricing')
                .select('*')
                .order('start_date', { ascending: true });

            if (error) throw error;
            setSeasonalPricing(data || []);
        } catch (error) {
            console.error('Error fetching seasonal pricing:', error);
        }
    };

    const calculateTotalAmount = (startDate: string, endDate: string): number => {
        if (!startDate || !endDate) return 0;

        const start = new Date(startDate);
        const end = new Date(endDate);
        let totalAmount = 0;
        const currentDate = new Date(start);

        while (currentDate < end) {
            const dayOfWeek = currentDate.getDay();
            const dateString = currentDate.toISOString().split('T')[0];

            const applicablePricing = seasonalPricing.find(pricing => 
                dateString >= pricing.start_date && dateString <= pricing.end_date
            );

            if (applicablePricing) {
                const dayPrice = getDayPrice(applicablePricing, dayOfWeek);
                totalAmount += dayPrice;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return totalAmount;
    };

    const getDayPrice = (pricing: SeasonalPricing, dayOfWeek: number): number => {
        switch (dayOfWeek) {
            case 0: return pricing.sunday_price;
            case 1: return pricing.monday_price;
            case 2: return pricing.tuesday_price;
            case 3: return pricing.wednesday_price;
            case 4: return pricing.thursday_price;
            case 5: return pricing.friday_price;
            case 6: return pricing.saturday_price;
            default: return 0;
        }
    };

    useEffect(() => {
        if (newBooking.start_date && newBooking.end_date) {
            const totalAmount = calculateTotalAmount(newBooking.start_date, newBooking.end_date);
            setNewBooking(prev => ({ ...prev, amount: totalAmount }));
        }
    }, [newBooking.start_date, newBooking.end_date, seasonalPricing]);

    const validateForm = () => {
        if (!newBooking.guest_name.trim()) {
            alert('Please enter a guest name');
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
            // Include checkin_time and checkout_time, converting '' to null
            const bookingData: Omit<Booking, 'id'> = {
                start_date: newBooking.start_date,
                end_date: newBooking.end_date,
                checkin_time: newBooking.checkin_time ?? undefined, // Use ?? instead of ||
                checkout_time: newBooking.checkout_time ?? undefined, // Use ?? instead of ||
                guest_name: newBooking.guest_name,
                guest_phone: newBooking.guest_phone,
                amount: newBooking.amount,
                prepayment: newBooking.prepayment,
                notes: newBooking.notes
            };

            if (mode === 'edit' && booking?.id) {
                const { error } = await supabase
                    .from('bookings')
                    .update(bookingData)
                    .eq('id', booking.id);

                if (error) throw error;
                console.log('Booking updated successfully');
            } else {
                const { error } = await supabase
                    .from('bookings')
                    .insert([bookingData]);

                if (error) throw error;
                console.log('New booking created successfully');
            }

            onSuccess(bookingData);
        } catch (error) {
            console.error('Error saving booking:', error);
            alert(`Error saving booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 px-4 py-3">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Guest Name*</label>
                    <input
                        type="text"
                        value={newBooking.guest_name}
                        onChange={(e) => setNewBooking({ ...newBooking, guest_name: e.target.value })}
                        placeholder="First Last"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                        type="tel"
                        value={newBooking.guest_phone}
                        onChange={(e) => setNewBooking({ ...newBooking, guest_phone: e.target.value })}
                        placeholder="Phone Number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Check-in Date*</label>
                    <input
                        type="date"
                        value={newBooking.start_date}
                        onChange={(e) => setNewBooking({ ...newBooking, start_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                        required
                    />
                    <label className="block text-sm font-medium text-gray-700">Check-in Time</label>
                    <input
                        type="time"
                        value={newBooking.checkin_time}
                        onChange={(e) => setNewBooking({ ...newBooking, checkin_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Check-out Date*</label>
                    <input
                        type="date"
                        value={newBooking.end_date}
                        onChange={(e) => setNewBooking({ ...newBooking, end_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                        required
                    />
                    <label className="block text-sm font-medium text-gray-700">Check-out Time</label>
                    <input
                        type="time"
                        value={newBooking.checkout_time}
                        onChange={(e) => setNewBooking({ ...newBooking, checkout_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total Amount*</label>
                    <input
                        type="number"
                        value={newBooking.amount}
                        onChange={(e) => setNewBooking({ ...newBooking, amount: Number(e.target.value) })}
                        placeholder="Total"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                        required
                        min="0"
                        step="1"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Prepayment</label>
                    <input
                        type="number"
                        value={newBooking.prepayment}
                        onChange={(e) => setNewBooking({ ...newBooking, prepayment: Number(e.target.value) })}
                        placeholder="Prepayment"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                        min="0"
                        max={newBooking.amount}
                        step="1"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                    placeholder="Additional notes"
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
                    {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Add'}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default BookingForm;