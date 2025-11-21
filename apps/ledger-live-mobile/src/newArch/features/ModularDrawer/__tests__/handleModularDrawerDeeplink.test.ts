import { handleModularDrawerDeeplink } from "../handleModularDrawerDeeplink";
import { openModularDrawer } from "~/reducers/modularDrawer";
import {
  findCryptoCurrencyByKeyword,
  getCryptoCurrencyById,
} from "@ledgerhq/live-common/currencies/index";
import { getStateFromPath } from "@react-navigation/native";
import { callbackRegistry } from "~/newArch/features/ModularDrawer/hooks/useCallbackRegistry/registries";

jest.mock("~/reducers/modularDrawer", () => ({
  ...jest.requireActual("~/reducers/modularDrawer"),
  openModularDrawer: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  findCryptoCurrencyByKeyword: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn(),
}));

jest.mock("~/newArch/features/ModularDrawer/hooks/useCallbackRegistry/registries", () => ({
  callbackRegistry: {
    register: jest.fn(),
    unregister: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(),
  },
}));

jest.mock("~/newArch/features/ModularDrawer/utils/callbackIdGenerator", () => ({
  generateCallbackId: jest.fn(() => "test-callback-id"),
}));

jest.mock("~/rootnavigation", () => ({
  navigationRef: {
    current: {
      navigate: jest.fn(),
    },
  },
  isReadyRef: { current: true },
}));

const mockGetStateFromPath = jest.mocked(getStateFromPath);
const mockFindCryptoCurrencyByKeyword = jest.mocked(findCryptoCurrencyByKeyword);
const mockOpenModularDrawer = jest.mocked(openModularDrawer);
const mockCallbackRegistry = jest.mocked(callbackRegistry);

