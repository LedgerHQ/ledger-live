import type { ReactNode } from "react";
import { usePayAnalyticsContext } from "./context";

type PayTrackPageProps = Readonly<{
  page: string;
}>;

export function PayTrackPage({ page }: PayTrackPageProps): ReactNode {
  return usePayAnalyticsContext().renderPage?.(page) ?? null;
}
