import { renderWithReactQuery, screen } from "@tests/test-renderer";
import { http, HttpResponse, server } from "@tests/server";
import React from "react";
import { ScreenName } from "~/const";
import { State } from "~/reducers/types";
import {
  InitialRange,
  LandingPagesNavigatorParamList,
} from "~/components/RootNavigator/types/LandingPagesNavigator";
import { RouteProp } from "@react-navigation/core";
import * as navigationModule from "@react-navigation/native";
import { mockNavigation } from "../screens/LargeMoverLandingPage/fixtures/navigation";
import { PanGesture, State as GestureState } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { MockedLargeMoverLandingPage } from "./shared";
import { mappingServiceHandlers } from "../__tests__/mappingServiceHandlers";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

const mockRoute: RouteProp<LandingPagesNavigatorParamList, ScreenName.LargeMoverLandingPage> = {
  key: "LargeMoverRouteKey",
  name: ScreenName.LargeMoverLandingPage,
  params: {
    currencyIds: "BTC,ETH",
    initialRange: InitialRange.Day,
  },
};

describe("LargeMoverLandingPage Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(navigationModule.useNavigation).mockReturnValue(mockNavigation);
    server.use(...mappingServiceHandlers);
  });

  it("displays the ticker of the first currency", async () => {
    renderWithReactQuery(
      <MockedLargeMoverLandingPage
        key={mockRoute.key}
        name={mockRoute.name}
        params={mockRoute.params}
      />,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            counterValue: "USD",
          },
          largeMover: {
            tutorial: false,
          },
        }),
      },
    );

    expect(await screen.findAllByText(/BTC/i)).toBeDefined();
  });

  it("displays the close button in the header and handles navigation", async () => {
    const { user } = renderWithReactQuery(
      <MockedLargeMoverLandingPage
        key={mockRoute.key}
        name={mockRoute.name}
        params={mockRoute.params}
      />,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            counterValue: "USD",
          },
          largeMover: {
            tutorial: false,
          },
        }),
      },
    );

    const closeButton = await screen.findByTestId("NavigationHeaderCloseButton");
    expect(closeButton).toBeOnTheScreen();

    await user.press(closeButton);

    expect(mockNavigation.getParent).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const parentMock = mockNavigation.getParent as jest.Mock;
    expect(parentMock().pop).toHaveBeenCalled();
  });

  it("can change between different cryptocurrency cards", async () => {
    const multiCurrencyRoute = {
      ...mockRoute,
      params: {
        currencyIds: "BTC,ETH",
        initialRange: InitialRange.Day,
      },
    };

    renderWithReactQuery(
      <MockedLargeMoverLandingPage
        key={multiCurrencyRoute.key}
        name={multiCurrencyRoute.name}
        params={multiCurrencyRoute.params}
      />,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            counterValue: "USD",
          },
          largeMover: {
            tutorial: false,
          },
        }),
      },
    );

    expect(await screen.findByText("BTC")).toBeOnTheScreen();

    const panGesture = getByGestureTestId("pan");
    fireGestureHandler<PanGesture>(panGesture, [
      { state: GestureState.BEGAN, translationX: 0 },
      { state: GestureState.ACTIVE, translationX: 10 },
      { translationX: 100 },
      { translationX: 200 },
      { state: GestureState.END, translationX: 300, velocityX: 500 },
    ]);

    expect(await screen.findByText("ETH")).toBeOnTheScreen();
  });

  it("handles time range changes via Card component", async () => {
    const { user } = renderWithReactQuery(
      <MockedLargeMoverLandingPage
        key={mockRoute.key}
        name={mockRoute.name}
        params={mockRoute.params}
      />,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            counterValue: "USD",
          },
          largeMover: {
            tutorial: false,
          },
        }),
      },
    );

    expect(await screen.findByText("BTC")).toBeOnTheScreen();

    const initialVariationElements = screen.getAllByText(/[+-]\d+\.\d+%/);
    const initialVariation = initialVariationElements[0].props.children;

    const weekTabs = await screen.findAllByTestId("tab-selector-7d");
    const weekTab = weekTabs[0];
    await user.press(weekTab);

    const newVariationElements = screen.getAllByText(/[+-]\d+\.\d+%/);
    const newVariation = newVariationElements[0].props.children;

    expect(initialVariation).not.toBe(newVariation);
  });

  it("displays fiat figures in the selected app countervalue currency (GBP), not USD", async () => {
    const GBP_PRICE = 47123;
    const GBP_MARKET_CAP = 928_000_000_000;
    const captured: { to: string | null } = { to: null };

    server.use(
      http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
        captured.to = new URL(request.url).searchParams.get("to");

        return HttpResponse.json([
          {
            id: "bitcoin",
            ledgerIds: ["bitcoin"],
            ticker: "btc",
            name: "Bitcoin",
            image: "",
            marketCap: GBP_MARKET_CAP,
            marketCapRank: 1,
            fullyDilutedValuation: GBP_MARKET_CAP,
            totalVolume: 21_000_000_000,
            high24h: 48000,
            low24h: 46000,
            price: GBP_PRICE,
            priceChange24h: 1000,
            priceChangePercentage1h: 0.1,
            priceChangePercentage24h: 2.1,
            priceChangePercentage7d: 1.1,
            priceChangePercentage30d: -1.2,
            priceChangePercentage1y: 100,
            marketCapChange24h: 1,
            marketCapChangePercentage24h: 2.1,
            circulatingSupply: 19_700_000,
            totalSupply: 21_000_000,
            maxSupply: 21_000_000,
            allTimeHigh: 54000,
            allTimeLow: 50,
            allTimeHighDate: "2024-03-14T07:10:36.635Z",
            allTimeLowDate: "2013-07-06T00:00:00Z",
            sparkline: [],
            updatedAt: "2024-05-15T14:48:15Z",
          },
        ]);
      }),
    );

    renderWithReactQuery(
      <MockedLargeMoverLandingPage
        key={mockRoute.key}
        name={mockRoute.name}
        params={{ currencyIds: "BTC", initialRange: InitialRange.Day }}
      />,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            counterValue: "GBP",
          },
          largeMover: {
            tutorial: false,
          },
        }),
      },
    );

    expect(await screen.findByText("£47,123.00")).toBeOnTheScreen();
    expect(captured.to?.toLowerCase()).toBe("gbp");
  });

  it("displays token data when using ledgerIds parameter", async () => {
    const tokenRoute: RouteProp<LandingPagesNavigatorParamList, ScreenName.LargeMoverLandingPage> =
      {
        key: "LargeMoverTokenRouteKey",
        name: ScreenName.LargeMoverLandingPage,
        params: {
          currencyIds: "BTC",
          ledgerIds: "ethereum/erc20/usd__coin",
          initialRange: InitialRange.Day,
        },
      };

    renderWithReactQuery(
      <MockedLargeMoverLandingPage
        key={tokenRoute.key}
        name={tokenRoute.name}
        params={tokenRoute.params}
      />,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            counterValue: "USD",
          },
          largeMover: {
            tutorial: false,
          },
        }),
      },
    );

    expect(await screen.findByText("USDC")).toBeOnTheScreen();
  });
});
