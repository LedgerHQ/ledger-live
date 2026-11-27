import React, { type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { HiddenSettingsProvider } from "../../HiddenSettingsProvider/HiddenSettingsProvider";
import type { SettingsRowProps } from "../SettingsRow.types";
import { useSettingsRowViewModel } from "../useSettingsRowViewModel";

const hiding =
  (rowsToHide: unknown) =>
  ({ children }: { children: ReactNode }) => (
    <HiddenSettingsProvider rowsToHide={rowsToHide}>{children}</HiddenSettingsProvider>
  );

const renderViewModel = (props: SettingsRowProps, rowsToHide: unknown = []) =>
  renderHook(() => useSettingsRowViewModel(props), { wrapper: hiding(rowsToHide) }).result.current;

describe("useSettingsRowViewModel", () => {
  it("returns null when the app hides the row", () => {
    const viewModel = renderViewModel(
      { title: "My Ledger provider", settingId: "myLedgerProvider" },
      ["myLedgerProvider"],
    );

    expect(viewModel).toBeNull();
  });

  it("keeps a row whose id is not hidden", () => {
    const viewModel = renderViewModel({ title: "Mock app update", settingId: "mockAppUpdate" }, [
      "myLedgerProvider",
    ]);

    expect(viewModel?.title).toBe("Mock app update");
    expect(viewModel).not.toHaveProperty("settingId");
  });

  it("opens the row target on press for a chevron", () => {
    const onSelect = jest.fn();
    const viewModel = renderViewModel({
      title: "Language",
      trailing: { type: "chevron", onSelect },
    });

    expect(viewModel?.onPress).toBe(onSelect);
  });

  it("presses the row itself when its trailing has no action", () => {
    const onSelect = jest.fn();
    const viewModel = renderViewModel({ title: "Version", onSelect });

    expect(viewModel?.onPress).toBe(onSelect);
  });

  it("does not press a disabled row", () => {
    const viewModel = renderViewModel({
      title: "Language",
      disabled: true,
      trailing: { type: "externalLink", onSelect: jest.fn() },
    });

    expect(viewModel?.onPress).toBeUndefined();
  });

  it("does not press a row whose trailing handles its own action", () => {
    const viewModel = renderViewModel({
      title: "Hide balance",
      trailing: { type: "toggle", value: false, onToggle: jest.fn() },
    });

    expect(viewModel?.onPress).toBeUndefined();
  });

  it("derives the toggle test id from the row test id", () => {
    expect(renderViewModel({ title: "Hide balance", testID: "hide-balance" })?.toggleTestID).toBe(
      "hide-balance-toggle",
    );
    expect(renderViewModel({ title: "Hide balance" })?.toggleTestID).toBeUndefined();
  });
});
