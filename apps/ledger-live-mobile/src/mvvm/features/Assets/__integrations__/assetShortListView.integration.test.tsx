import React from "react";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { MockedAccounts } from "../../Accounts/__integrations__/mockedAccounts";
import { AssetShortListView } from "../components/AssetsShortListView";
import { ScreenName } from "~/const";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Props } from "../hooks/useAssetsListViewModel";
import {
  createFixtureAccount,
  createFixtureTokenAccount,
} from "@ledgerhq/live-common/mock/fixtures/cryptoCurrencies";
import type { Account } from "@ledgerhq/types-live";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

const createMockEthAccountWithUSDC = (): Account => {
  const ethAccount = createFixtureAccount("01");
  const usdcSubAccount = createFixtureTokenAccount("01", usdcToken);
  return {
    ...ethAccount,
    subAccounts: [{ ...usdcSubAccount, parentId: ethAccount.id }],
  };
};

jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculate: ({ value }: { value: number }) => value,
}));

const INITIAL_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: MockedAccounts,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
    },
  }),
};

const Stack = createNativeStackNavigator();

const renderComponent = (
  props: Omit<Props, "sourceScreenName"> = {},
  overrideInitialState?: (state: State) => State,
) => {
  const ScreenComponent = () => (
    <AssetShortListView sourceScreenName={ScreenName.Portfolio} {...props} />
  );

  const baseOverride = INITIAL_STATE.overrideInitialState;
  const composedOverride = overrideInitialState
    ? (state: State) => overrideInitialState(baseOverride(state))
    : baseOverride;

  return render(
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TestScreen" component={ScreenComponent} />
    </Stack.Navigator>,
    { overrideInitialState: composedOverride },
  );
};

describe("AssetShortListView", () => {
  it("should render all assets when no limit is set", async () => {
    renderComponent({});

    const assetsList = screen.getByTestId("AssetsList");
    expect(assetsList).toBeVisible();

    // MockedAccounts has 7 accounts across 7 currencies + 1 USDT token = 8 assets.
    // Linea is remapped to Ethereum via the DADA ethereum meta-currency.
    const expectedAssetCount = 8;
    const assetNames = await screen.findAllByTestId(/^assetItem-.+-name$/);
    const balanceElements = screen.getAllByTestId(/^assetItem-.+-balance$/);
    const tickerElements = screen.getAllByTestId(/^assetItem-.+-ticker$/);
    // Delta component renders "−" placeholder when percentage is 0/null/NaN
    // (testID is not propagated in the placeholder branch)
    const minusSigns = screen.getAllByText("−");

    expect(assetNames.length).toBe(expectedAssetCount);
    expect(balanceElements.length).toBe(expectedAssetCount);
    expect(tickerElements.length).toBe(expectedAssetCount);
    expect(minusSigns.length).toBe(expectedAssetCount);
  });

  it("should render asset currency names", async () => {
    renderComponent({});
    // Use testIDs to avoid ambiguity (e.g. "Dash" name vs "DASH" ticker).
    // Linea is remapped to Ethereum via the DADA ethereum meta-currency.
    expect(await screen.findByTestId("assetItem-Cronos-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Dash-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Dogecoin-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Energy Web-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Ethereum Classic-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Ethereum-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-NEAR-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Tether-name")).toBeVisible();
  });

  it("should limit the number of displayed assets", async () => {
    renderComponent({ limitNumberOfAssets: 3 });
    const assetNames = await screen.findAllByTestId(/^assetItem-.+-name$/);
    expect(assetNames.length).toBe(3);
  });

  it("should render an empty list when there are no accounts", () => {
    renderComponent({}, (state: State) => ({
      ...state,
      accounts: { ...state.accounts, active: [] },
    }));

    const assetsList = screen.getByTestId("AssetsList");
    expect(assetsList).toBeVisible();
    expect(screen.queryAllByTestId(/^assetItem-.+-name$/).length).toBe(0);
  });

  describe("blacklisted tokens", () => {
    const mockStateWithBlacklistedToken = (state: State): State => {
      const mockEthAccountWithUSDC = createMockEthAccountWithUSDC();
      return {
        ...state,
        accounts: { ...state.accounts, active: [mockEthAccountWithUSDC] },
        settings: { ...state.settings, counterValue: "USD", blacklistedTokenIds: [usdcToken.id] },
      };
    };
    const mockStateWithNonBlacklistedToken = (state: State): State => {
      const mockEthAccountWithUSDC = createMockEthAccountWithUSDC();
      return {
        ...state,
        accounts: { ...state.accounts, active: [mockEthAccountWithUSDC] },
        settings: { ...state.settings, counterValue: "USD", blacklistedTokenIds: [] },
      };
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should display a token that is not blacklisted", async () => {
      renderComponent({}, mockStateWithNonBlacklistedToken);
      expect(await screen.findByText(usdcToken.name)).toBeVisible();
    });

    it("should not display a blacklisted token", async () => {
      renderComponent({}, mockStateWithBlacklistedToken);
      // Wait for the parent asset to load so the empty-token assertion is not a false positive.
      expect(await screen.findByTestId("assetItem-Ethereum-name")).toBeVisible();
      expect(screen.queryByText(usdcToken.name)).toBeNull();
    });

    it("should not display a blacklisted parent CryptoCurrency", async () => {
      const mockStateWithBlacklistedEthereum = (state: State): State => {
        const mockEthAccountWithUSDC = createMockEthAccountWithUSDC();
        return {
          ...state,
          accounts: { ...state.accounts, active: [mockEthAccountWithUSDC] },
          settings: { ...state.settings, counterValue: "USD", blacklistedTokenIds: ["ethereum"] },
        };
      };

      renderComponent({}, mockStateWithBlacklistedEthereum);
      // Wait for the token sibling so the missing-parent assertion is not a false positive.
      expect(await screen.findByText(usdcToken.name)).toBeVisible();
      expect(screen.queryByTestId("assetItem-Ethereum-name")).toBeNull();
    });
  });

  it("should handle asset press", async () => {
    const { user } = renderComponent({ limitNumberOfAssets: 3 });
    const assetItems = await screen.findAllByTestId(
      /^assetItem-(?!.*-(name|ticker|balance|delta)$)/,
    );
    expect(assetItems.length).toBe(3);

    // Press the first asset — should not throw
    await user.press(assetItems[0]);
  });
});
