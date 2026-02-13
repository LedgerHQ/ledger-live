import React from "react";
import { renderWithReactQuery, screen, waitFor } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";
import {
  NetInfoStateType,
  useNetInfo,
  type NetInfoState,
  type NetInfoNoConnectionState,
  type NetInfoUnknownState,
} from "@react-native-community/netinfo";
import MarketList from "../index";
import { ScreenName } from "~/const";
import { State } from "~/reducers/types";

jest.mock("@react-native-community/netinfo", () => {
  const mockUseNetInfo = jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: "unknown",
    details: null,
  }));

  return {
    NetInfoStateType: {
      unknown: "unknown",
      none: "none",
    },
    useNetInfo: mockUseNetInfo,
  };
});

type NetInfoOverride =
  | ({
      type: NetInfoStateType.none;
    } & Partial<Omit<NetInfoNoConnectionState, "type">>)
  | ({
      type?: NetInfoStateType.unknown;
    } & Partial<Omit<NetInfoUnknownState, "type">>);

const buildNetInfoState = (override?: NetInfoOverride): NetInfoState => {
  if (override?.type === NetInfoStateType.none) {
    const noConnectionBase: NetInfoNoConnectionState = {
      type: NetInfoStateType.none,
      isConnected: false,
      isInternetReachable: false,
      details: null,
    };
    return { ...noConnectionBase, ...override };
  }
  const unknownBase: NetInfoUnknownState = {
    type: NetInfoStateType.unknown,
    isConnected: null,
    isInternetReachable: null,
    details: null,
  };
  return { ...unknownBase, ...override };
};

const setNetInfoState = (override?: NetInfoOverride) => {
  jest.mocked(useNetInfo).mockReturnValue(buildNetInfoState(override));
};

const COUNTERVALUES_API = "https://countervalues.live.ledger.com";

type TestStackParamList = {
  [ScreenName.MarketList]: undefined;
};

const Stack = createNativeStackNavigator<TestStackParamList>();

const MarketListTest = () => (
  <Stack.Navigator initialRouteName={ScreenName.MarketList}>
    <Stack.Screen name={ScreenName.MarketList} component={MarketList} />
  </Stack.Navigator>
);

describe("MarketList Layout based on Feature Flag", () => {
  beforeEach(() => {
    setNetInfoState();
    server.use(
      http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json(MOCK_MARKET_PERFORMERS)),
      http.get(`${COUNTERVALUES_API}/v3/supported/fiat`, () =>
        HttpResponse.json(["usd", "eur", "gbp"]),
      ),
    );
  });

  describe("When marketBanner feature flag is enabled (standalone mode)", () => {
    it("should render MarketList with SafeAreaView for top edge", async () => {
      renderWithReactQuery(<MarketListTest />, {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      await waitFor(() => {
        expect(screen.getByTestId("market-list")).toBeVisible();
      });

      expect(screen.getByTestId("search-box")).toBeVisible();
    });

    it("should display market data correctly in standalone mode", async () => {
      renderWithReactQuery(<MarketListTest />, {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      await waitFor(() => {
        expect(screen.getByText(/Bitcoin/i)).toBeVisible();
      });

      expect(screen.getByText(/Ethereum/i)).toBeVisible();
    });
  });

  describe("When marketBanner feature flag is disabled (tabs mode)", () => {
    it("should render MarketList with WalletTabSafeAreaView", async () => {
      renderWithReactQuery(<MarketListTest />, {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: false } },
            },
          },
        }),
      });

      await waitFor(() => {
        expect(screen.getByTestId("market-list")).toBeVisible();
      });

      // The search box should be visible
      expect(screen.getByTestId("search-box")).toBeVisible();
    });

    it("should display market data correctly in tabs mode", async () => {
      renderWithReactQuery(<MarketListTest />, {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: false, params: { marketBanner: false } },
            },
          },
        }),
      });

      await waitFor(() => {
        expect(screen.getByText(/Bitcoin/i)).toBeVisible();
      });

      expect(screen.getByText(/Ethereum/i)).toBeVisible();
    });
  });

  describe("Feature flag transitions", () => {
    it("should handle lwmWallet40 disabled state correctly", async () => {
      renderWithReactQuery(<MarketListTest />, {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: false },
            },
          },
        }),
      });

      await waitFor(() => {
        expect(screen.getByTestId("market-list")).toBeVisible();
      });

      // Should use default tabs mode layout
      expect(screen.getByTestId("search-box")).toBeVisible();
    });
  });

  describe("When internet seems to be down", () => {
    it("should display empty market list and 'internet down' message", async () => {
      setNetInfoState({
        isConnected: false,
        isInternetReachable: false,
        type: NetInfoStateType.none,
      });
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json([])),
        http.get(`${COUNTERVALUES_API}/v3/supported/fiat`, () =>
          HttpResponse.json(["usd", "eur", "gbp"]),
        ),
      );

      renderWithReactQuery(<MarketListTest />, {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      await waitFor(() => {
        expect(screen.getByTestId("market-list")).toBeVisible();
      });

      await waitFor(() => {
        expect(screen.getByText(/Sorry, internet seems to be down/i)).toBeVisible();
      });

      expect(screen.getByText(/Please check your internet connection\./i)).toBeVisible();
    });
  });
});
