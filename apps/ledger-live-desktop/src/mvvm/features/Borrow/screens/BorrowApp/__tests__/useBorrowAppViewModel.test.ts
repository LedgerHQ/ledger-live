import { act, renderHook } from "tests/testSetup";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocation } from "react-router";
import { useRemoteLiveAppContext, useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useSelector } from "LLD/hooks/redux";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { useBorrowLiveConfig } from "LLD/features/Borrow/hooks/useBorrowLiveConfig";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  enablePlatformDevToolsSelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useBorrowAppViewModel } from "../useBorrowAppViewModel";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

const actualUseSelector = jest.requireActual<typeof import("LLD/hooks/redux")>(
  "LLD/hooks/redux",
).useSelector;

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useSelector: jest.fn(),
}));

jest.mock("~/renderer/components/Discreet", () => ({
  useDiscreetMode: jest.fn(),
}));

jest.mock("~/helpers/systemLocale", () => ({
  ...jest.requireActual("~/helpers/systemLocale"),
  getParsedSystemDeviceLocale: jest.fn(),
}));

jest.mock("LLD/features/Borrow/hooks/useBorrowLiveConfig", () => ({
  useBorrowLiveConfig: jest.fn(),
}));

jest.mock("~/renderer/hooks/useTheme", () => ({
  __esModule: true,
  default: jest.fn(() => ({ theme: "dark" })),
}));

const remoteManifest = { id: "borrow-remote", url: "https://remote.example" } as LiveAppManifest;
const localManifest = { id: "borrow-local", url: "https://local.example" } as LiveAppManifest;

describe("useBorrowAppViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      updateManifests: jest.fn(),
    } as unknown as ReturnType<typeof useRemoteLiveAppContext>);
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(remoteManifest);
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
    jest.mocked(useDiscreetMode).mockReturnValue(false);
    jest.mocked(getParsedSystemDeviceLocale).mockReturnValue({ region: "US" } as ReturnType<
      typeof getParsedSystemDeviceLocale
    >);
    jest.mocked(useBorrowLiveConfig).mockReturnValue(null);
    jest.mocked(useLocation).mockReturnValue({
      pathname: "/borrow",
      search: "",
      hash: "",
      state: null,
      key: "default",
    });

    jest.mocked(useSelector).mockImplementation(selector => {
      if (selector === counterValueCurrencySelector) return { ticker: "USD" };
      if (selector === languageSelector) return "en";
      if (selector === localeSelector) return "en-US";
      if (selector === developerModeSelector) return true;
      if (selector === enablePlatformDevToolsSelector) return true;
      return actualUseSelector(selector);
    });
  });

  it("prefers local manifest over remote manifest", () => {
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(localManifest);

    const { result } = renderHook(() => useBorrowAppViewModel());

    expect(result.current.manifest).toEqual(localManifest);
  });

  it("uses feature flag manifest id when provided", () => {
    jest.mocked(useBorrowLiveConfig).mockReturnValue({
      enabled: true,
      params: { manifest_id: "custom-borrow" },
    } as ReturnType<typeof useBorrowLiveConfig>);

    renderHook(() => useBorrowAppViewModel());

    expect(jest.mocked(useLocalLiveAppManifest)).toHaveBeenCalledWith("custom-borrow");
    expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("custom-borrow");
  });

  it("updates webviewState when onStateChange is called", () => {
    const { result } = renderHook(() => useBorrowAppViewModel());

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
    jest.mocked(useDiscreetMode).mockReturnValue(true);

    const { result } = renderHook(() => useBorrowAppViewModel());

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

      const { result } = renderHook(() => useBorrowAppViewModel());

      act(() => result.current.onBack());

      expect(mockNavigate).toHaveBeenCalledWith("/portfolio", { replace: true });
    });

    it('falls back to "/" when no returnTo is provided', () => {
      const { result } = renderHook(() => useBorrowAppViewModel());

      act(() => result.current.onBack());

      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
});
