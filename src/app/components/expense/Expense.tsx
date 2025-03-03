"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "../../../utils/supabaseClient";
import throttle from "lodash/throttle";
import FilterControls from "./FilterControls";
import ExpenseList from "./ExpenseList";
import TotalExpenses from "./TotalExpenses";
import Modal from "../Modal";
import ExpenseForm from "./ExpenseForm";

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  created_at: string;
  user_id: string;
}

const Expense: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "description">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const limit = 10;

  const isFetchingRef = useRef(false);

  // Fetch categories from Supabase
  const fetchCategories = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("No authenticated user found");
      return;
    }
    const userId = session.user.id;

    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("category")
        .not("category", "is", null)
        .eq("user_id", userId)
        .order("category", { ascending: true });

      if (error) throw error;

      const uniqueCategories = Array.from(new Set(data.map((item) => item.category)));
      setCategories(uniqueCategories);
    } catch (err) {
      setError("Failed to fetch categories");
      console.error("Error fetching categories:", err);
    }
  }, []);

  // Fetch expenses from Supabase with filtering and sorting
  const fetchExpenses = useCallback(
    async (reset: boolean, currentOffset?: number) => {
      if (!hasMore && !reset) return;
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);
      const offsetToUse = reset ? 0 : currentOffset !== undefined ? currentOffset : offset;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("No authenticated user found");
        setIsLoading(false);
        setIsFilterLoading(false);
        isFetchingRef.current = false;
        return;
      }
      const userId = session.user.id;

      try {
        let query = supabase
          .from("expenses")
          .select("id, date, category, amount, description, user_id", { count: "exact" })
          .eq("user_id", userId);

        if (startDate) query = query.gte("date", startDate);
        if (endDate) query = query.lte("date", endDate);
        if (selectedCategory && selectedCategory !== "all") {
          query = query.eq("category", selectedCategory);
        }

        switch (sortBy) {
          case "date":
            query = query.order("date", { ascending: sortOrder === "asc" });
            break;
          case "description":
            query = query.order("description", { ascending: sortOrder === "asc", nullsFirst: false } as const);
            break;
        }

        query = query.range(offsetToUse, offsetToUse + limit - 1);

        const { data, count, error } = await query;
        if (error) throw error;

        const fetchedExpenses = data as Expense[];
        if (reset) {
          setExpenses(fetchedExpenses);
        } else {
          setExpenses((prev) => [
            ...prev,
            ...fetchedExpenses.filter((newExp) => !prev.some((exp) => exp.id === newExp.id)),
          ]);
        }
        const newOffset = offsetToUse + fetchedExpenses.length;
        setOffset(newOffset);
        setHasMore(newOffset < count!);
      } catch (err) {
        setError("Failed to load expenses");
        console.error("Error fetching expenses:", err);
        if (reset) setExpenses([]);
      } finally {
        setIsLoading(false);
        setIsFilterLoading(false);
        isFetchingRef.current = false;
      }
    },
    [hasMore, startDate, endDate, selectedCategory, sortBy, sortOrder, offset]
  );

  // Initial fetch on component mount
  useEffect(() => {
    fetchCategories();
    fetchExpenses(true);
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps



  // Reset expenses when filters or sorting change
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setIsFilterLoading(true);
    fetchExpenses(true);
  }, [startDate, endDate, selectedCategory, sortBy, sortOrder]);

  // Infinite scroll handler
  const handleScroll = useCallback(
    throttle(() => {
      const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollPosition >= documentHeight - 300 && hasMore && !isLoading) {
        fetchExpenses(false, offset);
      }
    }, 1000),
    [fetchExpenses, offset, hasMore, isLoading]  // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Handle sorting toggle
  const handleSort = (newSortBy: "date" | "description") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  // Open modal for adding a new expense
  const handleAdd = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("Please log in to add an expense");
      return;
    }
    setSelectedExpense(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Handle successful expense addition or edit
  const handleExpenseSuccess = () => {
    setIsModalOpen(false);
    setSelectedExpense(null);
    fetchExpenses(true); // Reset expenses after adding/editing
    fetchCategories(); // Refresh categories if a new one was added
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <FilterControls
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
      />
      <button
        onClick={handleAdd}
        className="fixed bottom-20 right-4 sm:right-8 z-30 w-14 h-14 bg-[#FF385C] rounded-full flex items-center justify-center shadow-lg hover:bg-[#FF385C]/90 transition-colors"
      >
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <ExpenseList
        expenses={expenses}
        setExpenses={setExpenses}
        isLoading={isLoading || isFilterLoading}
        error={error}
        setSelectedExpense={setSelectedExpense}
        setModalMode={setModalMode}
        setIsModalOpen={setIsModalOpen}
      />
      {isLoading && <div className="text-center py-4">Loading more expenses...</div>}
      <TotalExpenses expenses={expenses} />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpense(null);
        }}
        title={modalMode === "edit" ? "Ndrysho" : "Shto Shpenzim"}
      >
        <ExpenseForm
          mode={modalMode}
          expense={selectedExpense || undefined}
          onSuccess={handleExpenseSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Expense;