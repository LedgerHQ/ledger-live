import type { ReactNode } from "react";

export type AnalyticsFilterItemProps = Readonly<{
  value: string;
  label: string;
  icon: ReactNode;
  description?: string;
}>;
