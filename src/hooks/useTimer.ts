import { useState, useEffect } from "react";
export const useTimer = (seconds: number): number => {
  const [time, setTime] = useState(seconds);
  useEffect(() => {
    const startTime = Date.now();
    const int = setInterval(() => {
      const t = Math.ceil(seconds - (Date.now() - startTime) / 1000);

      if (t <= 0) {
        clearInterval(int);
        setTime(0);
      } else {
        setTime(t);
      }
    }, 100);
    return () => {
      if (int) clearInterval(int);
    };
  }, [seconds]);
  return time;
};
