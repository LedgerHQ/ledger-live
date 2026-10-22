import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { AccountSettingsSheet } from "./AccountSettingsSheet.native";
import type { AccountSettingsSheetProps } from "./types.native";

function renderSheet(overrides: Partial<AccountSettingsSheetProps> = {}) {
  const props: AccountSettingsSheetProps = {
    isOpen: true,
    accountName: "Bitcoin 1",
    onClose: jest.fn(),
    onChangeName: jest.fn(),
    onViewAdvancedLogs: jest.fn(),
    onConfirmRemove: jest.fn(),
    ...overrides,
  };
  render(<AccountSettingsSheet {...props} />, { wrapper: I18nWrapper });
  return { props, user: userEvent.setup() };
}

describe("AccountSettingsSheet (Native)", () => {
  it("opens on the settings menu", () => {
    renderSheet();

    expect(screen.getByTestId("account-settings-menu")).toBeVisible();
    expect(screen.getByText("Bitcoin 1")).toBeVisible();
    expect(screen.queryByTestId("account-settings-remove-content")).toBeNull();
  });

  it("forwards the menu actions", async () => {
    const { props, user } = renderSheet();

    await user.press(screen.getByTestId("account-settings-change-name"));
    await user.press(screen.getByTestId("account-settings-advanced-logs"));

    expect(props.onChangeName).toHaveBeenCalledTimes(1);
    expect(props.onViewAdvancedLogs).toHaveBeenCalledTimes(1);
  });

  it("asks for confirmation before removing the account", async () => {
    const { props, user } = renderSheet();

    await user.press(screen.getByTestId("account-settings-remove-account"));

    expect(screen.getByText("Remove account?")).toBeVisible();
    expect(screen.queryByTestId("account-settings-menu")).toBeNull();

    await user.press(screen.getByTestId("account-settings-remove-confirm"));
    await user.press(screen.getByTestId("account-settings-remove-cancel"));

    expect(props.onConfirmRemove).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("goes back to the menu from the remove confirmation", async () => {
    const { user } = renderSheet();

    await user.press(screen.getByTestId("account-settings-remove-account"));
    await user.press(screen.getByTestId("queued-bottom-sheet-back"));

    expect(screen.getByTestId("account-settings-menu")).toBeVisible();
    expect(screen.queryByTestId("account-settings-remove-content")).toBeNull();
  });
});
