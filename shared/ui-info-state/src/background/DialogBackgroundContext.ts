import React from "react";

export type DialogBackgroundTone = "error" | "info" | "success";

type CleanupDialogBackgroundTone = () => void;

export type DialogBackgroundContextValue = Readonly<{
  /**
   * Registers a status gradient tone for the owning dialog.
   *
   * The returned cleanup function unregisters this exact request. Return it from
   * the caller's effect so the dialog can restore the previous tone, or clear the
   * gradient, when the caller unmounts or changes tone.
   */
  requestBackgroundTone: (tone: DialogBackgroundTone) => CleanupDialogBackgroundTone;
}>;

export const DialogBackgroundContext = React.createContext<
  DialogBackgroundContextValue | undefined
>(undefined);
