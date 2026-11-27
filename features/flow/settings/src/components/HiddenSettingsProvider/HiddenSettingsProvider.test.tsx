import React, { type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import type { SettingId } from "../../logic/hiddenSettings";
import { HiddenSettingsProvider, useIsSettingHidden } from "./HiddenSettingsProvider";

const renderIsHidden = (settingId: SettingId | undefined, rowsToHide: unknown) =>
  renderHook(({ id }) => useIsSettingHidden(id), {
    initialProps: { id: settingId },
    wrapper: ({ children }: { children: ReactNode }) => (
      <HiddenSettingsProvider rowsToHide={rowsToHide}>{children}</HiddenSettingsProvider>
    ),
  });

describe("useIsSettingHidden", () => {
  it("is true for a row the app hides", () => {
    const { result } = renderIsHidden("myLedgerProvider", ["myLedgerProvider"]);

    expect(result.current).toBe(true);
  });

  it("is false for a row the app does not hide", () => {
    const { result } = renderIsHidden("mockAppUpdate", ["myLedgerProvider"]);

    expect(result.current).toBe(false);
  });

  it("is false for a row without id", () => {
    const { result } = renderIsHidden(undefined, ["myLedgerProvider"]);

    expect(result.current).toBe(false);
  });

  it("is false when the app gives no valid list", () => {
    const { result } = renderIsHidden("myLedgerProvider", "myLedgerProvider");

    expect(result.current).toBe(false);
  });

  it("hides nothing without a provider", () => {
    const { result } = renderHook(() => useIsSettingHidden("myLedgerProvider"));

    expect(result.current).toBe(false);
  });

  it("follows a new list from the app", () => {
    let rowsToHide: unknown = [];
    const { result, rerender } = renderHook(() => useIsSettingHidden("mockAppUpdate"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <HiddenSettingsProvider rowsToHide={rowsToHide}>{children}</HiddenSettingsProvider>
      ),
    });
    expect(result.current).toBe(false);

    rowsToHide = ["mockAppUpdate"];
    rerender();

    expect(result.current).toBe(true);
  });
});
