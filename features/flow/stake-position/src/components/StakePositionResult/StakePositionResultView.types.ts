import type { ReactNode } from "react";

export type StakePositionResultViewProps = Readonly<{
  preset: "success" | "error";
  title: string;
  description?: ReactNode;
  warning?: string;
  cta?: Readonly<{ label: string; onPress: () => void }>;
  testID?: string;
}>;
