import { renderWithReactQuery, screen } from "@tests/test-renderer";
import React from "react";
import { ScreenName } from "~/const";
import { State } from "~/reducers/types";
import {
  InitialRange,
  LandingPagesNavigatorParamList,
} from "~/components/RootNavigator/types/LandingPagesNavigator";
import { RouteProp } from "@react-navigation/core";
import { LargeMoverLandingPage } from "../screens/LargeMoverLandingPage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { mockNavigation } from "../screens/LargeMoverLandingPage/fixtures/navigation";

jest.mock("~/newArch/components/Swiper/components/Swiper", () => {
  type Card = { id: string | number };
  type Props = {
    cardContainerStyle?: Record<string, unknown>;
    currentIndex: number;
    onIndexChange?: (i: number) => void;
    initialCards: Card[];
    renderCard: (card: Card) => unknown;
  };

  const SwiperComponent = (props: Props) => {
    const card = props.initialCards?.[props.currentIndex];

    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
      (window as any).__swiperChangeIndex = (newIndex: number) => {
        if (props.onIndexChange) {
          props.onIndexChange(newIndex);
        }
      };
    }

    return (card && props.renderCard(card)) || null;
  };

  return { SwiperComponent };
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (useRoute as jest.Mock).mockReturnValue(mockRoute);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);
  });

  it("displays the ticker of the first currency", async () => {
    renderWithReactQuery(<LargeMoverLandingPage route={mockRoute} navigation={mockNavigation} />, {
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
    });

    expect(await screen.findAllByText(/BTC/i));
  });

  it("displays the close button in the header and handles navigation", async () => {
    const { user } = renderWithReactQuery(
      <LargeMoverLandingPage route={mockRoute} navigation={mockNavigation} />,
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
      <LargeMoverLandingPage route={multiCurrencyRoute} navigation={mockNavigation} />,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
    if (typeof window !== "undefined" && (window as any).__swiperChangeIndex) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
      (window as any).__swiperChangeIndex(1);
      expect(await screen.findByText("ETH")).toBeOnTheScreen();
    }
  });

  it("handles time range changes via Card component", async () => {
    const { user } = renderWithReactQuery(
      <LargeMoverLandingPage route={mockRoute} navigation={mockNavigation} />,
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

    const weekTab = await screen.findByTestId("tab-selector-7d");
    await user.press(weekTab);

    const newVariationElements = screen.getAllByText(/[+-]\d+\.\d+%/);
    const newVariation = newVariationElements[0].props.children;

    expect(initialVariation).not.toBe(newVariation);
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

    renderWithReactQuery(<LargeMoverLandingPage route={tokenRoute} navigation={mockNavigation} />, {
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
    });

    expect(await screen.findByText("USDC")).toBeOnTheScreen();
  });
});
