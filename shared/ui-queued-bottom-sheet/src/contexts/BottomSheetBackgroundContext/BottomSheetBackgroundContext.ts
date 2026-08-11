import React from "react";

/**
 * Status tone applied to a bottom sheet's background gradient.
 *
 * Kept as a local union so this package does not depend on the app's
 * `StatusGradient`. The app's `StatusGradientTone` is structurally identical.
 */
export type BottomSheetBackgroundTone = "error" | "info" | "success";

type CleanupBottomSheetBackgroundTone = () => void;

export type BottomSheetBackgroundContextValue = Readonly<{
  /**
   * Registers a status gradient tone for the owning bottom sheet.
   *
   * The returned cleanup function unregisters this exact request. Return it from
   * the caller's effect so the sheet can restore the previous tone, or clear the
   * gradient, when the caller unmounts or changes tone.
   */
  requestBackgroundTone: (tone: BottomSheetBackgroundTone) => CleanupBottomSheetBackgroundTone;
}>;

export const BottomSheetBackgroundContext = React.createContext<
  BottomSheetBackgroundContextValue | undefined
>(undefined);
