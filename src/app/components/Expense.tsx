"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Modal from './Modal';
import ExpenseForm from './ExpenseForm';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

interface Expense {
    id: string;
    date: string;
    category: string;
    amount: number;
    description: string;
}

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 80%)`;
};

const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const Expense = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categories, setCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'date' | 'description'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const limit = 10;

    const fetchCategories = async () => {
        try {
            const { data } = await supabase
                .from('expenses')
                .select('category')
                .not('category', 'is', null)
                .order('category', { ascending: true });

            const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
            setCategories(uniqueCategories);
        } catch {
            alert('Error fetching categories. Please try again.');
        }
    };

    const fetchExpenses = useCallback(async (reset = false) => {
        if (!hasMore || isLoading) return;

        setIsLoading(true);
        const currentOffset = reset ? 0 : offset;

        try {
            let query = supabase
                .from('expenses')
                .select('id, date, category, amount, description')
                .range(currentOffset, currentOffset + limit - 1);

            if (startDate) query = query.gte('date', startDate);
            if (endDate) query = query.lte('date', endDate);
            if (selectedCategory && selectedCategory !== 'all') query = query.eq('category', selectedCategory);

            switch (sortBy) {
                case 'date':
                    query = query.order('date', { ascending: sortOrder === 'asc' });
                    break;
                case 'description':
                    query = query.order('description', { ascending: sortOrder === 'asc' });
                    break;
            }

            const { data } = await query;

            const fetchedExpenses = data as Expense[];

            setExpenses((prev) => {
                if (reset) return fetchedExpenses;
                const newExpenses = fetchedExpenses.filter(
                    (newExpense) => !prev.some((existing) => existing.id === newExpense.id)
                );
                return [...prev, ...newExpenses];
            });

            setOffset((prev) => (reset ? limit : prev + limit));
            setHasMore(fetchedExpenses.length === limit);
        } catch {
            alert('Error loading expenses. Please try again.');
            setExpenses([]);
        } finally {
            setIsLoading(false);
        }
    }, [offset, hasMore, isLoading, startDate, endDate, selectedCategory, sortBy, sortOrder]);

    useEffect(() => {
        fetchCategories();
        fetchExpenses(true);
    }, [fetchExpenses]);

    useEffect(() => {
        setExpenses([]);
        setOffset(0);
        setHasMore(true);
        fetchExpenses(true);
    }, [fetchExpenses, startDate, endDate, selectedCategory, sortBy, sortOrder]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                    document.documentElement.offsetHeight - 100 &&
                hasMore &&
                !isLoading
            ) {
                fetchExpenses();
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchExpenses, hasMore, isLoading]);

    const handleExpenseSuccess = async () => {
        setIsModalOpen(false);
        setSelectedExpense(null);
        await fetchExpenses(true);
        await fetchCategories();
    };

    const handleEdit = (expense: Expense) => {
        setSelectedExpense(expense);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedExpense(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleDelete = async (expenseId: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await supabase.from('expenses').delete().eq('id', expenseId);
            await fetchExpenses(true);
        } catch {
            alert('Error deleting expense. Please try again.');
        }
    };

    const handleSort = (newSortBy: 'date' | 'description') => {
        if (sortBy === newSortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedExpenseId(expandedExpenseId === id ? null : id);
    };

    const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleSort('date')}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            sortBy === 'date' ? 'bg-[#FF385C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Date {sortBy === 'date' && (sortOrder === 'asc' ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />)}
                    </button>
                    <button
                        onClick={() => handleSort('description')}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            sortBy === 'description' ? 'bg-[#FF385C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Description {sortBy === 'description' && (sortOrder === 'asc' ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />)}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded p-2 text-sm focus:ring-[#FF385C] focus:border-[#FF385C]"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded p-2 text-sm focus:ring-[#FF385C] focus:border-[#FF385C]"
                    />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-gray-300 rounded p-2 text-sm focus:ring-[#FF385C] focus:border-[#FF385C]"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                onClick={handleAdd}
                className="fixed bottom-20 right-4 sm:right-8 z-30 w-14 h-14 bg-[#FF385C] rounded-full flex items-center justify-center shadow-lg hover:bg-[#FF385C]/90 transition-colors"
            >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            <div className="space-y-4">
                {expenses.length === 0 && !isLoading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No expenses found. Add your first expense!</p>
                    </div>
                ) : (
                    expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className="border border-gray-200 rounded-xl p-4 hover:border-[#FF385C]/30 transition-all bg-white shadow-sm hover:shadow-md cursor-pointer"
                            onClick={() => toggleExpand(expense.id)}
                        >
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div className="flex-1 flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">{expense.description}</h3>
                                    <p className="text-xl font-bold text-[#FF385C]">{formatAmount(expense.amount)}</p>
                                </div>
                                {expandedExpenseId === expense.id && (
                                    <div className="flex-1 space-y-3">
                                        <p className="text-gray-600 text-sm">{formatDate(expense.date)}</p>
                                        <p
                                            className="px-2 py-1 rounded-full text-xs font-medium text-gray-800 inline-block"
                                            style={{ backgroundColor: stringToColor(expense.category) }}
                                        >
                                            {expense.category}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(expense); }}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                                title="Edit expense"
                                            >
                                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }}
                                                className="p-2 hover:bg-red-50 rounded-full transition-colors"
                                                title="Delete expense"
                                            >
                                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <p className="text-center text-gray-500 py-4">Loading more expenses...</p>
                )}
            </div>

            <div className="mt-4 font-bold text-gray-800">
                Total Expenses: {formatAmount(totalExpenses)}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedExpense(null);
                }}
                title={modalMode === 'edit' ? 'Ndrysho' : 'Shto Shpenzim'}
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