import { useEffect, useState } from "react";

export function useCustomTimeOut(timeout: number) {
  const [isTimeout, setIsTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimeout(true);
    }, timeout);

    return () => {
      clearTimeout(timer);
    };
  }, [timeout]);

  return isTimeout;
}
