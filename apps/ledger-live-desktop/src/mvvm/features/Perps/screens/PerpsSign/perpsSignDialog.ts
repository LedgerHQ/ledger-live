import React, { createContext, useCallback, useContext, useState } from "react";
import type { PerpsSignData } from "./usePerpsSignViewModel";

type PerpsSignContextValue = {
  data: PerpsSignData | null;
  openPerpsSign: (data: PerpsSignData) => void;
  closePerpsSign: () => void;
};

const PerpsSignContext = createContext<PerpsSignContextValue>({
  data: null,
  openPerpsSign: () => {},
  closePerpsSign: () => {},
});

export function PerpsSignProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PerpsSignData | null>(null);

  const openPerpsSign = useCallback((d: PerpsSignData) => setData(d), []);
  const closePerpsSign = useCallback(() => setData(null), []);

  const value = React.useMemo(
    () => ({ data, openPerpsSign, closePerpsSign }),
    [data, openPerpsSign, closePerpsSign],
  );

  return React.createElement(PerpsSignContext.Provider, { value }, children);
}

export function usePerpsSignState() {
  return useContext(PerpsSignContext);
}
