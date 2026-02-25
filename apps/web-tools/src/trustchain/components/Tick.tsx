import React, { useEffect, useState } from "react";

export function Tick({ timestamp }: { timestamp: number }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return relativeTime(now, new Date(timestamp));
}

function relativeTime(currentDate: Date, targetDate: Date): string {
  const diffMilliseconds = targetDate.getTime() - currentDate.getTime();

  const seconds = Math.round(diffMilliseconds / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30);
  const years = Math.round(months / 12);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (years) {
    return rtf.format(years, Math.abs(years) > 1 ? "years" : "year");
  } else if (months) {
    return rtf.format(months, Math.abs(months) > 1 ? "months" : "month");
  } else if (days) {
    return rtf.format(days, Math.abs(days) > 1 ? "days" : "day");
  } else if (hours) {
    return rtf.format(hours, Math.abs(hours) > 1 ? "hours" : "hour");
  } else if (minutes) {
    return rtf.format(minutes, Math.abs(minutes) > 1 ? "minutes" : "minute");
  }
  return rtf.format(seconds, Math.abs(seconds) > 1 ? "seconds" : "second");
}
