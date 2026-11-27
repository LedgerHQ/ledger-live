import type { ReactNode } from "react";

export type SettingsSheetProps = Readonly<{
  isOpen: boolean;
  title: string;
  description?: string;
  /** Header layout. Defaults to `compact` (centred) on web, `expanded` on native. */
  headerDensity?: "compact" | "expanded";
  onClose: () => void;
  /** False while an action runs: no close button, backdrop, gesture or Escape closes the sheet. */
  canClose?: boolean;
  children?: ReactNode;
  testID?: string;
}>;
