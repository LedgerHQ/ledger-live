import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper, onLinkOpened, openExternal } from "../../__tests__/i18nWrapper";
import { advancedLogsInput } from "../../__tests__/fixtures";
import { buildAdvancedLogs } from "../../logic/buildAdvancedLogs";
import { AccountSettings } from "./AccountSettings.web";
import type { AccountSettingsAccount, AccountSettingsAdapter } from "./types.web";

jest.mock("@shared/clipboard", () => ({ copyToClipboard: jest.fn() }));

const account: AccountSettingsAccount = {
  ...advancedLogsInput,
  type: "Account",
  freshAddress: "bc1qaddress",
  currency: { name: "Bitcoin", ticker: "BTC", explorerViews: [] },
};

function renderSettings(
  overrides: Partial<AccountSettingsAdapter<AccountSettingsAccount>> = {},
  settingsAccount: AccountSettingsAccount = account,
) {
  const adapter: AccountSettingsAdapter<AccountSettingsAccount> = {
    isNameEditDisabled: false,
    locale: "en-US",
    getAccountName: jest.fn(() => "Bitcoin 1"),
    getDerivationTag: jest.fn(() => "native segwit"),
    renameAccount: jest.fn(),
    removeAccount: jest.fn(),
    ...overrides,
  };
  const onClose = jest.fn();
  render(
    <AccountSettings
      account={settingsAccount}
      adapter={adapter}
      isOpen
      onClose={onClose}
      testID="settings"
    />,
    { wrapper: I18nWrapper },
  );
  return { adapter, onClose, user: userEvent.setup() };
}

describe("AccountSettings (Web)", () => {
  it("reads the account name through the adapter", () => {
    const { adapter } = renderSettings();

    expect(adapter.getAccountName).toHaveBeenCalledWith(account);
    expect(screen.getByText("Bitcoin 1")).toBeVisible();
  });

  it("renames the account with the validated name, then closes", async () => {
    const { adapter, onClose, user } = renderSettings();

    await user.click(screen.getByTestId("account-settings-change-name"));
    const input = screen.getByTestId("account-settings-change-name-input");
    await user.clear(input);
    await user.type(input, "  My   savings {Enter}");

    expect(adapter.renameAccount).toHaveBeenCalledWith(account, "My savings");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the change name button disabled when the adapter disables editing", async () => {
    const { user } = renderSettings({ isNameEditDisabled: true });

    await user.click(screen.getByTestId("account-settings-change-name"));
    await user.type(screen.getByTestId("account-settings-change-name-input"), " 2");

    expect(screen.getByRole("button", { name: "Change name" })).toBeDisabled();
  });

  it("builds the advanced logs from the account, the locale and the derivation tag", async () => {
    const { adapter, user } = renderSettings();

    await user.click(screen.getByTestId("account-settings-advanced-logs"));

    expect(adapter.getDerivationTag).toHaveBeenCalledWith(account);
    expect(screen.getByText(/This is a native segwit xpub/)).toBeVisible();
    expect(screen.getByTestId("account-settings-advanced-logs-json").textContent).toBe(
      buildAdvancedLogs(advancedLogsInput, "en-US").json,
    );
  });

  it("leaves an empty xpub out of the logs", async () => {
    const { user } = renderSettings({}, { ...account, xpub: "" });

    await user.click(screen.getByTestId("account-settings-advanced-logs"));

    const logs = screen.getByTestId("account-settings-advanced-logs-json").textContent;
    expect(JSON.parse(logs ?? "{}")).not.toHaveProperty("xpub");
  });

  it("opens the account address in the currency explorer", async () => {
    const { user } = renderSettings(
      {},
      {
        ...account,
        currency: {
          ...account.currency,
          explorerViews: [{ address: "https://explorer.test/address/$address" }],
        },
      },
    );

    await user.click(screen.getByTestId("account-settings-view-explorer"));

    expect(openExternal).toHaveBeenCalledWith("https://explorer.test/address/bc1qaddress");
    expect(onLinkOpened).toHaveBeenCalledWith("https://explorer.test");
    expect(onLinkOpened).not.toHaveBeenCalledWith(expect.stringContaining("bc1qaddress"));
  });

  it("removes the account, then closes", async () => {
    const { adapter, onClose, user } = renderSettings();

    await user.click(screen.getByTestId("account-settings-remove-account"));
    await user.click(screen.getByRole("button", { name: "Yes, remove" }));

    expect(adapter.removeAccount).toHaveBeenCalledWith(account);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes without removing the account when the user keeps it", async () => {
    const { adapter, onClose, user } = renderSettings();

    await user.click(screen.getByTestId("account-settings-remove-account"));
    await user.click(screen.getByRole("button", { name: "Keep" }));

    expect(adapter.removeAccount).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides View in explorer when the account currency has no explorer", () => {
    renderSettings();

    expect(screen.queryByTestId("account-settings-view-explorer")).toBeNull();
  });
});
