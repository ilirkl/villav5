"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

interface ExpenseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  expense?: Expense;
  mode: "create" | "edit";
}

const EXPENSE_CATEGORIES = [
  "Mirembajtje",
  "Komunalite",
  "Pastrim",
  "Furnizim",
  "Stafi",
  "Sigurimi",
  "Marketing",
  "Riparime",
  "Tjera",
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, onCancel, expense, mode }) => {
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: "",
    category: "",
    amount: 0,
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && expense) {
      setNewExpense(expense);
    }
  }, [mode, expense]);

  const validateForm = () => {
    if (!newExpense.category) return "Please select a category";
    if (!newExpense.date) return "Please select a date";
    if (!newExpense.amount || newExpense.amount <= 0) return "Please enter a valid amount";
    if (!newExpense.description?.trim()) return "Please enter a description";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No authenticated user found");

      if (mode === "edit" && expense?.id) {
        const { error: updateError } = await supabase
          .from("expenses")
          .update({
            date: newExpense.date,
            category: newExpense.category,
            amount: newExpense.amount,
            description: newExpense.description,
          })
          .eq("id", expense.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("expenses").insert([
          {
            date: newExpense.date,
            category: newExpense.category,
            amount: newExpense.amount,
            description: newExpense.description,
            user_id: session.user.id,
          },
        ]);
        if (insertError) throw insertError;
      }
      onSuccess();
    } catch (err) {
      setError("Failed to save expense. Please try again.");
      console.error("Error saving expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 px-4 py-3">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Kategoria*</label>
          <select
            value={newExpense.category || ""}
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
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Data*</label>
          <input
            type="date"
            value={newExpense.date || ""}
            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Shuma*</label>
          <input
            type="number"
            value={newExpense.amount !== undefined ? newExpense.amount : ""}
            onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
            placeholder="Shuma"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Pershkrimi *</label>
        <textarea
          value={newExpense.description || ""}
          onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
          placeholder="Pershkrimi"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C] transition-colors"
          rows={3}
          required
        />
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#FF385C]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : mode === "edit" ? "Ndrysho" : "Shto"}
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