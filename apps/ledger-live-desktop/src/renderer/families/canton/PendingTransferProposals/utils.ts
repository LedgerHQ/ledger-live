import { useState, useEffect } from "react";

export const getRemainingTime = (diff: number): string => {
  if (diff <= 0) {
    return "";
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let format = "";
  if (days > 0) format += `${days}d `;
  if (hours > 0) format += `${hours}h `;
  if (minutes > 0) format += `${minutes}m `;
  format += `${seconds}s`;

  return format.trim();
};

export const useTimeRemaining = (expiresAtMicros = 0, isExpired = false): string => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (expiresAtMicros <= 0 || isExpired) {
      setTimeRemaining("");
      return;
    }

    const updateTimeRemaining = () => {
      const now = Date.now();
      const expiresAt = expiresAtMicros / 1000;
      const diff = expiresAt - now;

      setTimeRemaining(getRemainingTime(diff));
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAtMicros, isExpired]);

  return timeRemaining;
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp / 1000);
  return date.toISOString().split("T")[0] + " " + date.toTimeString().split(" ")[0].substring(0, 5);
};
