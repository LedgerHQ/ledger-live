import React from "react";
import type { StatusGradientTone } from "LLM/components/StatusGradient";

export type BottomSheetBackgroundTone = StatusGradientTone;

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
