import React from "react";
import { render } from "@tests/test-renderer";
import { LargeMoverLandingPage } from "../..";
import { ScreenName } from "~/const";
import { State } from "~/reducers/types";
import { Text, View } from "react-native";
import {
  InitialRange,
  LandingPagesNavigatorParamList,
} from "~/components/RootNavigator/types/LandingPagesNavigator";
import { RouteProp } from "@react-navigation/core";
import { mockChartData, mockCurrencyData } from "../../fixtures/currency";
import { INITIAL_STATE } from "~/reducers/settings";
import { mockNavigation } from "../../fixtures/navigation";

jest.mock("~/newArch/components/Swiper/components/Swiper", () => ({
  SwiperComponent: function MockSwiperComponent(props: React.PropsWithChildren<object>) {
    return (
      <View testID="mock-swiper">
        <Text>Mocked SwiperComponent</Text>
        {props.children}
      </View>
    );
  },
}));

jest.mock("~/logic/getWindowDimensions", () => () => ({ height: 1000 }));

jest.mock("../../hooks/useLargeMover", () => ({
  useLargeMover: () => ({
    currencies: [
      {
        id: mockCurrencyData.id,
        data: mockCurrencyData,
        isLoading: false,
        isError: false,
      },
    ],
    loading: false,
    isError: false,
  }),
}));

jest.mock("@ledgerhq/live-common/market/hooks/useLargeMoverChartData", () => ({
  useLargeMoverChartData: () => ({
    chartDataArray: [
      {
        idChartData: "ethereum",
        chartData: mockChartData,
        isLoading: false,
        isError: false,
      },
    ],
    loadingChart: false,
  }),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockRoute = {
  key: "LargeMoverRouteKey",
  name: ScreenName.LargeMoverLandingPage,
  params: {
    currencyIds: "BTC,ETH",
    initialRange: InitialRange.Day,
  },
} as RouteProp<LandingPagesNavigatorParamList, ScreenName.LargeMoverLandingPage>;

describe("OverlayTutorial", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("The overlay is visible when tutorial is true", async () => {
    const { store, getByTestId, user, getByRole } = render(
      <LargeMoverLandingPage route={mockRoute} navigation={mockNavigation} />,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...INITIAL_STATE,
          },
          largeMover: {
            tutorial: true,
          },
        }),
      },
    );

    expect(getByTestId("overlay-tutorial")).toBeTruthy();

    expect(store.getState().largeMover.tutorial).toBe(true);

    await user.press(getByRole("button", { name: /Got it!/i }));
    expect(store.getState().largeMover.tutorial).toBe(false);
  });
});
