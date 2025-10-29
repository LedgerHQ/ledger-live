import React from "react";
import { render } from "@tests/test-renderer";
import ReceiveFundsOptions from "./";
import { ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/core";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();

// needed because the screen only uses the drawer that needs the safe area insets
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn().mockReturnValue({}),
}));

function renderComponent(
  route: RouteProp<ParamListBase, ScreenName> = {
    key: "",
    name: ScreenName.ReceiveSelectCrypto,
    params: {},
  },
) {
  return render(
    <ReceiveFundsOptions
      // @ts-expect-error typing
      navigation={{ navigate: mockNavigate, goBack: mockGoBack, replace: mockReplace }}
      // @ts-expect-error typing
      route={route}
    />,
  );
}

describe("ReceiveFundsOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title and buttons", () => {
    const { getByText } = renderComponent();

    expect(getByText("Receive")).toBeVisible();
    expect(getByText("Via crypto address")).toBeVisible();
    expect(getByText("Via bank transfer")).toBeVisible();
  });

  it("navigates to ReceiveProvider with fromMenu when fiat button pressed", async () => {
    const { getByText, user } = renderComponent();
    await user.press(getByText("Via bank transfer"));
    expect(mockReplace).toHaveBeenCalledWith(ScreenName.ReceiveProvider, {
      manifestId: "noah",
      fromMenu: true,
    });
  });

  describe("Crypto navigation", () => {
    it("navigates to ReceiveSelectCrypto when params are valid", async () => {
      const route = {
        key: "",
        name: ScreenName.ReceiveSelectCrypto,
        params: { filterCurrencyIds: ["eth"], currency: "bitcoin" },
      };

      const { getByText, user } = renderComponent(route);
      await user.press(getByText("Via crypto address"));

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.ReceiveSelectCrypto, {
        ...route.params,
        fromMenu: true,
      });
    });

    it("does not navigate when crypto params invalid", async () => {
      const route = {
        key: "",
        name: ScreenName.ReceiveSelectCrypto,
        params: { filterCurrencyIds: "not-an-array" },
      };

      const { getByText, user } = renderComponent(route);
      await user.press(getByText("Via crypto address"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates to ReceiveSelectAccount when params valid", async () => {
      const route = {
        key: "",
        name: ScreenName.ReceiveSelectAccount,
        params: { currency: { id: "ethereum" } },
      };

      const { getByText, user } = renderComponent(route);
      await user.press(getByText("Via crypto address"));

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.ReceiveSelectAccount, {
        ...route.params,
        fromMenu: true,
      });
    });

    it("does not navigate when account params invalid", async () => {
      const route: RouteProp<ParamListBase, ScreenName> = {
        key: "",
        name: ScreenName.ReceiveSelectAccount,
        params: { foo: "bar" },
      };

      const { getByText, user } = renderComponent(route);
      await user.press(getByText("Via crypto address"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
