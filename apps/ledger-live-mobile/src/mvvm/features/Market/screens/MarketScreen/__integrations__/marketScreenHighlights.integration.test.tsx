import * as React from "react";
import { renderWithReactQuery, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { server, http, HttpResponse, delay } from "@tests/server";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import MarketNavigator from "../../../Navigator";
import { MARKET_SCREEN_TEST_IDS } from "../testIds";

const COUNTERVALUES_API = "https://countervalues.live.ledger.com";
const FEAR_AND_GREED_API = "https://proxycmc.api.live.ledger.com/v3/fear-and-greed/latest";
const FEAR_AND_GREED_CARD = "fear-and-greed-expanded-card";
const FEAR_AND_GREED_DESCRIPTION =
  /Shows overall market sentiment from 0 to 100, based on trends and activity. Use it to understand how the market is behaving: lower values indicate fear, higher values indicate greed./i;

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

const renderMarketScreen = () =>
  renderWithReactQuery(<NavigatorWrapper />, { overrideInitialState: enableAssetDiscoverability });

describe("Market screen highlights (Block 2)", () => {
  beforeEach(() => {
    server.use(
      http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json(MOCK_MARKET_PERFORMERS)),
    );
  });

  describe("Fear & Greed expanded card", () => {
    it("renders the Fear & Greed card as the first Block 2 card", async () => {
      server.use(http.get(FEAR_AND_GREED_API, () => HttpResponse.json(FEAR_AND_GREED_RESPONSE)));

      renderMarketScreen();

      expect(await screen.findByTestId(FEAR_AND_GREED_CARD)).toBeVisible();
    });

    it("opens the shared definition drawer when the card is pressed", async () => {
      server.use(http.get(FEAR_AND_GREED_API, () => HttpResponse.json(FEAR_AND_GREED_RESPONSE)));

      const { user } = renderMarketScreen();

      const card = await screen.findByTestId(FEAR_AND_GREED_CARD);
      await user.press(card);

      expect(await screen.findByText(FEAR_AND_GREED_DESCRIPTION)).toBeVisible();
    });
  });

  describe("Loading state", () => {
    it("replaces the whole Block 2 with a skeleton while the highlights data loads", async () => {
      server.use(
        http.get(FEAR_AND_GREED_API, async () => {
          await delay("infinite");
          return HttpResponse.json(FEAR_AND_GREED_RESPONSE);
        }),
      );

      renderMarketScreen();

      expect(await screen.findByTestId(MARKET_SCREEN_TEST_IDS.highlightsSkeleton)).toBeVisible();
      expect(screen.queryByTestId(MARKET_SCREEN_TEST_IDS.highlights)).toBeNull();
      expect(screen.queryByTestId(FEAR_AND_GREED_CARD)).toBeNull();
    });
  });

  describe("Error state", () => {
    it("keeps the carousel without the Fear & Greed card when its data fails", async () => {
      server.use(
        http.get(FEAR_AND_GREED_API, () => new HttpResponse(null, { status: 500 })),
      );

      renderMarketScreen();

      await waitFor(() => {
        expect(screen.getByTestId(MARKET_SCREEN_TEST_IDS.highlights)).toBeVisible();
      });
      expect(screen.queryByTestId(FEAR_AND_GREED_CARD)).toBeNull();
    });
  });
});
