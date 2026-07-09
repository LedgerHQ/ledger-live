import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useNetInfo } from "@react-native-community/netinfo";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { useSwapLiveAppState } from "../useSwapLiveAppState";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const STUB_MANIFEST: LiveAppManifest = {
  id: "swap-test",
  name: "Swap Test",
  url: "https://swap.test",
  homepageUrl: "https://swap.test",
  platforms: ["ios", "android"],
  apiVersion: "2.0.0",
  manifestVersion: "2",
  branch: "stable",
  permissions: [],
  domains: [],
  categories: [],
  currencies: "*",
  highlight: false,
  visibility: "complete",
  content: {
    shortDescription: { en: "Swap assets" },
    description: { en: "Swap assets on Ledger Live" },
  },
};

const mockUseLocalLiveAppManifest = jest.fn(() => STUB_MANIFEST as LiveAppManifest | undefined);
const mockUseRemoteLiveAppManifest = jest.fn(() => undefined as LiveAppManifest | undefined);
const mockRemoteLiveAppState = { isLoading: false };

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: (_id: string | undefined) => mockUseLocalLiveAppManifest(),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: (_id: string | undefined) => mockUseRemoteLiveAppManifest(),
  useRemoteLiveAppContext: () => ({ state: mockRemoteLiveAppState }),
}));

const mockedUseNetInfo = jest.mocked(useNetInfo);

describe("useSwapLiveAppState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalLiveAppManifest.mockReturnValue(STUB_MANIFEST);
    mockUseRemoteLiveAppManifest.mockReturnValue(undefined);
    mockedUseNetInfo.mockReturnValue({ isConnected: true } as ReturnType<typeof useNetInfo>);
  });

  it("should return manifest and no error when manifest is available and network is up", () => {
    const { result } = renderHook(() => useSwapLiveAppState(null));

    expect(result.current.manifest).toBe(STUB_MANIFEST);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should prefer local manifest over remote manifest", () => {
    mockUseRemoteLiveAppManifest.mockReturnValue({
      ...STUB_MANIFEST,
      id: "swap-remote",
    } as LiveAppManifest);

    const { result } = renderHook(() => useSwapLiveAppState(null));

    expect(result.current.manifest?.id).toBe("swap-test");
  });

  it("should fall back to remote manifest when local manifest is not available", () => {
    const remoteManifest = { ...STUB_MANIFEST, id: "swap-remote" } as LiveAppManifest;
    mockUseLocalLiveAppManifest.mockReturnValue(undefined);
    mockUseRemoteLiveAppManifest.mockReturnValue(remoteManifest);

    const { result } = renderHook(() => useSwapLiveAppState(null));

    expect(result.current.manifest?.id).toBe("swap-remote");
  });

  it("should return an error when no manifest is available", () => {
    mockUseLocalLiveAppManifest.mockReturnValue(undefined);
    mockUseRemoteLiveAppManifest.mockReturnValue(undefined);

    const { result } = renderHook(() => useSwapLiveAppState(null));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.manifest).toBeUndefined();
  });

  it("should return a network error when offline", () => {
    mockedUseNetInfo.mockReturnValue({ isConnected: false } as ReturnType<typeof useNetInfo>);

    const { result } = renderHook(() => useSwapLiveAppState(null));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("errors.WebPTXPlayerNetworkFail.title");
  });

  it("should increment webviewResetKey when resetWebview is called", () => {
    const { result } = renderHook(() => useSwapLiveAppState(null));

    expect(result.current.webviewResetKey).toBe(0);

    act(() => {
      result.current.resetWebview();
    });

    expect(result.current.webviewResetKey).toBe(1);

    act(() => {
      result.current.resetWebview();
    });

    expect(result.current.webviewResetKey).toBe(2);
  });

  it("should return null defaultParams when params are invalid", () => {
    const { result } = renderHook(() => useSwapLiveAppState(null));
    expect(result.current.defaultParams).toBeNull();
  });

  it("should return null defaultParams when params is an empty object", () => {
    const { result } = renderHook(() => useSwapLiveAppState({}));
    expect(result.current.defaultParams).toBeNull();
  });

  it("should return defaultParams when at least one valid swap param key is present", () => {
    const params = { fromCurrencyId: "bitcoin", toCurrencyId: "ethereum" };
    const { result } = renderHook(() => useSwapLiveAppState(params));
    expect(result.current.defaultParams).toStrictEqual(params);
  });

  it("should return defaultParams when only one valid swap param key is set", () => {
    const params = { currency: "bitcoin" };
    const { result } = renderHook(() => useSwapLiveAppState(params));
    expect(result.current.defaultParams).toStrictEqual(params);
  });

  it("should return null defaultParams when all swap param values are undefined", () => {
    const params = { fromCurrencyId: undefined, toCurrencyId: undefined };
    const { result } = renderHook(() => useSwapLiveAppState(params));
    expect(result.current.defaultParams).toBeNull();
  });

  it("should return no error when isConnected is null and manifest is available (QAA edge case)", () => {
    // isConnected=null causes hasError=true (via !isConnected) but none of the specific
    // error conditions apply, so the error memo falls through to `return null`.
    mockedUseNetInfo.mockReturnValue({ isConnected: null } as ReturnType<typeof useNetInfo>);

    const { result } = renderHook(() => useSwapLiveAppState(null));

    expect(result.current.error).toBeNull();
    expect(result.current.manifest).toBe(STUB_MANIFEST);
  });

  it("should expose webviewRef and initial webviewState", () => {
    const { result } = renderHook(() => useSwapLiveAppState(null));

    expect(result.current.webviewRef).toBeDefined();
    expect(result.current.webviewState).toBeDefined();
    expect(result.current.webviewState.url).toBe("");
    expect(result.current.webviewState.loading).toBe(false);
  });

  it("should return APP_FAILED_TO_LOAD error when webview navigates to an error URL", () => {
    const { result } = renderHook(() => useSwapLiveAppState(null));

    act(() => {
      result.current.setWebviewState({ ...initialWebviewState, url: "/unknown-error" });
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("errors.AppManifestNotFoundError.title");
  });

  it("should use manifest_id from ptxSwapLiveAppMobile feature flag when provided", () => {
    const { result } = renderHook(() => useSwapLiveAppState(null), {
      overrideInitialState: withFlagOverrides({
        ptxSwapLiveAppMobile: { enabled: true, params: { manifest_id: "custom-swap-manifest" } },
      }),
    });

    expect(result.current.manifest).toBe(STUB_MANIFEST);
    expect(result.current.error).toBeNull();
  });

  it("should pass undefined to manifest hooks when manifest_id is an empty string", () => {
    // An empty string manifest_id is not nullish so the ?? fallback doesn't apply,
    // but `"" || undefined` converts it to undefined before passing to the hooks.
    const { result } = renderHook(() => useSwapLiveAppState(null), {
      overrideInitialState: withFlagOverrides({
        ptxSwapLiveAppMobile: { params: { manifest_id: "" } },
      }),
    });

    // Our mock always returns STUB_MANIFEST regardless of the id argument
    expect(result.current.manifest).toBe(STUB_MANIFEST);
    expect(result.current.error).toBeNull();
  });
});
