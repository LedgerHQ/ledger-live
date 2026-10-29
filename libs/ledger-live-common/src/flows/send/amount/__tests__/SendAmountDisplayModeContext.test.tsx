/**
 * @jest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import {
  SendAmountDisplayModeProvider,
  useSendAmountDisplayMode,
} from "../SendAmountDisplayModeContext";

function renderDisplayMode(isFiatModeAvailable?: boolean) {
  return renderHook(() => useSendAmountDisplayMode(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <SendAmountDisplayModeProvider isFiatModeAvailable={isFiatModeAvailable}>
        {children}
      </SendAmountDisplayModeProvider>
    ),
  });
}

describe("SendAmountDisplayModeProvider", () => {
  it("starts in fiat mode by default", () => {
    const { result } = renderDisplayMode();

    expect(result.current.displayMode).toBe("fiat");
    expect(result.current.isFiatModeAvailable).toBe(true);
  });

  it("switches to crypto mode when asked", () => {
    const { result } = renderDisplayMode();

    act(() => result.current.setDisplayMode("crypto"));

    expect(result.current.displayMode).toBe("crypto");
  });

  it("stays in crypto mode when fiat is not available", () => {
    const { result } = renderDisplayMode(false);

    expect(result.current.displayMode).toBe("crypto");
    expect(result.current.isFiatModeAvailable).toBe(false);

    act(() => result.current.setDisplayMode("fiat"));

    expect(result.current.displayMode).toBe("crypto");
  });
});
