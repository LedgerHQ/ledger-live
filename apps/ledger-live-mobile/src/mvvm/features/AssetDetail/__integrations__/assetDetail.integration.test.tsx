import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { mockBtcCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AssetDetailNavigator from "../Navigator";
import { ASSET_DETAIL_TEST_IDS } from "../testIds";

const mockIsCurrencyAvailable = jest.fn().mockReturnValue(false);

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: mockIsCurrencyAvailable }),
}));

const Stack = createNativeStackNavigator();

function AssetDetailTestNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={NavigatorName.AssetDetail}
        component={AssetDetailNavigator}
        initialParams={{
          screen: ScreenName.AssetDetail,
          params: { currencyId: "bitcoin" },
        }}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function withBtcAccounts(count: number, operationsSize = 0) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: Array.from({ length: count }, (_, i) =>
          genAccount(`bitcoin-${i}`, { currency: mockBtcCryptoCurrency, operationsSize }),
        ),
      },
    }),
  };
}

describe("AssetDetail screen layout", () => {
  beforeEach(() => {
    mockIsCurrencyAvailable.mockReturnValue(false);
  });

  it("renders all section placeholders and BalanceGraph", () => {
    render(<AssetDetailTestNavigator />);

    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.balanceGraph)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.marketStats)).toBeVisible();
    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.transactions)).toBeNull();
  });

  it("hides balance details when there are no accounts", () => {
    render(<AssetDetailTestNavigator />);
    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.balanceDetails)).toBeNull();
  });

  it("renders balance details with transfer button when accounts exist", () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(2));
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.balanceDetails)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.totalBalance)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.transferButton)).toBeVisible();
    expect(screen.getByText("Total balance")).toBeVisible();
    expect(screen.getByText("Transfer")).toBeVisible();
  });

  it("renders the market price section with title and chart placeholder", () => {
    render(<AssetDetailTestNavigator />);

    expect(screen.getByText("Market price")).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.chartPlaceholder)).toBeVisible();
    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeNull();
  });

  it("hides the addresses section when there are no accounts", () => {
    render(<AssetDetailTestNavigator />);

    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeNull();
  });

  it("renders the addresses section when accounts exist", () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(2));

    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible();
    expect(screen.getByText("Addresses")).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addAccount)).toBeVisible();
    expect(screen.getByText("Add")).toBeVisible();
  });

  it("hides the transactions section when there are no operations", () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(2, 0));

    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.transactions)).toBeNull();
  });

  it("renders the transactions section when operations exist", () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(1, 5));

    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.transactions)).toBeVisible();
    expect(screen.getByText("Transactions")).toBeVisible();
  });

  describe("floating bar CTAs", () => {
    it("hides the floating bar when Buy is unavailable", () => {
      render(<AssetDetailTestNavigator />);

      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeNull();
    });

    it("renders the Buy button when Buy is available", () => {
      mockIsCurrencyAvailable.mockReturnValue(true);

      render(<AssetDetailTestNavigator />);

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeVisible();
      expect(screen.getByText("Buy")).toBeVisible();
    });
  });
});
