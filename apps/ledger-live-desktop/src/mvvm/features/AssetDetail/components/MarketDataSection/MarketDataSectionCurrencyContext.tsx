import React, { createContext, useContext } from "react";
import type { MarketDataSectionCurrencyData } from "./hooks/useMarketDataSectionCurrencyData";

const MarketDataSectionCurrencyContext = createContext<MarketDataSectionCurrencyData | null>(null);

export function MarketDataSectionCurrencyProvider({
  value,
  children,
}: Readonly<{
  value: MarketDataSectionCurrencyData;
  children: React.ReactNode;
}>) {
  return (
    <MarketDataSectionCurrencyContext.Provider value={value}>
      {children}
    </MarketDataSectionCurrencyContext.Provider>
  );
}

export function useMarketDataSectionCurrencyContext(): MarketDataSectionCurrencyData {
  const ctx = useContext(MarketDataSectionCurrencyContext);
  if (!ctx) {
    throw new Error(
      "useMarketDataSectionCurrencyContext must be used within MarketDataSectionCurrencyProvider",
    );
  }
  return ctx;
}
