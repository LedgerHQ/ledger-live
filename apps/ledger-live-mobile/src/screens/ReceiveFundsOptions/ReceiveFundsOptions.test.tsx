import React from "react";
import { render } from "@tests/test-renderer";
import ReceiveFundsOptions from "./";
import { NavigatorName, ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/core";
import { useOpenReceiveDrawer } from "LLM/features/Receive";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();
const mockParentNavigate = jest.fn();
const mockGetParent = jest.fn(() => ({ navigate: mockParentNavigate }));

// needed because the screen only uses the drawer that needs the safe area insets
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn().mockReturnValue({}),
}));

// Mock the useOpenReceiveDrawer hook
jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: jest.fn(),
}));

const mockUseOpenReceiveDrawer = jest.mocked(useOpenReceiveDrawer);

function renderComponent(
  route: RouteProp<ParamListBase, ScreenName> = {
    key: "",
    name: ScreenName.ReceiveSelectCrypto,
    params: {},
  },
) {
  return render(
    <ReceiveFundsOptions
      navigation={{
        navigate: mockNavigate,
        goBack: mockGoBack,
        replace: mockReplace,
        // @ts-expect-error typing
        getParent: mockGetParent,
      }}
      // @ts-expect-error typing
      route={route}
    />,
  );
}

describe("ReceiveFundsOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
      isModularDrawerEnabled: false,
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders title and buttons", () => {
    const { getByText } = renderComponent();

    expect(getByText("Receive")).toBeVisible();
    expect(getByText("Via crypto address")).toBeVisible();
    expect(getByText("Via bank transfer")).toBeVisible();
  });

  it("closes modal then navigates to ReceiveProvider when fiat button pressed", async () => {
    const { getByText, user } = renderComponent();
    await user.press(getByText("Via bank transfer"));

    expect(mockGoBack).toHaveBeenCalled();
    jest.runAllTimers();
    expect(mockParentNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveProvider,
      params: {
        manifestId: "noah",
        fromMenu: true,
      },
    });
  });

  describe("Crypto navigation", () => {
    it("closes modal then navigates to ReceiveSelectCrypto when params are valid", async () => {
      const route = {
        key: "",
        name: ScreenName.ReceiveSelectCrypto,
        params: { filterCurrencyIds: ["eth"], currency: "bitcoin" },
      };

      const { getByText, user } = renderComponent(route);
      await user.press(getByText("Via crypto address"));

      expect(mockGoBack).toHaveBeenCalled();
      jest.runAllTimers();
      expect(mockParentNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveSelectCrypto,
        params: {
          filterCurrencyIds: ["eth"],
          currency: "bitcoin",
          fromMenu: true,
        },
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

      expect(mockGoBack).toHaveBeenCalled();
      jest.runAllTimers();
      expect(mockParentNavigate).not.toHaveBeenCalled();
    });

    it("closes modal then navigates to ReceiveSelectAccount when params valid", async () => {
      const route = {
        key: "",
        name: ScreenName.ReceiveSelectAccount,
        params: { currency: { id: "ethereum" } },
      };

      const { getByText, user } = renderComponent(route);
      await user.press(getByText("Via crypto address"));

      expect(mockGoBack).toHaveBeenCalled();
      jest.runAllTimers();
      expect(mockParentNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveSelectAccount,
        params: {
          currency: { id: "ethereum" },
          fromMenu: true,
        },
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

      expect(mockGoBack).toHaveBeenCalled();
      jest.runAllTimers();
      expect(mockParentNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Modular drawer behavior", () => {
    it("opens modular drawer instead of navigating when enabled", async () => {
      mockUseOpenReceiveDrawer.mockReturnValueOnce({
        handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
        isModularDrawerEnabled: true,
      });

      const { getByText, user } = renderComponent();
      await user.press(getByText("Via crypto address"));

      expect(mockHandleOpenReceiveDrawer).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
