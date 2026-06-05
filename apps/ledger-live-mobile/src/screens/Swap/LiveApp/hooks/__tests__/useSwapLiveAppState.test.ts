import { act, renderHook } from "@tests/test-renderer";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import type { NetInfoState } from "@react-native-community/netinfo";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useFeature } from "@features/platform-feature-flags";
import { useSwapLiveAppState } from "../useSwapLiveAppState";

const INITIAL_WEBVIEW_STATE = {
  url: "",
  canGoBack: false,
  canGoForward: false,
  title: "",
  loading: false,
  isAppUnavailable: false,
};

jest.mock("~/components/Web3AppWebview/helpers", () => ({
  initialWebviewState: {
    url: "",
    canGoBack: false,
    canGoForward: false,
    title: "",
    loading: false,
    isAppUnavailable: false,
  },
}));

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: { refresh: jest.fn() },
  useNetInfo: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(),
}));

const mockManifest = {
  id: "swap-live-app-demo-3",
  url: "https://swap.example.com",
} as unknown as LiveAppManifest;

const setNetInfoState = (state: { isConnected: boolean | null }) => {
  jest.mocked(useNetInfo).mockReturnValue(state as NetInfoState);
};

const setManifests = ({ local, remote }: { local?: LiveAppManifest; remote?: LiveAppManifest }) => {
  jest.mocked(useLocalLiveAppManifest).mockReturnValue(local);
  jest.mocked(useRemoteLiveAppManifest).mockReturnValue(remote);
};

const updateManifestsMock = jest.fn().mockResolvedValue(undefined);

const setRemoteContext = ({
  isLoading = false,
  updateManifests = updateManifestsMock,
}: { isLoading?: boolean; updateManifests?: jest.Mock } = {}) => {
  jest.mocked(useRemoteLiveAppContext).mockReturnValue({
    state: { isLoading },
    updateManifests,
  } as unknown as ReturnType<typeof useRemoteLiveAppContext>);
};

describe("useSwapLiveAppState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNetInfoState({ isConnected: true });
    setManifests({ remote: mockManifest });
    setRemoteContext();
    jest.mocked(useFeature).mockReturnValue(null);
  });

  describe("manifest resolution", () => {
    it("returns the remote manifest when available", () => {
      const { result } = renderHook(() => useSwapLiveAppState(undefined));
      expect(result.current.manifest).toEqual(mockManifest);
      expect(result.current.error).toBeNull();
    });

    it("prefers the local manifest over the remote one", () => {
      const localManifest = {
        id: "swap-local",
        url: "https://local.example.com",
      } as unknown as LiveAppManifest;
      setManifests({ local: localManifest, remote: mockManifest });

      const { result } = renderHook(() => useSwapLiveAppState(undefined));
      expect(result.current.manifest).toEqual(localManifest);
    });

    it("uses the custom manifest_id from the feature flag", () => {
      jest.mocked(useFeature).mockReturnValue({
        enabled: true,
        params: { manifest_id: "custom-swap" },
      } as unknown as ReturnType<typeof useFeature>);

      renderHook(() => useSwapLiveAppState(undefined));

      expect(jest.mocked(useLocalLiveAppManifest)).toHaveBeenCalledWith("custom-swap");
      expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("custom-swap");
    });
  });

  describe("error computation", () => {
    it("returns an error when no manifest is found", () => {
      setManifests({});

      const { result } = renderHook(() => useSwapLiveAppState(undefined));
      expect(result.current.manifest).toBeUndefined();
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it("returns an error when the device is not connected", () => {
      setNetInfoState({ isConnected: false });

      const { result } = renderHook(() => useSwapLiveAppState(undefined));
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it("does not error when connectivity is unknown (null)", () => {
      setNetInfoState({ isConnected: null });

      const { result } = renderHook(() => useSwapLiveAppState(undefined));
      expect(result.current.error).toBeNull();
    });

    it("returns an error when the webview navigates to /unknown-error", () => {
      const { result } = renderHook(() => useSwapLiveAppState(undefined));
      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setWebviewState({
          ...INITIAL_WEBVIEW_STATE,
          url: "https://swap.example.com/unknown-error",
        });
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("isLoading", () => {
    it("mirrors the remote live app loading state", () => {
      setRemoteContext({ isLoading: true });

      const { result } = renderHook(() => useSwapLiveAppState(undefined));
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("retry", () => {
    it("refreshes connectivity and re-fetches the manifest registry", () => {
      const { result } = renderHook(() => useSwapLiveAppState(undefined));

      act(() => {
        result.current.retry();
      });

      // The core fix: a stale `isConnected === false` keeps the error screen up, so
      // connectivity must be re-evaluated on tap (useNetInfo only updates on events).
      expect(jest.mocked(NetInfo.refresh)).toHaveBeenCalledTimes(1);
      expect(updateManifestsMock).toHaveBeenCalledTimes(1);
    });

    it("clears the webview error state so the screen can recover", () => {
      const { result } = renderHook(() => useSwapLiveAppState(undefined));

      act(() => {
        result.current.setWebviewState({
          ...INITIAL_WEBVIEW_STATE,
          url: "https://swap.example.com/unknown-error",
        });
      });
      expect(result.current.error).toBeInstanceOf(Error);

      act(() => {
        result.current.retry();
      });

      expect(result.current.webviewState).toEqual(INITIAL_WEBVIEW_STATE);
      expect(result.current.error).toBeNull();
    });
  });
});
