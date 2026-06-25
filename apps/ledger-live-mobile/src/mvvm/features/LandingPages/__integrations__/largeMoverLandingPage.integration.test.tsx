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
import { i18n } from "~/context/Locale";

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

const bitcoinMarket = (overrides: Record<string, unknown> = {}) => [
  {
    id: "bitcoin",
    ledgerIds: ["bitcoin"],
    ticker: "btc",
    name: "Bitcoin",
    image: "",
    marketCap: 928_000_000_000,
    marketCapRank: 1,
    fullyDilutedValuation: 928_000_000_000,
    totalVolume: 21_000_000_000,
    high24h: 48000,
    low24h: 46000,
    price: 47123,
    priceChange24h: 1000,
    priceChangePercentage1h: 0.1,
    priceChangePercentage24h: 2.1,
    priceChangePercentage7d: 1.1,
    priceChangePercentage30d: -1.2,
    priceChangePercentage1y: 100,
    marketCapChange24h: 1,
    marketCapChangePercentage24h: 2.1,
    circulatingSupply: 2_500_000_000,
    totalSupply: 21_000_000_000,
    maxSupply: 21_000_000_000,
    allTimeHigh: 54000,
    allTimeLow: 50,
    allTimeHighDate: "2024-03-14T07:10:36.635Z",
    allTimeLowDate: "2013-07-06T00:00:00Z",
    sparkline: [],
    updatedAt: "2024-05-15T14:48:15Z",
    ...overrides,
  },
];

describe("LargeMoverLandingPage Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(navigationModule.useNavigation).mockReturnValue(mockNavigation);
    server.use(...mappingServiceHandlers);
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
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

    const gbpPrices = await screen.findAllByText("£47,123.00");
    expect(gbpPrices.length).toBeGreaterThan(0);
    expect(screen.queryByText("$47,123.00")).toBeNull();
    expect(captured.to?.toLowerCase()).toBe("gbp");
    expect(await screen.findByText("19.7 M BTC")).toBeOnTheScreen();
    expect(await screen.findByText("21 M BTC")).toBeOnTheScreen();
  });

  // The test harness wraps with I18nextProvider but not the app LocaleProvider, so the number
  // `locale` is pinned to en; only the i18next language (the translated suffix) can be switched.
  // That still verifies the translation-driven, uppercased compact suffix per language.
  it.each([
    ["fr", "2.5 MD BTC", "21 MD BTC"],
    ["de", "2.5 MRD. BTC", "21 MRD. BTC"],
  ])(
    "formats supply figures with the localized, uppercase compact suffix (%s)",
    async (language, circulating, total) => {
      await i18n.changeLanguage(language);
      server.use(
        http.get("https://countervalues.live.ledger.com/v3/markets", () =>
          HttpResponse.json(bitcoinMarket()),
        ),
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
              counterValue: "USD",
            },
            largeMover: {
              tutorial: false,
            },
          }),
        },
      );

      expect(await screen.findByText(circulating)).toBeOnTheScreen();
      expect(await screen.findByText(total)).toBeOnTheScreen();
    },
  );

  it.each([
    ["USD", "$928 BN"],
    ["EUR", "€928 BN"],
    ["GBP", "£928 BN"],
  ])(
    "formats the market cap with the selected counter-value currency symbol (%s)",
    async (counterValue, marketCap) => {
      server.use(
        http.get("https://countervalues.live.ledger.com/v3/markets", () =>
          HttpResponse.json(bitcoinMarket()),
        ),
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
              counterValue,
            },
            largeMover: {
              tutorial: false,
            },
          }),
        },
      );

      expect((await screen.findAllByText(marketCap)).length).toBeGreaterThan(0);
    },
  );

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
