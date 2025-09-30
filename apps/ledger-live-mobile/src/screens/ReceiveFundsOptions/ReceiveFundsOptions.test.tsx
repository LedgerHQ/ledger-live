import React from "react";
import { render } from "@tests/test-renderer";
import ReceiveFundsOptions from "./";
import { ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/core";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();

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
    expect(getByText("From a crypto address")).toBeVisible();
    expect(getByText("From a bank account")).toBeVisible();
  });

  it("closes modal when header close button pressed", async () => {
    const { getByTestId, user } = renderComponent();
    await user.press(getByTestId("modal-close-button"));
  });

  it("navigates to ReceiveProvider with fromMenu when fiat button pressed", async () => {
    const { getByText, user } = renderComponent();
    await user.press(getByText("From a bank account"));
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
      await user.press(getByText("From a crypto address"));

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
      await user.press(getByText("From a crypto address"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates to ReceiveSelectAccount when params valid", async () => {
      const route = {
        key: "",
        name: ScreenName.ReceiveSelectAccount,
        params: { currency: { id: "ethereum" } },
      };

      const { getByText, user } = renderComponent(route);
      await user.press(getByText("From a crypto address"));

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
      await user.press(getByText("From a crypto address"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
