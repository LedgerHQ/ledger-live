import type { ReactNode } from "react";

export type StakePositionSurfaceViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  /** The details show their title in the header; the other steps show it themselves. */
  isTitleInHeader: boolean;
  onDismiss: () => void;
  onHidden?: () => void;
  isDismissible: boolean;
  children: ReactNode;
  testID?: string;
}>;
