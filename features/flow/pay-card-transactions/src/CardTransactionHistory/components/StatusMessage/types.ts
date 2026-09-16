import type { ReactNode } from "react";

export type StatusMessageProps = Readonly<{
  spot: ReactNode;
  titleKey: string;
  descriptionKey: string;
  testId: string;
  action?: Readonly<{ labelKey: string; testId: string; onClick: () => void }>;
}>;
