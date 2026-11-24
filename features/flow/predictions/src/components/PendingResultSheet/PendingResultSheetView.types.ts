import type React from "react";

export type PendingResultSheetViewProps = Readonly<{
  isOpen: boolean;
  contentKey: string | undefined;
  /** @platform web Lumen's dialog header registers an empty title, so the dialog takes this one. */
  title?: string;
  onPresented: () => void;
  onDismiss: () => void;
  testID: string;
  children: React.ReactNode;
}>;
