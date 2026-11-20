import type React from "react";

export type PendingResultSheetViewProps = Readonly<{
  isOpen: boolean;
  /** Changes with every request and outcome. Undefined until something was shown. */
  contentKey: string | undefined;
  /**
   * Names the dialog, where Lumen's header registers an empty title.
   * @platform web
   */
  title: string | undefined;
  /** Called once each request or outcome is on screen. */
  onPresented: () => void;
  onDismiss: () => void;
  /** @platform native */
  testID: string;
  children: React.ReactNode;
}>;
