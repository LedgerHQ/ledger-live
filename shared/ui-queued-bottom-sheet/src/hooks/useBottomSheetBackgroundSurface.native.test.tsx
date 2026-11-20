import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import type { QueuedBottomSheetAdapters } from "../adapters";
import { QueuedBottomSheetsProvider } from "../components/QueuedBottomSheetsProvider";
import { useBottomSheetBackgroundSurface } from "./useBottomSheetBackgroundSurface";

const SuccessBackground = () => null;
const ErrorBackground = () => null;

const adapters: QueuedBottomSheetAdapters = {
  useAreBottomSheetsLocked: () => false,
  useIsScreenFocused: () => true,
  backgroundComponentByTone: { success: SuccessBackground, error: ErrorBackground },
  log: () => {},
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueuedBottomSheetsProvider adapters={adapters}>{children}</QueuedBottomSheetsProvider>
);

describe("useBottomSheetBackgroundSurface", () => {
  it("paints nothing until a tone is requested", () => {
    const { result } = renderHook(() => useBottomSheetBackgroundSurface(), { wrapper });

    expect(result.current.BackgroundComponent).toBeUndefined();
  });

  it("paints the app's background for the tone requested last, and stops once it's released", () => {
    const { result } = renderHook(() => useBottomSheetBackgroundSurface(), { wrapper });

    let releaseError: (() => void) | undefined;
    act(() => {
      result.current.backgroundContextValue.requestBackgroundTone("success");
      releaseError = result.current.backgroundContextValue.requestBackgroundTone("error");
    });
    expect(result.current.BackgroundComponent).toBe(ErrorBackground);

    act(() => releaseError?.());
    expect(result.current.BackgroundComponent).toBe(SuccessBackground);
  });
});
