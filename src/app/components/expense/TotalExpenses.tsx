import React from "react";

interface Expense {
  id: string;
  amount: number;
}

interface TotalExpensesProps {
  expenses: Expense[];
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount);

const TotalExpenses: React.FC<TotalExpensesProps> = React.memo(({ expenses }) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return <div className="mt-4 font-bold text-gray-800">Total Expenses: {formatAmount(total)}</div>;
});

TotalExpenses.displayName = "TotalExpenses"; // Added displayName

export default TotalExpenses;