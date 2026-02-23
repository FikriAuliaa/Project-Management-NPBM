import { useState, type KeyboardEvent } from "react";
import { Plus, Trash2, Milestone } from "lucide-react";

type MilestoneInputProps = {
  value: string;
  onChange: (val: string) => void;
};

/**
 * Component for managing task milestones.
 * Parses a newline-separated string from the database into a list
 * and automatically prepends the current date to new entries.
 */
export function MilestoneInput({ value, onChange }: MilestoneInputProps) {
  const [inputValue, setInputValue] = useState("");

  // Parse the single string value into an array of distinct milestones
  const milestones = value
    ? value.split("\n").filter((m) => m.trim() !== "")
    : [];

  const handleAdd = () => {
    if (!inputValue.trim()) return;

    const today = new Date();
    const dateString = today.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Format: [DD Mon YYYY] Milestone text
    const newMilestone = `[${dateString}] ${inputValue.trim()}`;
    const updatedMilestones = [...milestones, newMilestone];

    // Serialize back to a newline-separated string for the form state
    onChange(updatedMilestones.join("\n"));
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const updatedMilestones = milestones.filter(
      (_, index) => index !== indexToRemove,
    );
    onChange(updatedMilestones.join("\n"));
  };

  return (
    <div className="space-y-3">
      {milestones.length > 0 && (
        <ul className="space-y-2 mb-3">
          {milestones.map((milestone, index) => (
            <li
              key={index}
              className="flex items-start justify-between gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
            >
              <div className="flex items-start gap-2.5">
                <Milestone className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {/* Bold the date prefix if it follows the standard [Date] format */}
                  {milestone.startsWith("[") ? (
                    <>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {milestone.substring(0, milestone.indexOf("]") + 1)}
                      </span>
                      {milestone.substring(milestone.indexOf("]") + 1)}
                    </>
                  ) : (
                    milestone
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors shrink-0"
                title="Remove Milestone"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a new milestone and press Enter..."
          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="flex items-center justify-center p-2.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
