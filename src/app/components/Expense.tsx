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

    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                throw error;
            }

            if (data) {
                console.log('Fetched expenses:', data);
                setExpenses(data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            alert('Error loading expenses. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleExpenseSuccess = async () => {
        console.log('Expense operation successful, refreshing list...');
        setIsModalOpen(false);
        setSelectedExpense(null);
        await fetchExpenses();
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading expenses...</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Add Expense Button */}
            <button
                onClick={handleAdd}
                className="fixed bottom-20 right-4 sm:right-8 z-30 w-14 h-14 bg-[#FF385C] rounded-full flex items-center justify-center shadow-lg hover:bg-[#FF385C]/90 transition-colors"
            >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {/* Expenses List */}
            <div className="space-y-4">
                {expenses.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No expenses found. Add your first expense!</p>
                    </div>
                ) : (
                    expenses.map((expense) => (
                        <div 
                            key={expense.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-[#FF385C] transition-colors bg-white"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-gray-600 text-sm">
                                            {formatDate(expense.date)}
                                        </span>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {expense.category}
                                        </span>
                                    </div>
                                    <p className="text-gray-600">{expense.description}</p>
                                </div>
                                <div className="mt-2 sm:mt-0 flex items-center gap-4">
                                    <span className="font-medium text-[#FF385C] text-lg">
                                        {formatAmount(expense.amount)}
                                    </span>
                                    <button
                                        onClick={() => handleEdit(expense)}
                                        className="p-2 text-gray-600 hover:text-[#FF385C] transition-colors"
                                        title="Edit expense"
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
