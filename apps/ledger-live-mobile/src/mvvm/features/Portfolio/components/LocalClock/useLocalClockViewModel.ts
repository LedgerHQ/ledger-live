import { useState, useEffect, useCallback } from "react";

function formatTime(date: Date, includeSeconds: boolean): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  if (includeSeconds) {
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${hours}:${minutes}`;
}

function formatDate(date: Date): string {
  const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
  const day = date.getDate();
  const monthName = date.toLocaleDateString(undefined, { month: "long" });
  return `${dayName}, ${day} ${monthName}`;
}

export type UseLocalClockViewModelResult = {
  time: string;
  date: string;
  isExpanded: boolean;
  toggleExpanded: () => void;
};

export function useLocalClockViewModel(): UseLocalClockViewModelResult {
  const [now, setNow] = useState(() => new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return {
    time: formatTime(now, isExpanded),
    date: formatDate(now),
    isExpanded,
    toggleExpanded,
  };
}
