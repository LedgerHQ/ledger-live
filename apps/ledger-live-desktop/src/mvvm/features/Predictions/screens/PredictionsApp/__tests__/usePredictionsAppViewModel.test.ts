import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocation } from "react-router";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { usePredictionsAppViewModel } from "../usePredictionsAppViewModel";

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

jest.mock("@ledgerhq/wallet-api-server", () => ({
  ...jest.requireActual("@ledgerhq/wallet-api-server"),
  customWrapper: jest.fn(handler => handler),
}));

jest.mock("~/helpers/systemLocale", () => ({
  ...jest.requireActual("~/helpers/systemLocale"),
  getParsedSystemDeviceLocale: jest.fn(),
}));

const remoteManifest = { id: "predictions-remote" } as LiveAppManifest;
const localManifest = { id: "predictions-local" } as LiveAppManifest;

const initialState = {
  settings: {
    counterValue: "USD",
    language: "en" as const,
    locale: "en-US" as const,
    developerMode: false,
    enablePlatformDevTools: false,
    discreetMode: false,
    theme: "dark",
  },
};

function mockLocationState(state: unknown) {
  jest.mocked(useLocation).mockReturnValue({
    pathname: "/predictions",
    search: "",
    hash: "",
    state,
    key: "default",
  });
}

describe("usePredictionsAppViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      state: { isLoading: false, value: {}, error: null },
      updateManifests: jest.fn(),
    } as unknown as ReturnType<typeof useRemoteLiveAppContext>);
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(remoteManifest);
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
    jest
      .mocked(getParsedSystemDeviceLocale)
      .mockReturnValue({ region: "US" } as ReturnType<typeof getParsedSystemDeviceLocale>);
    mockLocationState(null);
  });

  it("should prefer the local manifest over the remote one", () => {
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(localManifest);

    const { result } = renderHook(() => usePredictionsAppViewModel(), { initialState });

    expect(result.current.manifest).toEqual(localManifest);
  });

  it("should load the default Predictions manifest", () => {
    renderHook(() => usePredictionsAppViewModel(), { initialState });

    expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("predictions-live-app");
  });

  it("should load the manifest set by the flag", () => {
    renderHook(() => usePredictionsAppViewModel(), {
      initialState: {
        ...initialState,
        ...withFlagOverrides({
          ptxPredictionsLiveAppDesktop: {
            enabled: true,
            params: { manifest_id: "predictions-live-app-stg" },
          },
        }),
      },
    });

    expect(jest.mocked(useLocalLiveAppManifest)).toHaveBeenCalledWith("predictions-live-app-stg");
    expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("predictions-live-app-stg");
  });

  it("should load the default Predictions manifest when the flag sets an empty one", () => {
    renderHook(() => usePredictionsAppViewModel(), {
      initialState: {
        ...initialState,
        ...withFlagOverrides({
          ptxPredictionsLiveAppDesktop: { enabled: true, params: { manifest_id: "" } },
        }),
      },
    });

    expect(jest.mocked(useRemoteLiveAppManifest)).toHaveBeenCalledWith("predictions-live-app");
  });

  it("should pass the host context to the live app", () => {
    const { result } = renderHook(() => usePredictionsAppViewModel(), { initialState });

    expect(result.current.inputs).toEqual({
      devMode: "false",
      theme: "dark",
      lang: "en",
      locale: "en-US",
      countryLocale: "US",
      currencyTicker: "USD",
      OS: "web",
      platform: "LLD",
      discreetMode: "false",
    });
  });

  it("should pass the deeplink params to the live app, without returnTo", () => {
    mockLocationState({ returnTo: "/portfolio", eventSlug: "will-btc-hit-100k" });

    const { result } = renderHook(() => usePredictionsAppViewModel(), { initialState });

    expect(result.current.inputs).toEqual(
      expect.objectContaining({ eventSlug: "will-btc-hit-100k", platform: "LLD" }),
    );
    expect(result.current.inputs).not.toHaveProperty("returnTo");
  });

  it("should not let a deeplink param override the host context", () => {
    mockLocationState({ platform: "LLM" });

    const { result } = renderHook(() => usePredictionsAppViewModel(), { initialState });

    expect(result.current.inputs.platform).toBe("LLD");
  });

  it("should keep the host context in a deeplink's goToURL, without returnTo", () => {
    mockLocationState({
      returnTo: "/portfolio",
      goToURL: "https://predictions.live.ledger.com/category/sports",
    });

    const { result } = renderHook(() => usePredictionsAppViewModel(), { initialState });

    const goToURL = new URL(result.current.inputs.goToURL ?? "");
    expect(goToURL.pathname).toBe("/category/sports");
    expect(goToURL.searchParams.get("platform")).toBe("LLD");
    expect(goToURL.searchParams.has("returnTo")).toBe(false);
  });

  it("should go back to returnTo when the live app closes itself", async () => {
    mockLocationState({ returnTo: "/portfolio" });
    const { result } = renderHook(() => usePredictionsAppViewModel(), { initialState });
    const handlers = result.current.customHandlers as unknown as Record<string, () => unknown>;

    await act(async () => {
      await handlers["custom.predictions.close"]();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/portfolio", { replace: true });
  });

  it("should go back to the portfolio root when no returnTo is provided", async () => {
    const { result } = renderHook(() => usePredictionsAppViewModel(), { initialState });
    const handlers = result.current.customHandlers as unknown as Record<string, () => unknown>;

    await act(async () => {
      await handlers["custom.predictions.close"]();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
