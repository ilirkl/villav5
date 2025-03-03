import React from "react";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";

interface FilterControlsProps {
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  categories: string[];
  sortBy: "date" | "description";
  sortOrder: "asc" | "desc";
  handleSort: (newSortBy: "date" | "description") => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedCategory,
  setSelectedCategory,
  categories,
  sortBy,
  sortOrder,
  handleSort,
}) => (
  <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleSort("date")}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          sortBy === "date" ? "bg-[#FF385C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Date {sortBy === "date" && (sortOrder === "asc" ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />)}
      </button>
      <button
        onClick={() => handleSort("description")}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          sortBy === "description" ? "bg-[#FF385C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Description {sortBy === "description" && (sortOrder === "asc" ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />)}
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
);

export default FilterControls;