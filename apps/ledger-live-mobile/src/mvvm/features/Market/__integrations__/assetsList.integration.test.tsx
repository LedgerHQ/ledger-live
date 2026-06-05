import * as React from "react";
import {
  act,
  renderWithReactQuery,
  screen,
  waitFor,
  withFlagOverrides,
} from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import MarketNavigator from "../Navigator";
import { MARKET_SCREEN_TEST_IDS } from "../screens/MarketScreen/testIds";

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

const NavigatorWrapper = () => (
  <Stack.Navigator initialRouteName={ScreenName.MarketList}>
    {MarketNavigator({ Stack })}
  </Stack.Navigator>
);

const enableAssetDiscoverability = withFlagOverrides({
  lwmWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

function enableFavoritesCategory(starredMarketCoins: string[] = []) {
  return withFlagOverrides(
    { lwmWallet40: { enabled: true, params: { assetDiscoverability: true } } },
    (state: State): State => ({
      ...state,
      settings: { ...state.settings, starredMarketCoins },
      marketListConfig: { ...state.marketListConfig, category: "starred" },
    }),
  );
}

function hasTestID(node: React.ReactNode, testID: string): boolean {
  if (Array.isArray(node)) return node.some(child => hasTestID(child, testID));
  if (!React.isValidElement(node)) return false;

  const props = node.props as { testID?: string; children?: React.ReactNode };

  if (props.testID === testID) return true;

  return React.Children.toArray(props.children).some(child => hasTestID(child, testID));
}

describe("MarketScreen assets list (Block 3)", () => {
  it("renders the Assets subheader and the market rows from the API", async () => {
    renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableAssetDiscoverability,
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
      },
      { timeout: 5000 },
    );

    expect(
      hasTestID(
        screen.getByTestId(MARKET_SCREEN_TEST_IDS.list).props.ListHeaderComponent,
        MARKET_SCREEN_TEST_IDS.searchBar,
      ),
    ).toBe(false);
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsSubHeader)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher)).toBeVisible();
    expect(screen.getByText("All")).toBeVisible();
    expect(screen.getByText("Stocks")).toBeVisible();
    expect(screen.getByText("Favorites")).toBeVisible();
    expect(screen.getByTestId("marketItem-ethereum")).toBeVisible();
    expect(screen.getByTestId("marketItem-bitcoin-price")).toBeVisible();
  });

  it("updates the search input and collapses the other market sections while searching", async () => {
    renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableAssetDiscoverability,
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
      },
      { timeout: 5000 },
    );

    act(() => {
      screen.getByTestId(MARKET_SCREEN_TEST_IDS.searchBar).props.onChangeText("e");
    });
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.searchBar).props.value).toBe("e");

    expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.highlights)).toBeNull();
    expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.assetsSubHeader)).toBeNull();
    expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher)).toBeNull();

    act(() => {
      screen.getByTestId(MARKET_SCREEN_TEST_IDS.searchBar).props.onChangeText("");
    });

    await waitFor(
      () => {
        expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.highlights)).toBeVisible();
        expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsSubHeader)).toBeVisible();
        expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher)).toBeVisible();
        expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
      },
      { timeout: 5000 },
    );
  });

  it("renders the favorites empty state when no market coin is starred", async () => {
    renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableFavoritesCategory(),
    });

    await waitFor(() => {
      expect(screen.getByText("No favorites yet")).toBeVisible();
    });

    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsFavoritesEmptyIcon)).toBeVisible();
    expect(screen.queryByTestId("marketItem-bitcoin")).toBeNull();
  });

  it("renders only starred market coins in the Favorites category", async () => {
    renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableFavoritesCategory(["bitcoin"]),
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
      },
      { timeout: 5000 },
    );

    expect(screen.queryByTestId("marketItem-ethereum")).toBeNull();
  });
});
