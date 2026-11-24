import type { ReactNode } from "react";

export type SettingsSheetProps = Readonly<{
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  /** False while an action runs: no close button, backdrop, gesture or Escape closes the sheet. */
  canClose?: boolean;
  children?: ReactNode;
  testID?: string;
}>;
