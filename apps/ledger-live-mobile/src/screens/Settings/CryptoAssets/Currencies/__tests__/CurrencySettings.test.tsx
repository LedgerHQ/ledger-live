import React from "react";
import { render, screen, act } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import CurrencySettings, {
  getCurrencyHasSettings,
  CustomCurrencyHeader,
} from "../CurrencySettings";
import { ScreenName } from "~/const";
import { currencySettingsDefaults } from "~/helpers/CurrencySettingsDefaults";

import { View } from "react-native";

jest.mock("@react-native-community/slider", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <View testID="slider" {...props} />,
}));

const currencies = [
  { id: "bitcoin", name: "Bitcoin" },
  { id: "ethereum", name: "Ethereum" },
] as const;

const mockedNavigation = {
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popTo: jest.fn(),
  popToTop: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
  preload: jest.fn(),
  navigateDeprecated: jest.fn(),
  replaceParams: jest.fn(),
};

function renderCurrencySettings(currencyId: string) {
  return render(
    <CurrencySettings
      navigation={mockedNavigation}
      route={{
        key: "CurrencySettings",
        name: ScreenName.CurrencySettings,
        params: { currencyId },
      }}
    />,
  );
}

describe("CurrencySettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(currencies)("should return true for getCurrencyHasSettings ($name)", ({ id }) => {
    const currency = getCryptoCurrencyById(id);
    expect(getCurrencyHasSettings(currency)).toBe(true);
  });

  it.each(currencies)("should render CustomCurrencyHeader with $name", ({ id, name }) => {
    const currency = getCryptoCurrencyById(id);
    render(<CustomCurrencyHeader currency={currency} />);
    expect(screen.getByText(new RegExp(name))).toBeTruthy();
  });

  describe.each(currencies)("Slider for $name", ({ id }) => {
    const currency = getCryptoCurrencyById(id);
    const defaults = currencySettingsDefaults(currency);

    it("should render the slider with correct props", () => {
      renderCurrencySettings(id);

      const slider = screen.getByTestId("slider");
      expect(slider.props.minimumValue).toBe(defaults.confirmationsNb!.min);
      expect(slider.props.maximumValue).toBe(defaults.confirmationsNb!.max);
      expect(slider.props.value).toBe(defaults.confirmationsNb!.def);
      expect(slider.props.step).toBe(1);
    });

    it("should update displayed value when slider value changes", () => {
      renderCurrencySettings(id);

      const slider = screen.getByTestId("slider");
      act(() => {
        slider.props.onValueChange(5);
      });

      expect(screen.getByText("5")).toBeTruthy();
    });

    it("should persist setting on sliding complete", () => {
      const { store } = renderCurrencySettings(id);

      const slider = screen.getByTestId("slider");
      act(() => {
        slider.props.onSlidingComplete(7);
      });

      expect(store.getState().settings.currenciesSettings[currency.ticker].confirmationsNb).toBe(7);
    });

    it("should set navigation header title on mount", () => {
      renderCurrencySettings(id);
      expect(mockedNavigation.setOptions).toHaveBeenCalled();
    });
  });
});
