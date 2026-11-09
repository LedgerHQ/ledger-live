import { BackHandler, type HardwareBackPressEvent } from "react-native";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useNetworkState, type NetworkState } from "@shared/network-status";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import type { WebviewAPI } from "~/components/Web3AppWebview/types";
import { usePredictionsLiveAppViewModel } from "../usePredictionsLiveAppViewModel";

const mockClose = jest.fn();
const mockGoBack = jest.fn();
const mockRouteParams = jest.fn<Record<string, string> | undefined, []>();
const mockIsFocused = jest.fn<boolean, []>();

jest.mock("@react-navigation/native", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    ...jest.requireActual("@react-navigation/native"),
    useNavigation: () => ({ goBack: mockGoBack }),
    useRoute: () => ({ params: mockRouteParams() }),
    useFocusEffect: (effect: () => (() => void) | undefined) => {
      const isFocused = mockIsFocused();
      useEffect(() => (isFocused ? effect() : undefined), [effect, isFocused]);
    },
  };
});

jest.mock("~/components/Web3AppWebview/helpers", () => ({
  initialWebviewState: {
    url: "",
    canGoBack: false,
    canGoForward: false,
    title: "",
    loading: false,
  },
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("LLM/features/Predictions/hooks/usePredictionsHandlers", () => ({
  usePredictionsHandlers: () => ({ "custom.predictions.close": mockClose }),
}));

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getCountryLocale: jest.fn(),
}));

const remoteManifest = { id: "predictions-remote" } as LiveAppManifest;
const localManifest = { id: "predictions-local" } as LiveAppManifest;

const setNetworkState = (state: NetworkState) => {
  jest.mocked(useNetworkState).mockReturnValue(state);
};

const setManifests = ({ local, remote }: { local?: LiveAppManifest; remote?: LiveAppManifest }) => {
  jest.mocked(useLocalLiveAppManifest).mockReturnValue(local);
  jest.mocked(useRemoteLiveAppManifest).mockReturnValue(remote);
};

const backPressEvent: HardwareBackPressEvent = { type: "hardwareBackPress", timeStamp: 0 };

