import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * A point selected by scrubbing the asset detail chart. Modelled as an object
 * so it can grow (e.g. percentage, volume) without changing the context API.
 * Values are raw and never pre-formatted; consumers own their formatting.
 */
export type ScrubSelection = Readonly<{
  price: number;
  timestamp: number;
  /** Fraction change from the start of the selected range to this point (e.g. 0.05 = +5%). */
  percentage: number;
  /** Fiat delta from the start of the selected range to this point, in the same units as `price`. */
  variationFiat: number;
}>;

type ScrubbedPriceContextValue = Readonly<{
  selection: ScrubSelection | undefined;
  setSelection: (selection: ScrubSelection | undefined) => void;
}>;

export const ScrubbedPriceContext = createContext<ScrubbedPriceContextValue>({
  selection: undefined,
  setSelection: () => {},
});

export const useScrubbedPrice = () => useContext(ScrubbedPriceContext);

export function ScrubbedPriceProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [selection, setSelection] = useState<ScrubSelection | undefined>(undefined);
  const value = useMemo(() => ({ selection, setSelection }), [selection]);
  return <ScrubbedPriceContext.Provider value={value}>{children}</ScrubbedPriceContext.Provider>;
}
