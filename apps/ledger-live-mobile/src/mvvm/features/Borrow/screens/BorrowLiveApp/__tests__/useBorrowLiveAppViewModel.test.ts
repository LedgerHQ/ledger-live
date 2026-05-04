import { renderHook } from "@tests/test-renderer";
import { useNetInfo } from "@react-native-community/netinfo";
import type { NetInfoState } from "@react-native-community/netinfo";
import { useRemoteLiveAppContext, useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useBorrowLiveConfig } from "LLM/features/Borrow/hooks/useBorrowLiveConfig";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useBorrowLiveAppViewModel } from "../useBorrowLiveAppViewModel";

jest.mock("~/components/Web3AppWebview/helpers", () => ({
  initialWebviewState: {
    url: "",
    canGoBack: false,
    canGoForward: false,
    title: "",
    loading: false,
  },
}));

jest.mock("styled-components/native", () => ({
  ...jest.requireActual("styled-components/native"),
  useTheme: () => ({ theme: "dark" }),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("LLM/features/Borrow/hooks/useBorrowLiveConfig", () => ({
  useBorrowLiveConfig: jest.fn(),
}));

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getCountryLocale: jest.fn(),
}));

const mockManifest = { id: "borrow", url: "https://borrow.example.com" } as unknown as LiveAppManifest;

const setNetInfoState = (state: { isConnected: boolean | null }) => {
  jest.mocked(useNetInfo).mockReturnValue(state as NetInfoState);
};

const setManifests = ({
  local,
  remote,
}: {
  local?: LiveAppManifest;
  remote?: LiveAppManifest;
}) => {
  jest.mocked(useLocalLiveAppManifest).mockReturnValue(local);
  jest.mocked(useRemoteLiveAppManifest).mockReturnValue(remote);
};

const setRemoteLoadingState = (isLoading: boolean) => {
  jest.mocked(useRemoteLiveAppContext).mockReturnValue({
    state: { isLoading },
  } as ReturnType<typeof useRemoteLiveAppContext>);
};

describe("useBorrowLiveAppViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNetInfoState({ isConnected: true });
    setManifests({ remote: mockManifest });
    setRemoteLoadingState(false);
    jest.mocked(useBorrowLiveConfig).mockReturnValue(null);
    jest.mocked(getCountryLocale).mockReturnValue("US");
  });

  it("should return a manifest when remote manifest is available", () => {
    const { result } = renderHook(() => useBorrowLiveAppViewModel());
    expect(result.current.manifest).toEqual(mockManifest);
    expect(result.current.error).toBeNull();
  });

  it("should prefer local manifest over remote", () => {
    const localManifest = { id: "borrow-local", url: "https://local.example.com" } as unknown as LiveAppManifest;
    setManifests({ local: localManifest, remote: mockManifest });

    const { result } = renderHook(() => useBorrowLiveAppViewModel());
    expect(result.current.manifest).toEqual(localManifest);
  });

  it("should return error when no manifest is found", () => {
    setManifests({});

    const { result } = renderHook(() => useBorrowLiveAppViewModel());
    expect(result.current.manifest).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("should return error when not connected", () => {
    setNetInfoState({ isConnected: false });

    const { result } = renderHook(() => useBorrowLiveAppViewModel());
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("should expose isLoading from remote live app state", () => {
    setRemoteLoadingState(true);

    const { result } = renderHook(() => useBorrowLiveAppViewModel());
    expect(result.current.isLoading).toBe(true);
  });

  it("should not be loading when remote state is idle", () => {
    setRemoteLoadingState(false);

    const { result } = renderHook(() => useBorrowLiveAppViewModel());
    expect(result.current.isLoading).toBe(false);
  });

  it("should use custom manifest_id from borrow config", () => {
    jest.mocked(useBorrowLiveConfig).mockReturnValue({
      enabled: true,
      params: { manifest_id: "custom-borrow" },
    } as ReturnType<typeof useBorrowLiveConfig>);

    renderHook(() => useBorrowLiveAppViewModel());

    expect(jest.mocked(useLocalLiveAppManifest)).toHaveBeenCalledWith("custom-borrow");
    expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("custom-borrow");
  });

  it("should provide webview inputs with expected fields", () => {
    const { result } = renderHook(() => useBorrowLiveAppViewModel());
    const { webviewInputs } = result.current;

    expect(webviewInputs).toEqual(
      expect.objectContaining({
        platform: "LLM",
        OS: expect.any(String),
        theme: expect.any(String),
        lang: expect.any(String),
        locale: expect.any(String),
        countryLocale: "US",
        currencyTicker: expect.any(String),
        devMode: expect.any(String),
      }),
    );
  });

  it("should expose a webviewRef", () => {
    const { result } = renderHook(() => useBorrowLiveAppViewModel());
    expect(result.current.webviewRef).toBeDefined();
    expect(result.current.webviewRef.current).toBeNull();
  });

  it("should expose onWebviewStateChange callback that can be called", () => {
    const { result } = renderHook(() => useBorrowLiveAppViewModel());
    expect(() => {
      result.current.onWebviewStateChange({
        url: "https://test.com",
        canGoBack: true,
        canGoForward: false,
        title: "Test",
        loading: false,
      } as Parameters<typeof result.current.onWebviewStateChange>[0]);
    }).not.toThrow();
  });
});
