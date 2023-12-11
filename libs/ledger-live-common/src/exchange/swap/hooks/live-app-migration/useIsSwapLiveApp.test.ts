import { renderHook } from "@testing-library/react-hooks";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { useIsSwapLiveApp } from "./useIsSwapLiveApp";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";

// Mock dependencies.
jest.mock("@ledgerhq/live-config/featureFlags/index");

const useMockFeature = useFeature as jest.Mock;

const bitcoin = cryptocurrenciesById["bitcoin"];

describe("useIsSwapLiveApp hook", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("simple flag", () => {
    it("returns the enabled flag when currencyFrom is not defined", () => {
      useMockFeature.mockReturnValue({ enabled: true });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: undefined, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });

    it("returns the enabled flag when families and currencies are not defined", () => {
      useMockFeature.mockReturnValue({
        enabled: true,
        params: { families: undefined, currencies: undefined },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });

    it("returns true when currencyFrom family is in families array and feature is enabled", () => {
      useMockFeature.mockReturnValue({
        enabled: true,
        params: { families: ["bitcoin"], currencies: [] },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });

    it("returns true when currencyFrom is in currencies array and feature is enabled", () => {
      useMockFeature.mockReturnValue({
        enabled: true,
        params: { families: [], currencies: ["bitcoin"] },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });

    it("returns false when currencyFrom family is not in families, currencyFrom is not in currencies, and feature is disabled", () => {
      useMockFeature.mockReturnValue({
        enabled: false,
        params: { families: ["ethereum"], currencies: ["ethereum"] },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(false);
    });

    it("returns enabled flag if both families and currencies are empty arrays", () => {
      useMockFeature.mockReturnValue({
        enabled: true,
        params: { families: [], currencies: [] },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });
  });
  describe("flag with nested manifest properties", () => {
    it("returns the enabled flag when currencyFrom is not defined", () => {
      useMockFeature.mockReturnValue({ enabled: true, "swap-live-app-demo-0": { enabled: true } });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: undefined, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });

    it("returns the enabled flag when families and currencies are not defined", () => {
      useMockFeature.mockReturnValue({
        enabled: false,
        params: { families: undefined, currencies: undefined },
        "swap-live-app-demo-0": { enabled: true },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });

    it("returns true when currencyFrom family is in families array and feature is enabled", () => {
      useMockFeature.mockReturnValue({
        enabled: false,
        "swap-live-app-demo-0": {
          enabled: true,
          params: { families: ["bitcoin"], currencies: [] },
        },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });

    it("returns true when currencyFrom is in currencies array and feature is enabled", () => {
      useMockFeature.mockReturnValue({
        enabled: false,
        "swap-live-app-demo-0": {
          enabled: true,
          params: { families: [], currencies: ["bitcoin"] },
        },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });

    it("returns false when currencyFrom family is not in families, currencyFrom is not in currencies, and feature is disabled", () => {
      useMockFeature.mockReturnValue({
        enabled: true,
        "swap-live-app-demo-0": {
          enabled: false,
          params: { families: ["ethereum"], currencies: ["ethereum"] },
        },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(false);
    });

    it("returns enabled flag if both families and currencies are empty arrays", () => {
      useMockFeature.mockReturnValue({
        enabled: false,
        "swap-live-app-demo-0": {
          enabled: true,
          params: { families: [], currencies: [] },
        },
      });

      const { result } = renderHook(() =>
        useIsSwapLiveApp({ currencyFrom: bitcoin, swapWebManifestId: "swap-live-app-demo-0" }),
      );

      expect(result.current.enabled).toBe(true);
    });
  });
});