describe("handleModularDrawerDeeplink", () => {
  const mockDispatch = jest.fn();
  const mockConfig = {} as Parameters<typeof getStateFromPath>[1];
  const mockNavigationState = { routes: [], index: 0 };

  const mockBitcoin = getCryptoCurrencyById("bitcoin");
  const mockEthereum = getCryptoCurrencyById("ethereum");

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStateFromPath.mockReturnValue(mockNavigationState);
  });

  describe("receive deeplink", () => {
    it("should dispatch openModularDrawer without currency and register callback", () => {
      const searchParams = new URLSearchParams();

      handleModularDrawerDeeplink("receive", searchParams, mockDispatch, mockConfig);

      expect(mockCallbackRegistry.register).toHaveBeenCalledWith(
        "test-callback-id",
        expect.any(Function),
      );
      expect(mockOpenModularDrawer).toHaveBeenCalledWith({
        currencies: undefined,
        flow: "receive_flow",
        source: "deeplink",
        areCurrenciesFiltered: false,
        enableAccountSelection: true,
        callbackId: "test-callback-id",
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockGetStateFromPath).toHaveBeenCalledWith("portfolio", mockConfig);
    });

    it("should dispatch openModularDrawer with currency and register callback", () => {
      const searchParams = new URLSearchParams({ currency: "bitcoin" });
      mockFindCryptoCurrencyByKeyword.mockReturnValueOnce(mockBitcoin);

      handleModularDrawerDeeplink("receive", searchParams, mockDispatch, mockConfig);

      expect(mockFindCryptoCurrencyByKeyword).toHaveBeenCalledWith("bitcoin");
      expect(mockCallbackRegistry.register).toHaveBeenCalledWith(
        "test-callback-id",
        expect.any(Function),
      );
      expect(mockOpenModularDrawer).toHaveBeenCalledWith({
        currencies: ["bitcoin"],
        flow: "receive_flow",
        source: "deeplink",
        areCurrenciesFiltered: true,
        enableAccountSelection: true,
        callbackId: "test-callback-id",
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it("should handle undefined currency gracefully when currency not found", () => {
      const searchParams = new URLSearchParams({ currency: "invalid-currency" });
      mockFindCryptoCurrencyByKeyword.mockReturnValueOnce(undefined);

      handleModularDrawerDeeplink("receive", searchParams, mockDispatch, mockConfig);

      expect(mockCallbackRegistry.register).toHaveBeenCalledWith(
        "test-callback-id",
        expect.any(Function),
      );
      expect(mockOpenModularDrawer).toHaveBeenCalledWith({
        currencies: undefined,
        flow: "receive_flow",
        source: "deeplink",
        areCurrenciesFiltered: false,
        enableAccountSelection: true,
        callbackId: "test-callback-id",
      });
    });
  });

  describe("add-account deeplink", () => {
    it("should dispatch openModularDrawer without currency", () => {
      const searchParams = new URLSearchParams();

      handleModularDrawerDeeplink("add-account", searchParams, mockDispatch, mockConfig);

      expect(mockOpenModularDrawer).toHaveBeenCalledWith({
        currencies: undefined,
        flow: "add-account",
        source: "deeplink",
        areCurrenciesFiltered: false,
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockGetStateFromPath).toHaveBeenCalledWith("portfolio", mockConfig);
    });

    it("should dispatch openModularDrawer with currency", () => {
      const searchParams = new URLSearchParams({ currency: "ethereum" });
      mockFindCryptoCurrencyByKeyword.mockReturnValueOnce(mockEthereum);

      handleModularDrawerDeeplink("add-account", searchParams, mockDispatch, mockConfig);

      expect(mockFindCryptoCurrencyByKeyword).toHaveBeenCalledWith("ethereum");
      expect(mockOpenModularDrawer).toHaveBeenCalledWith({
        currencies: ["ethereum"],
        flow: "add-account",
        source: "deeplink",
        areCurrenciesFiltered: true,
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it("should handle undefined currency gracefully when currency not found", () => {
      const searchParams = new URLSearchParams({ currency: "unknown" });
      mockFindCryptoCurrencyByKeyword.mockReturnValueOnce(undefined);

      handleModularDrawerDeeplink("add-account", searchParams, mockDispatch, mockConfig);

      expect(mockOpenModularDrawer).toHaveBeenCalledWith({
        currencies: undefined,
        flow: "add-account",
        source: "deeplink",
        areCurrenciesFiltered: false,
      });
    });
  });

  describe("navigation state", () => {
    it("should return navigation state for portfolio", () => {
      const searchParams = new URLSearchParams();

      const result = handleModularDrawerDeeplink("receive", searchParams, mockDispatch, mockConfig);

      expect(result).toBe(mockNavigationState);
      expect(mockGetStateFromPath).toHaveBeenCalledWith("portfolio", mockConfig);
    });
  });

  describe("source parameter handling", () => {
    it("should use deeplinkSource when provided", () => {
      const searchParams = new URLSearchParams({
        deeplinkSource: "custom-source",
        currency: "bitcoin",
      });
      mockFindCryptoCurrencyByKeyword.mockReturnValueOnce(mockBitcoin);
      handleModularDrawerDeeplink("receive", searchParams, mockDispatch, mockConfig);

      expect(mockOpenModularDrawer).toHaveBeenCalledWith({
        currencies: ["bitcoin"],
        flow: "receive_flow",
        source: "custom-source",
        areCurrenciesFiltered: true,
        enableAccountSelection: true,
        callbackId: "test-callback-id",
      });
    });

    it("should use ajs_prop_source when provided", () => {
      const searchParams = new URLSearchParams({ ajs_prop_source: "analytics-source" });

      handleModularDrawerDeeplink("add-account", searchParams, mockDispatch, mockConfig);

      expect(mockOpenModularDrawer).toHaveBeenCalledWith({
        currencies: undefined,
        flow: "add-account",
        source: "analytics-source",
        areCurrenciesFiltered: false,
      });
    });

    it("should default to 'deeplink' when neither deeplinkSource nor ajs_prop_source is provided", () => {
      const searchParams = new URLSearchParams();

      handleModularDrawerDeeplink("add-account", searchParams, mockDispatch, mockConfig);

      expect(mockOpenModularDrawer).toHaveBeenCalledWith({
        currencies: undefined,
        flow: "add-account",
        source: "deeplink",
        areCurrenciesFiltered: false,
      });
    });
  });
});
