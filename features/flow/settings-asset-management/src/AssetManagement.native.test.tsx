import React from "react";
import { fireEvent, render, screen, userEvent, within } from "@testing-library/react-native";
import { SettingsPortProvider } from "@features/flow-settings";
import { createFakeAssetManagementPort } from "./__tests__/fakeAssetManagementPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { AssetManagement } from "./AssetManagement";
import type { AssetManagementSettingsValues, HiddenTokenGroup } from "./types";

jest.mock("@shared/analytics-react", () => ({ Track: () => null, TrackScreen: () => null }));
jest.mock("@ledgerhq/crypto-icons/native", () => () => null);

const HIDDEN_TOKENS: readonly HiddenTokenGroup[] = [
  {
    network: { id: "ethereum", name: "Ethereum" },
    tokens: [{ id: "ethereum/erc20/usd_tether__erc20_", name: "Tether USD", ticker: "USDT" }],
  },
  {
    network: { id: "polygon", name: "Polygon" },
    tokens: [{ id: "polygon/erc20/usd_coin", name: "USD Coin", ticker: "USDC" }],
  },
];

// The Lumen switch is stubbed in package tests: its change event is fired, a press does nothing.
const toggle = (testID: string, value: boolean) =>
  fireEvent(screen.getByTestId(testID), "checkedChange", value);

function renderSection(
  initial?: Partial<AssetManagementSettingsValues>,
  hiddenTokens?: readonly HiddenTokenGroup[],
) {
  const fake = createFakeAssetManagementPort(initial, hiddenTokens);
  render(
    <I18nWrapper>
      <SettingsPortProvider value={fake.port}>
        <AssetManagement testID="settings-assets" />
      </SettingsPortProvider>
    </I18nWrapper>,
  );
  return { ...fake, user: userEvent.setup() };
}

describe("AssetManagement on mobile", () => {
  it("shows the three rows with their descriptions", () => {
    renderSection();

    expect(screen.getByTestId("settings-assets")).toBeVisible();
    expect(screen.getByText("Hide empty token accounts")).toBeVisible();
    expect(screen.getByText("Hide token accounts with zero balance.")).toBeVisible();
    expect(screen.getByText("Hide token transactions when value is 0")).toBeVisible();
    expect(screen.getByText("Hidden tokens")).toBeVisible();
  });

  it("changes each setting from its toggle", () => {
    const { updates } = renderSection();

    toggle("setting-hideEmptyTokenAccounts-toggle", true);
    toggle("setting-filterTokenOperationsZeroAmount-toggle", true);

    expect(updates).toEqual([
      { key: "hideEmptyTokenAccounts", value: true },
      { key: "filterTokenOperationsZeroAmount", value: true },
    ]);
  });

  it("lists the hidden tokens under their network in the Manage sheet", async () => {
    const { user } = renderSection(undefined, HIDDEN_TOKENS);

    await user.press(screen.getByText("Manage"));

    expect(screen.getByTestId("settings-asset-management-hidden-tokens-header")).toHaveProp(
      "description",
      "Select a token to display it in Ledger Wallet",
    );
    expect(screen.getByText("Ethereum")).toBeVisible();
    expect(screen.getByText("Polygon")).toBeVisible();
    expect(
      within(screen.getByTestId("hidden-token-polygon/erc20/usd_coin")).getByText("USD Coin"),
    ).toBeVisible();
  });

  it("shows a hidden token again from its action", async () => {
    const { user, showToken } = renderSection(undefined, HIDDEN_TOKENS);

    await user.press(screen.getByText("Manage"));
    await user.press(screen.getByLabelText("Show Tether USD"));

    expect(showToken.mock.calls).toEqual([["ethereum/erc20/usd_tether__erc20_"]]);
  });

  it("says when no token is hidden", async () => {
    const { user } = renderSection();

    await user.press(screen.getByText("Manage"));

    expect(screen.getByText("You have no hidden tokens.")).toBeVisible();
  });
});
