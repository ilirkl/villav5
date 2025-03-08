"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Expense } from '../../types/types'; // Assuming Expense type includes months: string[]

/** Props for the ExpenseForm component */
interface ExpenseFormProps {
    onSuccess: () => void;    // Callback on successful submission
    onCancel: () => void;     // Callback to cancel the form
    expense?: Expense;        // Optional expense object for edit mode
    mode: 'create' | 'edit';  // Mode of the form: create or edit
}

/** List of expense categories */
const EXPENSE_CATEGORIES = [
    'Mirembajtje',
    'Komunalite',
    'Pastrim',
    'Furnizim',
    'Stafi',
    'Sigurimi',
    'Marketing',
    'Riparime',
    'Tjera'
];

/** List of months for selection */
const MONTHS = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nentor', 'Dhjetor'
];

/**
 * ExpenseForm component for creating or editing expenses
 */
const ExpenseForm = ({ onSuccess, onCancel, expense, mode }: ExpenseFormProps) => {
    // State for the expense form data
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        date: '',
        category: '',
        amount: 0,
        description: '',
        months: [] // Initialized as an empty array for selected months
    });

    // State to track form submission status
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Effect to populate form with existing expense data in edit mode
    useEffect(() => {
        if (mode === 'edit' && expense) {
            console.log('Editing expense with months:', expense.months); // Debug log
            setNewExpense({
                ...expense,
                months: expense.months || [] // Ensure months is an array, even if null
            });
        }
    }, [mode, expense]);

    /**
     * Handles checkbox changes for months
     * @param month - The month being toggled
     * @param isChecked - Whether the checkbox is checked
     */
    const handleMonthChange = (month: string, isChecked: boolean) => {
        setNewExpense(prev => ({
            ...prev,
            months: isChecked
                ? prev.months?.includes(month)
                    ? prev.months // If already included, no change
                    : [...(prev.months || []), month] // Add month if not present
                : (prev.months || []).filter(m => m !== month) // Remove month
        }));
    };

    /**
     * Validates the form data before submission
     * @returns boolean - True if valid, false otherwise
     */
    const validateForm = () => {
        if (!newExpense.category) {
            alert('Please select a category');
            return false;
        }
        if (!newExpense.date) {
            alert('Please select a date');
            return false;
        }
        if (newExpense.amount === undefined || newExpense.amount <= 0) {
            alert('Please enter a valid amount');
            return false;
        }
        if (!newExpense.description?.trim()) {
            alert('Please enter a description');
            return false;
        }
        return true;
    };

    /**
     * Handles form submission to create or update an expense
     */
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            if (mode === 'edit' && expense?.id) {
                // Update existing expense
                const { error: updateError } = await supabase
                    .from('expenses')
                    .update({
                        date: newExpense.date,
                        category: newExpense.category,
                        amount: newExpense.amount,
                        description: newExpense.description,
                        months: newExpense.months
                    })
                    .eq('id', expense.id);

                if (updateError) {
                    throw updateError;
                }
            } else {
                // Insert new expense
                const { error: insertError } = await supabase
                    .from('expenses')
                    .insert([{
                        date: newExpense.date,
                        category: newExpense.category,
                        amount: newExpense.amount,
                        description: newExpense.description,
                        months: newExpense.months
                    }]);

                if (insertError) {
                    throw insertError;
                }
            }

            onSuccess(); // Call success callback
        } catch (error) {
            console.error('Error saving expense:', error);
            alert(`Error saving expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 px-4 py-3">
            {/* Grid for category, date, and amount */}
            <div className="grid grid-cols-3 gap-4">
                {/* Category Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Kategoria*</label>
                    <select
                        value={newExpense.category || ''}
                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                        required
                    >
                        <option value="">Kategoria</option>
                        {EXPENSE_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Data*</label>
                    <input
                        type="date"
                        value={newExpense.date || ''}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                        required
                    />
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Shuma*</label>
                    <input
                        type="number"
                        value={newExpense.amount !== undefined ? newExpense.amount : ''}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                        placeholder="Shuma"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                        required
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Pershkrimi *</label>
                <textarea
                    value={newExpense.description || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Pershkrimi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
                    rows={3}
                    required
                />
            </div>

            {/* Months Checkboxes */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Muajt</label>
                <div className="grid grid-cols-3 gap-2">
                    {MONTHS.map(month => (
                        <label key={month} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={newExpense.months?.includes(month) || false}
                                onChange={(e) => handleMonthChange(month, e.target.checked)}
                                className="h-4 w-4 text-[#FF385C] border-gray-300 rounded focus:ring-[#FF385C]"
                            />
                            <span className="text-sm text-gray-700">{month}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Form Buttons */}
            <div className="flex gap-3 mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#FF385C]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Ndrysho' : 'Shto'}
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

export default ExpenseForm;