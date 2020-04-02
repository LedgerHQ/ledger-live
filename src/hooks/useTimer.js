// @flow
import { useState, useEffect } from "react";

export const useTimer = (timer: number) => {
  const [time, setTime] = useState(timer);

  useEffect(() => {
    let t = timer;
    const int = setInterval(() => {
      if (t <= 0) {
        clearInterval(int);
      } else {
        t--;
        setTime(t);
      }
    }, 1000);
    return () => {
      if (int) clearInterval(int);
    };
  }, [timer]);

  return time;
};
