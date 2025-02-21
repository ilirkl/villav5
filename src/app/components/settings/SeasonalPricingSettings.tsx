"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { SeasonalPricing } from '../../../types/types';
import { Session } from '@supabase/supabase-js';

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
    const [session, setSession] = useState<Session | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [selectedPricing, setSelectedPricing] = useState<SeasonalPricing | null>(null);

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

    const handleEdit = (pricing: SeasonalPricing) => {
        setEditMode(true);
        setSelectedPricing(pricing);
        setNewPricing({
            start_date: pricing.start_date,
            end_date: pricing.end_date,
            monday_price: pricing.monday_price,
            tuesday_price: pricing.tuesday_price,
            wednesday_price: pricing.wednesday_price,
            thursday_price: pricing.thursday_price,
            friday_price: pricing.friday_price,
            saturday_price: pricing.saturday_price,
            sunday_price: pricing.sunday_price
        });
    };

    const handleCancel = () => {
        setEditMode(false);
        setSelectedPricing(null);
        resetForm();
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
            if (editMode && selectedPricing) {
                const { error } = await supabase
                    .from('seasonal_pricing')
                    .update(newPricing)
                    .eq('id', selectedPricing.id);

                if (error) throw error;
                alert('Seasonal pricing updated successfully');
                setEditMode(false);
                setSelectedPricing(null);
            } else {
                const { error } = await supabase
                    .from('seasonal_pricing')
                    .insert([newPricing]);

                if (error) throw error;
                alert('Seasonal pricing added successfully');
            }
            
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

        // Check for date overlaps with existing pricing periods
        const newStart = new Date(newPricing.start_date);
        const newEnd = new Date(newPricing.end_date);
        
        const hasOverlap = seasonalPricings.some(pricing => {
            // Skip checking against the current pricing being edited
            if (editMode && selectedPricing && pricing.id === selectedPricing.id) {
                return false;
            }
            
            const existingStart = new Date(pricing.start_date);
            const existingEnd = new Date(pricing.end_date);

            // Check if the new period overlaps with an existing period
            return (newStart <= existingEnd && newEnd >= existingStart);
        });

        if (hasOverlap) {
            alert('The selected dates overlap with an existing pricing period. Please choose different dates.');
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
                        <label className="block text-sm font-medium text-gray-700">Nga</label>
                        <input
                            type="date"
                            value={newPricing.start_date}
                            onChange={(e) => setNewPricing({ ...newPricing, start_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C]"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Deri</label>
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

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#FF385C]/90 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Ndrysho' : 'Shto')}
                    </button>
                    {editMode && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Anulo
                        </button>
                    )}
                </div>
            </form>

            <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cmimet Sezonale Egzistuse</h3>
                <div className="space-y-4">
                    {seasonalPricings.map((pricing) => (
                        <div key={pricing.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-medium">
                                        {new Date(pricing.start_date).toLocaleDateString()} - {new Date(pricing.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(pricing)}
                                        className="text-gray-500 hover:text-[#FF385C] transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pricing.id)}
                                        className="text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
                                <p>Hane: €{pricing.monday_price}</p>
                                <p>Marte: €{pricing.tuesday_price}</p>
                                <p>Merkure: €{pricing.wednesday_price}</p>
                                <p>Enjte: €{pricing.thursday_price}</p>
                                <p>Premte: €{pricing.friday_price}</p>
                                <p>Shtune: €{pricing.saturday_price}</p>
                                <p>Diele: €{pricing.sunday_price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SeasonalPricingSettings;
