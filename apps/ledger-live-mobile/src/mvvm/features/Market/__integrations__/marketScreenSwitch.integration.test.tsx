import * as React from "react";
import { renderWithReactQuery, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import MarketNavigator from "../Navigator";
import { MARKET_SCREEN_TEST_IDS } from "../screens/MarketScreen/testIds";

const COUNTERVALUES_API = "https://countervalues.live.ledger.com";
const FEAR_AND_GREED_API = "https://proxycmc.api.live.ledger.com/v3/fear-and-greed/latest";

const FEAR_AND_GREED_RESPONSE = {
  data: { value: 70, value_classification: "Greed", update_time: "2026-01-14T12:00:00Z" },
  status: {
    timestamp: "2026-01-14T12:00:00Z",
    error_code: 0,
    error_message: "",
    elapsed: 10,
    credit_count: 1,
  },
};

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

const NavigatorWrapper = () => (
  <Stack.Navigator initialRouteName={ScreenName.MarketList}>
    {MarketNavigator({ Stack })}
  </Stack.Navigator>
);

const enableAssetDiscoverability = withFlagOverrides({
  lwmWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

describe("Market screen navigator switch", () => {
  beforeEach(() => {
    server.use(
      http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json(MOCK_MARKET_PERFORMERS)),
      http.get(FEAR_AND_GREED_API, () => HttpResponse.json(FEAR_AND_GREED_RESPONSE)),
    );
  });

  it("should render MarketList when asset discoverability is off", async () => {
    renderWithReactQuery(<NavigatorWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId("market-list")).toBeVisible();
    });
    expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.screen)).toBeNull();
  });

  it("should render the new MarketScreen with its blocks when asset discoverability is on", async () => {
    renderWithReactQuery(<NavigatorWrapper />, {
      overrideInitialState: enableAssetDiscoverability,
    });

    await waitFor(() => {
      expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.screen)).toBeVisible();
    });
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.searchBar)).toBeVisible();
    expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.list)).toBeVisible();

    // Block 2 swaps from the loading skeleton to the highlight carousel once data is ready.
    await waitFor(() => {
      expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.highlights)).toBeVisible();
    });
    expect(screen.getAllByTestId(MARKET_SCREEN_TEST_IDS.highlightCard).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("market-list")).toBeNull();
  });
});
