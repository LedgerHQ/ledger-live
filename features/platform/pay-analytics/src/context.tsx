import { createContext, useContext, type ReactNode } from "react";
import { createPayAnalyticsHelper } from "./createPayAnalyticsHelper";
import type { PayAnalyticsHelper } from "./types";

export type PayAnalyticsContextValue = PayAnalyticsHelper &
  Readonly<{
    configured: boolean;
    renderPage?: (page: string) => ReactNode;
  }>;

const fallbackValue = {
  ...createPayAnalyticsHelper({ track: () => undefined }),
  configured: false,
};

export const PayAnalyticsContext = createContext<PayAnalyticsContextValue>(fallbackValue);

export function usePayAnalyticsContext(): PayAnalyticsContextValue {
  return useContext(PayAnalyticsContext);
}
