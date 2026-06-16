import * as React from "react";
import {
  act,
  fireEvent,
  renderWithReactQuery,
  screen,
  waitFor,
  withFlagOverrides,
} from "@tests/test-renderer";
import { http, HttpResponse, server } from "@tests/server";
import marketsMock from "@mocks/api/market/markets.json";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import MarketNavigator from "../Navigator";
import { MARKET_SCREEN_TEST_IDS } from "../screens/MarketScreen/testIds";

jest.mock("LLM/features/Market/screens//MarketDetail", () => () => null);

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

const NavigatorWrapper = () => (
  <Stack.Navigator initialRouteName={ScreenName.MarketList}>
    {MarketNavigator({ Stack })}
  </Stack.Navigator>
);

const enableAssetDiscoverability = withFlagOverrides({
  lwmWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

function withStarredMarketCoins(starredMarketCoins: string[] = []) {
  return withFlagOverrides(
    { lwmWallet40: { enabled: true, params: { assetDiscoverability: true } } },
    (state: State): State => ({
      ...state,
      settings: { ...state.settings, starredMarketCoins },
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

function installCapturedMarketHandlers(marketRequests: string[], dadaRequests: string[]) {
  // The dedicated CVS `tokenized-stock` category is authoritative, so it returns only stocks.
  const stockMarketsMock: typeof marketsMock = [
    {
      ...marketsMock[0],
      id: "tesla-xstock",
      ledgerIds: ["ethereum/erc20/tesla_xstock_0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0"],
      ticker: "tslax",
      name: "Tesla xStock",
      marketCapRank: 528,
      price: 411.28,
    },
  ];

  server.use(
    http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
      marketRequests.push(request.url);
      const searchParams = new URL(request.url).searchParams;
      const filter = searchParams.get("filter")?.toLowerCase();
      const categories = searchParams.get("categories");
      const ids = searchParams.get("ids")?.split(",") ?? [];

      let filteredData = marketsMock;
      if (categories === "tokenized-stock") {
        filteredData = stockMarketsMock;
      } else if (filter) {
        filteredData = marketsMock.filter(
          ({ name, ticker }) =>
            ticker.toLowerCase().includes(filter) || name.toLowerCase().includes(filter),
        );
      } else if (ids.length > 0) {
        filteredData = marketsMock.filter(({ id }) => ids.includes(id));
      }

      const page = parseInt(searchParams.get("page") || "0");
      const pageSize = 10;
      return HttpResponse.json(filteredData.slice(page * pageSize, (page + 1) * pageSize));
    }),
    http.get("https://dada.api.ledger-test.com/v1/assets", ({ request }) => {
      dadaRequests.push(request.url);
      return HttpResponse.json({});
    }),
    http.get("https://dada.api.ledger.com/v1/assets", ({ request }) => {
      dadaRequests.push(request.url);
      return HttpResponse.json({});
    }),
  );
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
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsFilterButton)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher)).toBeVisible();
    expect(
      screen.getByTestId(`${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-all`),
    ).toBeVisible();
    expect(
      screen.getByTestId(`${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-stocks`),
    ).toBeVisible();
    expect(
      screen.getByTestId(`${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-starred`),
    ).toBeVisible();
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
    const { user } = renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: withStarredMarketCoins(),
    });

    await waitFor(() => expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible(), {
      timeout: 5000,
    });

    await user.press(
      screen.getByTestId(`${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-starred`),
    );

    await waitFor(() => {
      expect(screen.getByText("No favorites yet")).toBeVisible();
    });
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsFavoritesEmptyIcon)).toBeVisible();
    expect(screen.queryByTestId("marketItem-bitcoin")).toBeNull();
  });

  it("renders only starred market coins in the Favorites category", async () => {
    const { user } = renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: withStarredMarketCoins(["bitcoin"]),
    });

    await waitFor(() => expect(screen.getByTestId("marketItem-ethereum")).toBeVisible(), {
      timeout: 5000,
    });

    await user.press(
      screen.getByTestId(`${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-starred`),
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
      },
      { timeout: 5000 },
    );

    expect(screen.queryByTestId("marketItem-ethereum")).toBeNull();
  });

  it("renders CVS stock rows after selecting the Stocks category", async () => {
    const marketRequests: string[] = [];
    const dadaRequests: string[] = [];
    installCapturedMarketHandlers(marketRequests, dadaRequests);

    renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableAssetDiscoverability,
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
      },
      { timeout: 5000 },
    );

    fireEvent.press(screen.getByTestId(`${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-stocks`));

    await waitFor(
      () => {
        expect(screen.getByTestId("marketItem-tesla-xstock")).toBeVisible();
      },
      { timeout: 5000 },
    );

    const stockMarketRequest = marketRequests.find(
      url => new URL(url).searchParams.get("categories") === "tokenized-stock",
    );
    const dadaStocksRequests = dadaRequests.filter(
      url => new URL(url).searchParams.get("categories") === "stocks",
    );

    expect(stockMarketRequest).toBeDefined();
    expect(dadaStocksRequests).toEqual([]);
    expect(screen.getByText("Tesla xStock")).toBeVisible();
    expect(screen.getByText("Stocks")).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher)).toBeVisible();
    expect(screen.queryByTestId("marketItem-bitcoin")).toBeNull();
    expect(screen.queryByTestId("marketItem-rif-token")).toBeNull();
  });

  it("renders trending categories and filters the list by the selected one", async () => {
    const marketRequests: string[] = [];

    server.use(
      http.get("https://countervalues.live.ledger.com/v3/categories/trending", () =>
        HttpResponse.json([{ id: "infrastructure", name: "Infrastructure" }]),
      ),
      http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
        marketRequests.push(request.url);
        const searchParams = new URL(request.url).searchParams;
        const category = searchParams.get("categories");
        const page = parseInt(searchParams.get("page") || "0");
        const pageSize = 10;

        const data =
          category === "infrastructure"
            ? [{ ...marketsMock[0], id: "rif-token", ticker: "rif", name: "Rootstock Infra" }]
            : marketsMock;

        return HttpResponse.json(data.slice(page * pageSize, (page + 1) * pageSize));
      }),
    );

    const { user } = renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableAssetDiscoverability,
    });

    await waitFor(() => expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible(), {
      timeout: 5000,
    });

    const trendingTab = await screen.findByTestId(
      `${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-infrastructure`,
    );
    expect(screen.getByText("Infrastructure")).toBeVisible();

    await user.press(trendingTab);

    await waitFor(() => expect(screen.getByTestId("marketItem-rif-token")).toBeVisible(), {
      timeout: 5000,
    });

    const categoryRequest = marketRequests.find(
      url => new URL(url).searchParams.get("categories") === "infrastructure",
    );
    expect(categoryRequest).toBeDefined();
    expect(screen.queryByTestId("marketItem-bitcoin")).toBeNull();
  });

  it("switches categories from the tabs, including back to All", async () => {
    const marketRequests: string[] = [];
    const dadaRequests: string[] = [];
    installCapturedMarketHandlers(marketRequests, dadaRequests);

    const { user } = renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableAssetDiscoverability,
    });

    await waitFor(() => expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible(), {
      timeout: 5000,
    });

    await user.press(screen.getByTestId(`${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-stocks`));
    await waitFor(() => expect(screen.getByTestId("marketItem-tesla-xstock")).toBeVisible(), {
      timeout: 5000,
    });
    expect(screen.queryByTestId("marketItem-bitcoin")).toBeNull();

    await user.press(screen.getByTestId(`${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-all`));
    await waitFor(() => expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible(), {
      timeout: 5000,
    });
    expect(screen.queryByTestId("marketItem-tesla-xstock")).toBeNull();
  });
});
