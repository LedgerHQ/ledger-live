import React from "react";
import { renderHook } from "@tests/test-renderer";
import {
  BottomSheetBackgroundContext,
  type BottomSheetBackgroundContextValue,
  type BottomSheetBackgroundTone,
} from "LLM/contexts/BottomSheetBackgroundContext";
import { useBottomSheetBackgroundTone } from "../useBottomSheetBackgroundTone";

describe("useBottomSheetBackgroundTone", () => {
  it("GIVEN no BottomSheetBackgroundContext provider WHEN the hook is called THEN it does not throw", () => {
    // GIVEN
    // (no provider)

    // WHEN / THEN
    expect(() => {
      renderHook(() => useBottomSheetBackgroundTone("success"));
    }).not.toThrow();
  });

  it("GIVEN a provider is wired WHEN the hook is called with undefined THEN it does not call requestBackgroundTone", () => {
    // GIVEN
    const requestBackgroundTone = jest.fn(() => jest.fn());

    // WHEN
    renderHook(() => useBottomSheetBackgroundTone(undefined), {
      wrapper: buildWrapper({ requestBackgroundTone }),
    });

    // THEN
    expect(requestBackgroundTone).not.toHaveBeenCalled();
  });

  it("GIVEN a provider is wired WHEN the hook mounts with a tone THEN it requests that tone", () => {
    // GIVEN
    const requestBackgroundTone = jest.fn(() => jest.fn());

    // WHEN
    renderHook(() => useBottomSheetBackgroundTone("success"), {
      wrapper: buildWrapper({ requestBackgroundTone }),
    });

    // THEN
    expect(requestBackgroundTone).toHaveBeenCalledWith("success");
  });

  it("GIVEN the hook has mounted with a tone WHEN the tone changes THEN the previous registration is cleaned up and the new tone is requested", () => {
    // GIVEN
    const successCleanup = jest.fn();
    const errorCleanup = jest.fn();
    const requestBackgroundTone = jest.fn((tone: BottomSheetBackgroundTone) =>
      tone === "success" ? successCleanup : errorCleanup,
    );
    let tone: BottomSheetBackgroundTone = "success";
    const { rerender } = renderHook(() => useBottomSheetBackgroundTone(tone), {
      wrapper: buildWrapper({ requestBackgroundTone }),
    });

    // WHEN
    tone = "error";
    rerender(undefined);

    // THEN
    expect(successCleanup).toHaveBeenCalledTimes(1);
    expect(requestBackgroundTone).toHaveBeenCalledWith("error");
  });

  it("GIVEN the hook is mounted with a tone WHEN it unmounts THEN the registration cleanup runs", () => {
    // GIVEN
    const cleanup = jest.fn();
    const requestBackgroundTone = jest.fn(() => cleanup);
    const { unmount } = renderHook(() => useBottomSheetBackgroundTone("success"), {
      wrapper: buildWrapper({ requestBackgroundTone }),
    });

    // WHEN
    unmount();

    // THEN
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
