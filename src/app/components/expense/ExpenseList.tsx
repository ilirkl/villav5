import React, { useState, memo } from "react";
import { supabase } from "../../../utils/supabaseClient";

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  created_at: string;
  user_id: string;
}

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 80%)`;
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

interface ExpenseListProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  isLoading: boolean;
  error: string | null;
  setSelectedExpense: (expense: Expense | null) => void;
  setModalMode: (mode: "create" | "edit") => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = memo(
  ({
    expenses,
    setExpenses,
    isLoading,
    error,
    setSelectedExpense,
    setModalMode,
    setIsModalOpen,
  }) => {
    const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

    const toggleExpand = (id: string) => setExpandedExpenseId(expandedExpenseId === id ? null : id);

    const handleEdit = (expense: Expense) => {
      setSelectedExpense(expense);
      setModalMode("edit");
      setIsModalOpen(true);
    };

    const handleDelete = async (expenseId: string) => {
      if (!confirm("Are you sure you want to delete this expense?")) return;
      try {
        const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
        if (error) throw error;
        setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
      } catch (err) {
        console.error("Error deleting expense:", err);
      }
    };

    return (
      <div className="space-y-4">
        {error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : isLoading && expenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No expenses found for this filter. Try adjusting your selection.</p>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(expense);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Edit expense"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(expense.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete expense"
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && expenses.length > 0 && (
          <p className="text-center text-gray-500 py-4">Loading more expenses...</p>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.expenses === nextProps.expenses &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.error === nextProps.error
    );
  }
);

ExpenseList.displayName = "ExpenseList"; // For React DevTools

export default ExpenseList;