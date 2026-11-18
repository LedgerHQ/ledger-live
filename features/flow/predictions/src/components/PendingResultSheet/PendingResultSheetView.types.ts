import type React from "react";

export type PendingResultSheetViewProps = Readonly<{
  isOpen: boolean;
  contentKey: string | undefined;
  /** @platform web Lumen's dialog header registers an empty title, so the dialog takes this one. */
  title?: string;
  /** Nothing closes it: no close button, Escape, backdrop, or on native the handle and Android back. */
  isLocked?: boolean;
  onPresented: () => void;
  onDismiss: () => void;
  testID: string;
  children: React.ReactNode;
}>;
