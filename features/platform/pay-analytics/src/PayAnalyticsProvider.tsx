import React, { useMemo, type ReactNode } from "react";
import { createPayAnalyticsHelper } from "./createPayAnalyticsHelper";
import { PayAnalyticsContext } from "./context";
import type { PayAnalyticsAdapter } from "./types";

export type PayAnalyticsProviderProps = Readonly<{
  adapter: PayAnalyticsAdapter;
  renderPage?: (page: string) => ReactNode;
  children: ReactNode;
}>;

export function PayAnalyticsProvider({ adapter, renderPage, children }: PayAnalyticsProviderProps) {
  const value = useMemo(
    () => ({ ...createPayAnalyticsHelper(adapter), configured: true, renderPage }),
    [adapter, renderPage],
  );

  return <PayAnalyticsContext.Provider value={value}>{children}</PayAnalyticsContext.Provider>;
}
