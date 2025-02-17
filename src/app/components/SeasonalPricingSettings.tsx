"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { SeasonalPricing } from '../types';

const SeasonalPricingSettings = () => {
    const [seasonalPricings, setSeasonalPricings] = useState<SeasonalPricing[]>([]);
    const [newPricing, setNewPricing] = useState<Omit<SeasonalPricing, 'id' | 'created_at'>>({
        start_date: '',
        end_date: '',
        monday_price: 0,
        tuesday_price: 0,
        wednesday_price: 0,
        thursday_price: 0,
        friday_price: 0,
        saturday_price: 0,
        sunday_price: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchSeasonalPricings();
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchSeasonalPricings();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchSeasonalPricings = async () => {
        try {
            const { data, error } = await supabase
                .from('seasonal_pricing')
                .select('*')
                .order('start_date', { ascending: true });

            if (error) throw error;
            setSeasonalPricings(data || []);
        } catch (error) {
            console.error('Error fetching seasonal pricing:', error);
            alert('Error fetching seasonal pricing settings');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (!session) {
            alert('Please sign in to add seasonal pricing');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('seasonal_pricing')
                .insert([newPricing]);

            if (error) throw error;

            alert('Seasonal pricing added successfully');
            fetchSeasonalPricings();
            resetForm();
        } catch (error) {
            console.error('Error saving seasonal pricing:', error);
            alert('Error saving seasonal pricing settings');
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateForm = () => {
        if (!newPricing.start_date || !newPricing.end_date) {
            alert('Please select both start and end dates');
            return false;
        }
        if (new Date(newPricing.end_date) <= new Date(newPricing.start_date)) {
            alert('End date must be after start date');
            return false;
        }
        const prices = [
            newPricing.monday_price,
            newPricing.tuesday_price,
            newPricing.wednesday_price,
            newPricing.thursday_price,
            newPricing.friday_price,
            newPricing.saturday_price,
            newPricing.sunday_price
        ];
        if (prices.some(price => price < 0)) {
            alert('Prices cannot be negative');
            return false;
        }
        return true;
    };

    const resetForm = () => {
        setNewPricing({
            start_date: '',
            end_date: '',
            monday_price: 0,
            tuesday_price: 0,
            wednesday_price: 0,
            thursday_price: 0,
            friday_price: 0,
            saturday_price: 0,
            sunday_price: 0
        });
    };

    const handleDelete = async (id: number) => {
        if (!session) {
            alert('Please sign in to delete seasonal pricing');
            return;
        }
        if (!confirm('Are you sure you want to delete this seasonal pricing?')) return;

        try {
            const { error } = await supabase
                .from('seasonal_pricing')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Seasonal pricing deleted successfully');
            fetchSeasonalPricings();
        } catch (error) {
            console.error('Error deleting seasonal pricing:', error);
            alert('Error deleting seasonal pricing');
        }
    };

    if (!session) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">Please sign in to manage seasonal pricing settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            value={newPricing.start_date}
                            onChange={(e) => setNewPricing({ ...newPricing, start_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C]"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            value={newPricing.end_date}
                            onChange={(e) => setNewPricing({ ...newPricing, end_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C]"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">{day}</label>
                            <input
                                type="number"
                                value={newPricing[`${day.toLowerCase()}_price` as keyof typeof newPricing]}
                                onChange={(e) => setNewPricing({
                                    ...newPricing,
                                    [`${day.toLowerCase()}_price`]: Number(e.target.value)
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C]"
                                min="0"
                                required
                            />
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#FF385C]/90 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'Adding...' : 'Add Seasonal Pricing'}
                </button>
            </form>

            <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Seasonal Prices</h3>
                <div className="space-y-4">
                    {seasonalPricings.map((pricing) => (
                        <div key={pricing.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-medium">
                                        {new Date(pricing.start_date).toLocaleDateString()} - {new Date(pricing.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(pricing.id)}
                                    className="text-gray-500 hover:text-red-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
                                <p>Monday: €{pricing.monday_price}</p>
                                <p>Tuesday: €{pricing.tuesday_price}</p>
                                <p>Wednesday: €{pricing.wednesday_price}</p>
                                <p>Thursday: €{pricing.thursday_price}</p>
                                <p>Friday: €{pricing.friday_price}</p>
                                <p>Saturday: €{pricing.saturday_price}</p>
                                <p>Sunday: €{pricing.sunday_price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SeasonalPricingSettings;
