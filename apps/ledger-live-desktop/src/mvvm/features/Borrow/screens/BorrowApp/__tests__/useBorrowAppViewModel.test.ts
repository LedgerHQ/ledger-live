import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocation } from "react-router";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import useTheme from "~/renderer/hooks/useTheme";
import { useBorrowAppViewModel } from "../useBorrowAppViewModel";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("~/helpers/systemLocale", () => ({
  ...jest.requireActual("~/helpers/systemLocale"),
  getParsedSystemDeviceLocale: jest.fn(),
}));

jest.mock("~/renderer/hooks/useTheme");

const remoteManifest = { id: "borrow-remote", url: "https://remote.example" } as LiveAppManifest;
const localManifest = { id: "borrow-local", url: "https://local.example" } as LiveAppManifest;

const initialState = {
  settings: {
    counterValue: "USD",
    language: "en" as const,
    locale: "en-US" as const,
    developerMode: true,
    enablePlatformDevTools: true,
    discreetMode: false,
  },
};

describe("useBorrowAppViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .mocked(useTheme)
      .mockReturnValue({ theme: "dark" } as unknown as ReturnType<typeof useTheme>);
    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      updateManifests: jest.fn(),
    } as unknown as ReturnType<typeof useRemoteLiveAppContext>);
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(remoteManifest);
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
    jest
      .mocked(getParsedSystemDeviceLocale)
      .mockReturnValue({ region: "US" } as ReturnType<typeof getParsedSystemDeviceLocale>);
    jest.mocked(useLocation).mockReturnValue({
      pathname: "/borrow",
      search: "",
      hash: "",
      state: null,
      key: "default",
    });
  });

  it("prefers local manifest over remote manifest", () => {
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(localManifest);

    const { result } = renderHook(() => useBorrowAppViewModel(), { initialState });

    expect(result.current.manifest).toEqual(localManifest);
  });

  it("uses feature flag manifest id when provided", () => {
    renderHook(() => useBorrowAppViewModel(), {
      initialState: {
        ...initialState,
        ...withFlagOverrides({
          ptxBorrowLiveApp: {
            enabled: true,
            params: { manifest_id: "custom-borrow" },
          },
        }),
      },
    });

    expect(jest.mocked(useLocalLiveAppManifest)).toHaveBeenCalledWith("custom-borrow");
    expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("custom-borrow");
  });

  it("updates webviewState when onStateChange is called", () => {
    const { result } = renderHook(() => useBorrowAppViewModel(), { initialState });

    act(() => {
      result.current.onStateChange({
        url: "https://borrow.example/app",
        canGoBack: true,
        canGoForward: false,
        title: "Borrow",
        loading: false,
        isAppUnavailable: false,
      });
    });

    expect(result.current.webviewState).toEqual(
      expect.objectContaining({
        url: "https://borrow.example/app",
        canGoBack: true,
        title: "Borrow",
      }),
    );
  });

  it("builds webview inputs and forwards refresh callback", () => {
    const updateManifests = jest.fn();
    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      updateManifests,
    } as unknown as ReturnType<typeof useRemoteLiveAppContext>);

    const { result } = renderHook(() => useBorrowAppViewModel(), {
      initialState: {
        ...initialState,
        settings: { ...initialState.settings, discreetMode: true },
      },
    });

    expect(result.current.inputs).toEqual(
      expect.objectContaining({
        devMode: "true",
        theme: "dark",
        lang: "en",
        locale: "en-US",
        countryLocale: "US",
        currencyTicker: "USD",
        OS: "web",
        platform: "LLD",
        discreetMode: "true",
      }),
    );
    expect(result.current.enablePlatformDevTools).toBe(true);
    result.current.refreshManifests();
    expect(updateManifests).toHaveBeenCalled();
  });

  describe("onBack", () => {
    it("navigates to returnTo from location.state when provided", () => {
      jest.mocked(useLocation).mockReturnValue({
        pathname: "/borrow",
        search: "",
        hash: "",
        state: { returnTo: "/portfolio" },
        key: "default",
      });

      const { result } = renderHook(() => useBorrowAppViewModel(), { initialState });

      act(() => result.current.onBack());

      expect(mockNavigate).toHaveBeenCalledWith("/portfolio", { replace: true });
    });

    it('falls back to "/" when no returnTo is provided', () => {
      const { result } = renderHook(() => useBorrowAppViewModel(), { initialState });

      act(() => result.current.onBack());

      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  describe("onGoToSwap", () => {
    it("builds /swap state with defaultCurrency/Token/AccountId and forwards amount, affiliate and from pathname", () => {
      jest.mocked(useLocation).mockReturnValue({
        pathname: "/borrow/active",
        search: "",
        hash: "",
        state: null,
        key: "default",
      });

      const { result } = renderHook(() => useBorrowAppViewModel(), { initialState });

      act(() =>
        result.current.onGoToSwap({
          fromCurrencyId: "ethereum",
          toCurrencyId: "bitcoin",
          fromTokenId: "ethereum/erc20/usdt",
          toTokenId: "bitcoin/erc20/wbtc",
          fromAccountId: "account-from",
          toAccountId: "account-to",
          amountFrom: "12.5",
          affiliate: "borrow-app",
        }),
      );

      expect(mockNavigate).toHaveBeenCalledWith("/swap", {
        state: {
          defaultCurrency: { fromCurrencyId: "ethereum", toCurrencyId: "bitcoin" },
          defaultToken: {
            fromTokenId: "ethereum/erc20/usdt",
            toTokenId: "bitcoin/erc20/wbtc",
          },
          defaultAccountId: {
            fromAccountId: "account-from",
            toAccountId: "account-to",
          },
          defaultAmountFrom: "12.5",
          affiliate: "borrow-app",
          from: "/borrow/active",
        },
      });
    });

    it("omits defaultCurrency / defaultToken / defaultAccountId when no related ids are provided", () => {
      const { result } = renderHook(() => useBorrowAppViewModel(), { initialState });

      act(() => result.current.onGoToSwap({ amountFrom: "1" }));

      expect(mockNavigate).toHaveBeenCalledWith("/swap", {
        state: expect.objectContaining({
          defaultCurrency: undefined,
          defaultToken: undefined,
          defaultAccountId: undefined,
          defaultAmountFrom: "1",
          affiliate: undefined,
        }),
      });
    });
  });
});
