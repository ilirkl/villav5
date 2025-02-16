"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Modal from './Modal';
import ExpenseForm from './ExpenseForm';

interface Expense {
    id: number;
    date: string;
    category: string;
    amount: number;
    description: string;
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

const Expense = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categories, setCategories] = useState<string[]>([]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('category')
                .not('category', 'is', null)
                .order('category', { ascending: true });

            if (error) throw error;

            const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            // Apply date filters
            if (startDate) {
                query = query.gte('date', startDate);
            }
            if (endDate) {
                query = query.lte('date', endDate);
            }
            // Apply category filter
            if (selectedCategory && selectedCategory !== 'all') {
                query = query.eq('category', selectedCategory);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                setExpenses(data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            alert('Error loading expenses. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, selectedCategory]);

    useEffect(() => {
        fetchCategories();
        fetchExpenses();
    }, [fetchExpenses]);

    const handleExpenseSuccess = async () => {
        console.log('Expense operation successful, refreshing list...');
        setIsModalOpen(false);
        setSelectedExpense(null);
        await fetchExpenses();
        await fetchCategories(); // Refetch categories to include any new ones
    };

    const handleEdit = (expense: Expense) => {
        console.log('Editing expense:', expense);
        setSelectedExpense(expense);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedExpense(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleDelete = async (expenseId: number) => {
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (error) throw error;

            console.log('Expense deleted successfully');
            await fetchExpenses(); // Refetch the expenses after deletion
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Error deleting expense. Please try again.');
        }
    };

    // Calculate total expenses
    const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading expenses...</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Filter UI */}
            <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm">Start Date:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded p-2"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm">End Date:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded p-2"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm">Category:</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border rounded p-2"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleAdd}
                    className="fixed bottom-20 right-4 sm:right-8 z-30 w-14 h-14 bg-[#FF385C] rounded-full flex items-center justify-center shadow-lg hover:bg-[#FF385C]/90 transition-colors"
                >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* Expenses List */}
            <div className="grid grid-cols-1 gap-4">
                {expenses.length === 0 ? (
                    <p className="text-gray-500">No expenses found.</p>
                ) : (
                    expenses.map((expense) => (
                        <div key={expense.id} className="border rounded-lg p-4 shadow-md flex justify-between items-center">
                            <div>
                                <p className="text-gray-600 text-sm">{formatDate(expense.date)}</p>
                                <p className="font-bold">{expense.description}</p>
                                <p className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{expense.category}</p>
                            </div>
                            <div className="flex items-center">
                                <p className="font-bold">{formatAmount(expense.amount)}</p>
                                <button
                                    onClick={() => handleEdit(expense)}
                                    className="p-2 text-gray-600 hover:text-[#FF385C] transition-colors"
                                    title="Edit expense"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(expense.id)}
                                    className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                    title="Delete expense"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24  24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total Expenses */}
            <div className="mt-4 font-bold">
                Total Expenses: {formatAmount(totalExpenses)}
            </div>

            {/* Add/Edit Expense Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedExpense(null);
                }}
                title={modalMode === 'edit' ? 'Edit Expense' : 'Add New Expense'}
            >
                <ExpenseForm
                    mode={modalMode}
                    expense={selectedExpense || undefined}
                    onSuccess={handleExpenseSuccess}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setSelectedExpense(null);
                    }}
                />
            </Modal>
        </div>
    );
};

export default Expense;