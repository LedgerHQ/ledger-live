import React from "react";
import { Route, Routes } from "react-router";
import { act, render, screen, waitFor, within, withFlagOverrides } from "tests/testSetup";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { getEnv } from "@shared/env";
import { SettingsRoute } from "LLD/features/Settings";
import { blacklistToken, saveSettings } from "~/renderer/actions/settings";
import {
  blacklistedTokenIdsSelector,
  filterTokenOperationsZeroAmountSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";

const mockSync = jest.fn();
const mockFindTokenById = jest.fn();

jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  useBridgeSync: () => mockSync,
}));

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore"),
  getCryptoAssetsStore: () => ({ findTokenById: mockFindTokenById }),
}));

const USDT: TokenCurrency = {
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd_tether__erc20_"),
  type: "TokenCurrency",
  name: "Tether USD",
  ticker: "USDT",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
  tokenType: "erc20",
  units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
};

function renderAssetManagement(isFlagEnabled = true) {
  return render(
    <Routes>
      <Route
        path="/settings/*"
        element={<SettingsRoute legacySettings={<span>Legacy settings</span>} />}
      />
    </Routes>,
    {
      initialRoute: "/settings/assetManagement",
      initialState: withFlagOverrides({ newSettings: { enabled: isFlagEnabled } }),
    },
  );
}

describe("Settings Asset management section", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindTokenById.mockImplementation(async (id: string) => (id === USDT.id ? USDT : undefined));
  });

  it("keeps the legacy Settings when the flag is off", () => {
    renderAssetManagement(false);

    expect(screen.getByText("Legacy settings")).toBeVisible();
    expect(screen.queryByTestId("settings-asset-management")).not.toBeInTheDocument();
  });

  it("shows the three rows of the section", () => {
    renderAssetManagement();

    expect(screen.getByTestId("settings-asset-management")).toBeVisible();
    expect(screen.getByText("Hide empty token accounts")).toBeVisible();
    expect(screen.getByText("Hide token transactions when value is 0")).toBeVisible();
    expect(screen.getByText("Hidden tokens")).toBeVisible();
    expect(screen.getByRole("button", { name: "Manage" })).toBeVisible();
  });

  it("hides the empty token accounts in the app store and on every thread", async () => {
    const { user, store } = renderAssetManagement();
    expect(hideEmptyTokenAccountsSelector(store.getState())).toBe(false);

    await user.click(screen.getByTestId("setting-hideEmptyTokenAccounts-toggle"));

    expect(hideEmptyTokenAccountsSelector(store.getState())).toBe(true);
    expect(getEnv("HIDE_EMPTY_TOKEN_ACCOUNTS")).toBe(true);
  });

  it("changes the token transactions filter in the app store and on every thread", async () => {
    const { user, store } = renderAssetManagement();
    const isFiltered = filterTokenOperationsZeroAmountSelector(store.getState());

    await user.click(screen.getByTestId("setting-filterTokenOperationsZeroAmount-toggle"));

    expect(filterTokenOperationsZeroAmountSelector(store.getState())).toBe(!isFiltered);
    expect(getEnv("FILTER_ZERO_AMOUNT_ERC20_EVENTS")).toBe(!isFiltered);
  });

  it("shows a change made elsewhere in the app", () => {
    const { store } = renderAssetManagement();

    act(() => {
      store.dispatch(
        saveSettings({ hideEmptyTokenAccounts: true, filterTokenOperationsZeroAmount: false }),
      );
    });

    expect(screen.getByTestId("setting-hideEmptyTokenAccounts-toggle")).toBeChecked();
    expect(screen.getByTestId("setting-filterTokenOperationsZeroAmount-toggle")).not.toBeChecked();
  });

  it("lists the hidden tokens under their network and shows one again", async () => {
    const { user, store } = renderAssetManagement();
    act(() => {
      store.dispatch(blacklistToken(USDT.id));
    });

    await user.click(screen.getByRole("button", { name: "Manage" }));
    const dialog = await screen.findByTestId("settings-asset-management-hidden-tokens");

    expect(await within(dialog).findByText("Tether USD")).toBeVisible();
    expect(within(dialog).getByText("Ethereum")).toBeVisible();

    await user.click(within(dialog).getByRole("button", { name: "Show Tether USD" }));

    expect(blacklistedTokenIdsSelector(store.getState())).not.toContain(USDT.id);
    await waitFor(() => {
      expect(within(dialog).getByText("You have no hidden tokens.")).toBeVisible();
    });
  });

  it("resyncs the accounts once the hidden tokens dialog closes", async () => {
    const { user } = renderAssetManagement();

    await user.click(screen.getByRole("button", { name: "Manage" }));
    const dialog = await screen.findByTestId("settings-asset-management-hidden-tokens");
    expect(mockSync).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(mockSync).toHaveBeenCalledWith({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "tokens-ignore-list-change",
    });
  });
});
