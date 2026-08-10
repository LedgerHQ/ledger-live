import React from "react";
import { renderHook } from "@testing-library/react-native";
import {
  BottomSheetBackgroundContext,
  type BottomSheetBackgroundContextValue,
  type BottomSheetBackgroundTone,
} from "../contexts/BottomSheetBackgroundContext";
import { useBottomSheetBackgroundTone } from "./useBottomSheetBackgroundTone";

describe("useBottomSheetBackgroundTone", () => {
  it("does not throw outside a BottomSheetBackgroundContext provider", () => {
    expect(() => {
      renderHook(() => useBottomSheetBackgroundTone("success"));
    }).not.toThrow();
  });

  it("does not call requestBackgroundTone when tone is undefined", () => {
    const requestBackgroundTone = jest.fn(() => jest.fn());

    renderHook(() => useBottomSheetBackgroundTone(undefined), {
      wrapper: buildWrapper({ requestBackgroundTone }),
    });

    expect(requestBackgroundTone).not.toHaveBeenCalled();
  });

  it("requests the tone on mount", () => {
    const requestBackgroundTone = jest.fn(() => jest.fn());

    renderHook(() => useBottomSheetBackgroundTone("success"), {
      wrapper: buildWrapper({ requestBackgroundTone }),
    });

    expect(requestBackgroundTone).toHaveBeenCalledWith("success");
  });

  it("cleans up the previous registration and requests the new tone when tone changes", () => {
    const successCleanup = jest.fn();
    const errorCleanup = jest.fn();
    const requestBackgroundTone = jest.fn((tone: BottomSheetBackgroundTone) =>
      tone === "success" ? successCleanup : errorCleanup,
    );
    let tone: BottomSheetBackgroundTone = "success";
    const { rerender } = renderHook(() => useBottomSheetBackgroundTone(tone), {
      wrapper: buildWrapper({ requestBackgroundTone }),
    });

    tone = "error";
    rerender(undefined);

    expect(successCleanup).toHaveBeenCalledTimes(1);
    expect(requestBackgroundTone).toHaveBeenCalledWith("error");
  });

  it("runs registration cleanup on unmount", () => {
    const cleanup = jest.fn();
    const requestBackgroundTone = jest.fn(() => cleanup);
    const { unmount } = renderHook(() => useBottomSheetBackgroundTone("success"), {
      wrapper: buildWrapper({ requestBackgroundTone }),
    });

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

function buildWrapper(value: BottomSheetBackgroundContextValue) {
  return function BottomSheetBackgroundWrapper({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <BottomSheetBackgroundContext.Provider value={value}>
        {children}
      </BottomSheetBackgroundContext.Provider>
    );
  };
}
