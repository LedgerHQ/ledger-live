import React from "react";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { act, fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { blacklistToken, setHideEmptyTokenAccounts } from "~/actions/settings";
import SettingsNavigator from "~/components/RootNavigator/SettingsNavigator";
import {
  blacklistedTokenIdsSelector,
  filterTokenOperationsZeroAmountEnabledSelector,
  hideEmptyTokenAccountsEnabledSelector,
} from "~/reducers/settings";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

const mockFindTokenById = jest.fn();

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

const HIDE_EMPTY_TOGGLE = "setting-hideEmptyTokenAccounts-toggle";
const FILTER_ZERO_TOGGLE = "setting-filterTokenOperationsZeroAmount-toggle";

async function openAssetManagement() {
  const view = render(<SettingsNavigator />, {
    overrideInitialState: withFlagOverrides({ newSettings: { enabled: true } }, state => ({
      ...state,
      appLock: { ...state.appLock, isHydrated: true },
    })),
  });
  await view.user.press(await screen.findByTestId("settings-home-assetManagement"));
  expect(await screen.findByTestId("settings-asset-management")).toBeVisible();
  return view;
}

// The Lumen switch changes value rather than being pressed.
const turn = async (testID: string, value: boolean) => {
  const toggle = await screen.findByTestId(testID);

  await act(async () => {
    fireEvent(toggle, "checkedChange", value);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFindTokenById.mockImplementation(async (id: string) => (id === USDT.id ? USDT : undefined));
});

describe("Settings Asset management section (mobile)", () => {
  it("shows the two toggles and the hidden tokens", async () => {
    await openAssetManagement();

    expect(screen.getByText("Hide empty token accounts")).toBeVisible();
    expect(screen.getByText("Hide token transactions when value is 0")).toBeVisible();
    expect(screen.getByText("Hidden tokens")).toBeVisible();
    expect(screen.getByText("Manage")).toBeVisible();
  });

  it("stores each toggle in the app store, where the legacy screen reads it", async () => {
    const { store } = await openAssetManagement();
    const isFiltered = filterTokenOperationsZeroAmountEnabledSelector(store.getState());

    await turn(HIDE_EMPTY_TOGGLE, true);
    await turn(FILTER_ZERO_TOGGLE, !isFiltered);

    expect(hideEmptyTokenAccountsEnabledSelector(store.getState())).toBe(true);
    expect(filterTokenOperationsZeroAmountEnabledSelector(store.getState())).toBe(!isFiltered);
  });

  it("shows a change made elsewhere in the app", async () => {
    const { store } = await openAssetManagement();

    act(() => {
      store.dispatch(setHideEmptyTokenAccounts(true));
    });

    expect(screen.getByTestId(HIDE_EMPTY_TOGGLE)).toBeChecked();
  });

  it("lists the hidden tokens under their network and shows one again", async () => {
    const { user, store } = await openAssetManagement();
    act(() => {
      store.dispatch(blacklistToken(USDT.id));
    });

    await user.press(screen.getByText("Manage"));

    expect(await screen.findByText("Tether USD")).toBeVisible();
    expect(screen.getByText("Ethereum")).toBeVisible();

    await user.press(screen.getByLabelText("Show Tether USD"));

    expect(blacklistedTokenIdsSelector(store.getState())).not.toContain(USDT.id);
    expect(await screen.findByText("You have no hidden tokens.")).toBeVisible();
  });
});
