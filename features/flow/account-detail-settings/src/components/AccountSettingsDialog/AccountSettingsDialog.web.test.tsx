import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { copyToClipboard } from "@shared/clipboard";
import { advancedLogsInput } from "../../__tests__/fixtures";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { buildAdvancedLogs } from "../../logic/buildAdvancedLogs";
import { AccountSettingsDialog } from "./AccountSettingsDialog";
import type { AccountSettingsDialogProps } from "./types";

jest.mock("@shared/clipboard", () => ({ copyToClipboard: jest.fn() }));

const mockCopyToClipboard = jest.mocked(copyToClipboard);

function renderDialog(overrides: Partial<AccountSettingsDialogProps> = {}) {
  const props: AccountSettingsDialogProps = {
    isOpen: true,
    accountName: "Bitcoin 1",
    ticker: "BTC",
    nameMaxLength: 50,
    advancedLogs: { input: advancedLogsInput, locale: "en-US", derivationTag: "native segwit" },
    onClose: jest.fn(),
    onConfirmName: jest.fn(),
    onConfirmRemove: jest.fn(),
    ...overrides,
  };
  render(<AccountSettingsDialog {...props} testID="settings-dialog" />, { wrapper: I18nWrapper });
  return { props, user: userEvent.setup() };
}

describe("AccountSettingsDialog (Web)", () => {
  it("renders nothing while closed", () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByTestId("settings-dialog")).toBeNull();
  });

  it("opens on the settings menu", () => {
    renderDialog();

    expect(screen.getByTestId("settings-dialog")).toBeVisible();
    expect(screen.getByText("Account settings")).toBeVisible();
    expect(screen.getByText("Bitcoin 1")).toBeVisible();
    expect(screen.queryByTestId("dialog-status-gradient-error")).toBeNull();
  });

  it("shows the advanced logs from their own step", async () => {
    mockCopyToClipboard.mockResolvedValue(true);
    const { json, syncDate } = buildAdvancedLogs(advancedLogsInput, "en-US");
    const { user } = renderDialog();

    await user.click(screen.getByTestId("account-settings-advanced-logs"));

    expect(screen.getByText("Advanced logs")).toBeVisible();
    expect(screen.getByText(/This is a native segwit xpub/)).toBeVisible();
    expect(screen.getByText(`Synchronised ${syncDate}`)).toBeVisible();
    expect(screen.getByTestId("account-settings-advanced-logs-json").textContent).toBe(json);

    await user.click(screen.getByRole("button", { name: "Copy logs" }));

    expect(mockCopyToClipboard).toHaveBeenCalledWith(json);
    expect(await screen.findByRole("button", { name: "Copied" })).toBeVisible();
  });

  it("goes back to the menu from the advanced logs step", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByTestId("account-settings-advanced-logs"));
    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(screen.getByTestId("account-settings-menu")).toBeVisible();
  });

  it("changes the account name from its own step", async () => {
    const { props, user } = renderDialog();

    await user.click(screen.getByTestId("account-settings-change-name"));

    expect(screen.getByText("Change account name")).toBeVisible();
    expect(screen.getByText(/BTC-Trading, BTC-DeFi/)).toBeVisible();
    const input = screen.getByTestId("account-settings-change-name-input");
    expect(input).toHaveValue("Bitcoin 1");
    expect(screen.getByRole("button", { name: "Change name" })).toBeDisabled();

    await user.clear(input);
    await user.type(input, "  My   savings ");
    await user.click(screen.getByRole("button", { name: "Change name" }));

    expect(props.onConfirmName).toHaveBeenCalledWith("My savings");
  });

  it("submits the new name with Enter", async () => {
    const { props, user } = renderDialog();

    await user.click(screen.getByTestId("account-settings-change-name"));
    const input = screen.getByTestId("account-settings-change-name-input");
    await user.clear(input);
    await user.type(input, "Savings{Enter}");

    expect(props.onConfirmName).toHaveBeenCalledWith("Savings");
    expect(input).toHaveValue("Savings");
  });

  it("ignores Enter while an input method is composing", async () => {
    const { props, user } = renderDialog();

    await user.click(screen.getByTestId("account-settings-change-name"));
    const input = screen.getByTestId("account-settings-change-name-input");
    await user.clear(input);
    await user.type(input, "Savings");
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });

    expect(props.onConfirmName).not.toHaveBeenCalled();
  });

  it("keeps the change name button disabled while the name can't be edited", async () => {
    const { user } = renderDialog({ isNameEditDisabled: true });

    await user.click(screen.getByTestId("account-settings-change-name"));
    await user.type(screen.getByTestId("account-settings-change-name-input"), " 2");

    expect(screen.getByRole("button", { name: "Change name" })).toBeDisabled();
  });

  it("goes back to the menu from the change name step", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByTestId("account-settings-change-name"));
    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(screen.getByTestId("account-settings-menu")).toBeVisible();
  });

  it("asks for confirmation before removing the account", async () => {
    const { props, user } = renderDialog();

    await user.click(screen.getByTestId("account-settings-remove-account"));

    expect(screen.getByText("Remove account?")).toBeVisible();
    expect(screen.getByTestId("dialog-status-gradient-error")).toBeInTheDocument();
    expect(screen.queryByTestId("account-settings-menu")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Yes, remove" }));
    await user.click(screen.getByRole("button", { name: "Keep" }));

    expect(props.onConfirmRemove).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("has no back button on the remove confirmation", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByTestId("account-settings-remove-account"));

    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
    expect(screen.getByText("Remove account?")).toBeVisible();
  });
});
