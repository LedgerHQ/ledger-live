/* eslint-disable @typescript-eslint/consistent-type-assertions */
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import {
  ModularDrawerDeepLinkHandler,
  AddAccountDeepLinkHandler,
  ModularDrawerDeepLinkHandlerProps,
  AddAccountDeepLinkHandlerProps,
} from "../screens/ModularDrawerDeepLinkHandler";
import { ScreenName } from "~/const";

const mockOpenDrawer = jest.fn();
const mockNavigationDispatch = jest.fn();

type MockNavigation = {
  dispatch: jest.Mock;
};

const mockNavigation: MockNavigation = {
  dispatch: mockNavigationDispatch,
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    dispatch: mockNavigationDispatch,
  }),
}));

jest.mock("LLM/features/ModularDrawer/hooks/useModularDrawerController", () => ({
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  findCryptoCurrencyByKeyword: jest.fn((keyword: string) => {
    if (keyword === "bitcoin") return { id: "bitcoin", name: "Bitcoin" };
    if (keyword === "ethereum") return { id: "ethereum", name: "Ethereum" };
    return undefined;
  }),
}));

describe("ModularDrawerDeepLinkHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ModularDrawerDeepLinkHandler", () => {
    it("should call openDrawer for add-account flow", async () => {
      const route: ModularDrawerDeepLinkHandlerProps["route"] = {
        key: "test",
        name: ScreenName.ModularDrawerDeepLinkHandler,
        params: { flow: "add-account" as const },
      };

      render(
        <ModularDrawerDeepLinkHandler
          route={route}
          navigation={mockNavigation as unknown as ModularDrawerDeepLinkHandlerProps["navigation"]}
        />,
      );

      await waitFor(() => {
        expect(mockOpenDrawer).toHaveBeenCalledWith({
          currencies: undefined,
          flow: "add-account",
          source: "deeplink",
          areCurrenciesFiltered: false,
        });
        expect(mockNavigationDispatch).toHaveBeenCalled();
      });
    });

    it("should handle add-account flow with currency", async () => {
      const route: ModularDrawerDeepLinkHandlerProps["route"] = {
        key: "test",
        name: ScreenName.ModularDrawerDeepLinkHandler,
        params: { flow: "add-account" as const, currency: "ethereum" },
      };

      render(
        <ModularDrawerDeepLinkHandler
          route={route}
          navigation={mockNavigation as unknown as ModularDrawerDeepLinkHandlerProps["navigation"]}
        />,
      );

      await waitFor(() => {
        expect(mockOpenDrawer).toHaveBeenCalledWith({
          currencies: ["ethereum"],
          flow: "add-account",
          source: "deeplink",
          areCurrenciesFiltered: true,
        });
      });
    });

    it("should default to add-account flow when no flow is specified", async () => {
      const route: ModularDrawerDeepLinkHandlerProps["route"] = {
        key: "test",
        name: ScreenName.ModularDrawerDeepLinkHandler,
        params: {},
      };

      render(
        <ModularDrawerDeepLinkHandler
          route={route}
          navigation={mockNavigation as unknown as ModularDrawerDeepLinkHandlerProps["navigation"]}
        />,
      );

      await waitFor(() => {
        expect(mockOpenDrawer).toHaveBeenCalledWith({
          currencies: undefined,
          flow: "add-account",
          source: "deeplink",
          areCurrenciesFiltered: false,
        });
      });
    });
  });

  describe("AddAccountDeepLinkHandler", () => {
    it("should always trigger add-account flow", async () => {
      const route: AddAccountDeepLinkHandlerProps["route"] = {
        key: "test",
        name: ScreenName.AddAccountDeepLinkHandler,
        params: {},
      };

      render(
        <AddAccountDeepLinkHandler
          route={route}
          navigation={mockNavigation as unknown as AddAccountDeepLinkHandlerProps["navigation"]}
        />,
      );

      await waitFor(() => {
        expect(mockOpenDrawer).toHaveBeenCalledWith({
          currencies: undefined,
          flow: "add-account",
          source: "deeplink",
          areCurrenciesFiltered: false,
        });
      });
    });

    it("should handle add-account flow with currency parameter", async () => {
      const route: AddAccountDeepLinkHandlerProps["route"] = {
        key: "test",
        name: ScreenName.AddAccountDeepLinkHandler,
        params: { currency: "ethereum" },
      };

      render(
        <AddAccountDeepLinkHandler
          route={route}
          navigation={mockNavigation as unknown as AddAccountDeepLinkHandlerProps["navigation"]}
        />,
      );

      await waitFor(() => {
        expect(mockOpenDrawer).toHaveBeenCalledWith({
          currencies: ["ethereum"],
          flow: "add-account",
          source: "deeplink",
          areCurrenciesFiltered: true,
        });
      });
    });
  });
});
