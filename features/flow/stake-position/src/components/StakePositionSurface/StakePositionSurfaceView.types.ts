import type { ReactNode } from "react";

export type StakePositionSurfaceViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  onBack?: () => void;
  onDismiss: () => void;
  isDismissible: boolean;
  children: ReactNode;
  testID?: string;
}>;