describe("usePredictionsLiveAppViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNetworkState({ isConnected: true });
    setManifests({ remote: remoteManifest });
    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      state: { isLoading: false },
    } as ReturnType<typeof useRemoteLiveAppContext>);
    jest.mocked(getCountryLocale).mockReturnValue("US");
    mockRouteParams.mockReturnValue(undefined);
    mockIsFocused.mockReturnValue(true);
  });

  it("should prefer the local manifest over the remote one", () => {
    setManifests({ local: localManifest, remote: remoteManifest });

    const { result } = renderHook(() => usePredictionsLiveAppViewModel());

    expect(result.current.manifest).toEqual(localManifest);
    expect(result.current.error).toBeNull();
  });

  it("should load the default Predictions manifest", () => {
    renderHook(() => usePredictionsLiveAppViewModel());

    expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("predictions-live-app");
  });

  it("should load the manifest set by the flag", () => {
    renderHook(() => usePredictionsLiveAppViewModel(), {
      overrideInitialState: withFlagOverrides({
        ptxPredictionsLiveAppMobile: {
          enabled: true,
          params: { manifest_id: "predictions-live-app-stg" },
        },
      }),
    });

    expect(jest.mocked(useLocalLiveAppManifest)).toHaveBeenCalledWith("predictions-live-app-stg");
    expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("predictions-live-app-stg");
  });

  it("should load the default Predictions manifest when the flag sets an empty one", () => {
    renderHook(() => usePredictionsLiveAppViewModel(), {
      overrideInitialState: withFlagOverrides({
        ptxPredictionsLiveAppMobile: { enabled: true, params: { manifest_id: "" } },
      }),
    });

    expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("predictions-live-app");
  });

  it("should return an error when the manifest is missing", () => {
    setManifests({});

    const { result } = renderHook(() => usePredictionsLiveAppViewModel());

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("should return an error when offline", () => {
    setNetworkState({ isConnected: false });

    const { result } = renderHook(() => usePredictionsLiveAppViewModel());

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("should pass the host context to the live app", () => {
    const { result } = renderHook(() => usePredictionsLiveAppViewModel(), {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, theme: "light" },
      }),
    });

    expect(result.current.webviewInputs).toEqual(
      expect.objectContaining({
        theme: "light",
        countryLocale: "US",
        platform: "LLM",
        discreetMode: "false",
      }),
    );
  });

  it("should tell the live app when discreet mode is on", () => {
    const { result } = renderHook(() => usePredictionsLiveAppViewModel(), {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, discreetMode: true },
      }),
    });

    expect(result.current.webviewInputs.discreetMode).toBe("true");
  });

  it("should pass the deeplink params to the live app", () => {
    mockRouteParams.mockReturnValue({ eventSlug: "will-btc-hit-100k" });

    const { result } = renderHook(() => usePredictionsLiveAppViewModel());

    expect(result.current.webviewInputs).toEqual(
      expect.objectContaining({ eventSlug: "will-btc-hit-100k", platform: "LLM" }),
    );
  });

  it("should not let a deeplink param override the host context", () => {
    mockRouteParams.mockReturnValue({ platform: "LLD" });

    const { result } = renderHook(() => usePredictionsLiveAppViewModel());

    expect(result.current.webviewInputs.platform).toBe("LLM");
  });

  it("should keep the host context and the safe area in a deeplink's goToURL", () => {
    mockRouteParams.mockReturnValue({
      goToURL: "https://predictions.live.ledger.com/category/sports",
    });

    const { result } = renderHook(() => usePredictionsLiveAppViewModel());

    const goToURL = new URL(result.current.webviewInputs.goToURL ?? "");
    expect(goToURL.pathname).toBe("/category/sports");
    expect(goToURL.searchParams.get("platform")).toBe("LLM");
    expect(goToURL.searchParams.has("safeAreaTop")).toBe(true);
  });

  it("should go back from the screen", () => {
    const { result } = renderHook(() => usePredictionsLiveAppViewModel());

    result.current.onBack();

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  describe("Android back button", () => {
    const previousPageState = {
      url: "http://localhost:3000/event/abc",
      canGoBack: true,
      canGoForward: false,
      title: "",
      loading: false,
      isAppUnavailable: false,
    };
    let backPressHandlers: Array<Parameters<typeof BackHandler.addEventListener>[1]>;

    const pressBack = () => {
      for (let i = backPressHandlers.length - 1; i >= 0; i--) {
        if (backPressHandlers[i](backPressEvent)) return true;
      }
      return false;
    };

    beforeEach(() => {
      backPressHandlers = [];
      jest.spyOn(BackHandler, "addEventListener").mockImplementation((event, handler) => {
        if (event === "hardwareBackPress") backPressHandlers.push(handler);
        return {
          remove: () => backPressHandlers.splice(backPressHandlers.indexOf(handler), 1),
        } as ReturnType<typeof BackHandler.addEventListener>;
      });
    });

    afterEach(() => {
      jest.mocked(BackHandler.addEventListener).mockRestore();
    });

    it("should go back inside the live app when it has a previous page", () => {
      const { result } = renderHook(() => usePredictionsLiveAppViewModel());
      const goBack = jest.fn();
      result.current.webviewRef.current = { goBack } as unknown as WebviewAPI;

      act(() => result.current.onWebviewStateChange(previousPageState));

      expect(pressBack()).toBe(true);
      expect(goBack).toHaveBeenCalledTimes(1);
    });

    it("should leave the back press to the navigation on the live app's first page", () => {
      const { result } = renderHook(() => usePredictionsLiveAppViewModel());
      const goBack = jest.fn();
      result.current.webviewRef.current = { goBack } as unknown as WebviewAPI;

      expect(pressBack()).toBe(false);
      expect(goBack).not.toHaveBeenCalled();
    });

    it("should leave the back press to a screen shown over Predictions", () => {
      const { result, rerender } = renderHook(() => usePredictionsLiveAppViewModel());
      const goBack = jest.fn();
      result.current.webviewRef.current = { goBack } as unknown as WebviewAPI;
      act(() => result.current.onWebviewStateChange(previousPageState));

      mockIsFocused.mockReturnValue(false);
      rerender({});

      expect(pressBack()).toBe(false);
      expect(goBack).not.toHaveBeenCalled();
    });

    it("should leave the back press to the navigation when the live app is not shown", () => {
      const { result } = renderHook(() => usePredictionsLiveAppViewModel());
      act(() => result.current.onWebviewStateChange(previousPageState));

      result.current.webviewRef.current = null;

      expect(pressBack()).toBe(false);
    });
  });

  it("should expose the Predictions handlers to the live app", () => {
    const { result } = renderHook(() => usePredictionsLiveAppViewModel());

    expect(result.current.customHandlers["custom.predictions.close"]).toBe(mockClose);
  });
});
