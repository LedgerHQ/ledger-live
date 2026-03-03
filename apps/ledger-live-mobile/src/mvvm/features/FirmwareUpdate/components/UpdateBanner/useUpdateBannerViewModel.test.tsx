import ReactNative from "react-native";
import { act, renderHook } from "@tests/test-renderer";
import { useUpdateBannerViewModel } from "./useUpdateBannerViewModel";
import { State } from "~/reducers/types";

// Mock react-navigation
const mockUseRoute = jest.fn();
const mockUseNavigation = jest.fn();
const mockUseFocusEffect = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: (...args: unknown[]) => mockUseRoute(...args),
  useNavigation: (...args: unknown[]) => mockUseNavigation(...args),
  useFocusEffect: (...args: unknown[]) => mockUseFocusEffect(...args),
}));

// Mock analytics
const mockTrack = jest.fn();
jest.mock("~/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

// Mock useLatestFirmware
jest.mock("@ledgerhq/live-common/device/hooks/useLatestFirmware", () => ({
  ...jest.requireActual("@ledgerhq/live-common/device/hooks/useLatestFirmware"),
  useLatestFirmware: jest.fn(),
}));
const { useLatestFirmware } = jest.requireMock(
  "@ledgerhq/live-common/device/hooks/useLatestFirmware",
);

// Mock isFirmwareUpdateSupported
jest.mock("../../utils/isFirmwareUpdateSupported", () => ({
  ...jest.requireActual("../../utils/isFirmwareUpdateSupported"),
  isNewFirmwareUpdateUxSupported: jest.fn(),
  isBleUpdateSupported: jest.fn(),
}));
const { isNewFirmwareUpdateUxSupported, isBleUpdateSupported } = jest.requireMock(
  "../../utils/isFirmwareUpdateSupported",
);

// Mock navigation to new and old update flows
jest.mock("../../utils/navigateToNewUpdateFlow", () => ({
  navigateToNewUpdateFlow: jest.fn(),
}));
const { navigateToNewUpdateFlow } = jest.requireMock("../../utils/navigateToNewUpdateFlow");

function withState(overrides: {
  hasConnectedDevice?: boolean;
  hasCompletedOnboarding?: boolean;
  lastConnectedDevice?: Record<string, unknown> | null;
  seenDevices?: Record<string, unknown>[];
  withWallet40MainNav?: boolean;
}) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      settings: {
        ...state.settings,
        ...(overrides.hasCompletedOnboarding !== undefined && {
          hasCompletedOnboarding: overrides.hasCompletedOnboarding,
        }),
        ...(overrides.lastConnectedDevice !== undefined && {
          lastConnectedDevice:
            overrides.lastConnectedDevice as State["settings"]["lastConnectedDevice"],
        }),
        ...(overrides.seenDevices !== undefined && {
          seenDevices: overrides.seenDevices as State["settings"]["seenDevices"],
        }),
        ...(overrides.withWallet40MainNav && {
          overriddenFeatureFlags: {
            ...state.settings.overriddenFeatureFlags,
            lwmWallet40: { enabled: true, params: { mainNavigation: true } },
          },
        }),
      },
      appstate: {
        ...state.appstate,
        ...(overrides.hasConnectedDevice !== undefined && {
          hasConnectedDevice: overrides.hasConnectedDevice,
        }),
      },
    }),
  };
}

describe("useUpdateBannerViewModel", () => {
  let PlatformSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    PlatformSpy = jest.spyOn(ReactNative, "Platform", "get");
    mockUseRoute.mockReturnValue({ name: "Portfolio" });
    mockUseNavigation.mockReturnValue({ navigate: jest.fn() });
    mockUseFocusEffect.mockImplementation((cb: () => void) => cb());
  });
  afterEach(() => {
    PlatformSpy?.mockRestore();
  });

  it("should return bannerVisible: true if conditions are fulfilled", () => {
    const lastConnectedDevice = { modelId: "nanoX" };
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion", version: "1.0.0" } });

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: true,
        hasCompletedOnboarding: true,
        lastConnectedDevice,
      }),
    );

    expect(result.current.bannerVisible).toBe(true);
    expect(result.current.version).toBe("mockVersion");
    expect(result.current.lastConnectedDevice).toBe(lastConnectedDevice);
  });

  it("should return bannerVisible: false if there is no update", () => {
    useLatestFirmware.mockReturnValue(null);

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: true,
        hasCompletedOnboarding: true,
      }),
    );

    expect(result.current.bannerVisible).toBe(false);
  });

  it("should return bannerVisible: false if onboarding has not been completed", () => {
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: true,
        hasCompletedOnboarding: false,
      }),
    );

    expect(result.current.bannerVisible).toBe(false);
  });

  it("should return bannerVisible: false if there is no connected device", () => {
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: false,
        hasCompletedOnboarding: true,
      }),
    );

    expect(result.current.bannerVisible).toBe(false);
  });

  it("should return isUpdateSupportedButDeviceNotWired: true if the update is supported only on USB and the device is not wired, on iOS", () => {
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
    isNewFirmwareUpdateUxSupported.mockReturnValue(true);
    isBleUpdateSupported.mockReturnValue(false);
    PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "ios" });

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: true,
        hasCompletedOnboarding: true,
        lastConnectedDevice: { modelId: "nanoX", wired: false },
      }),
    );

    const { isUpdateSupportedButDeviceNotWired } = result.current;
    expect(isUpdateSupportedButDeviceNotWired).toBe(false);
  });

  it("should return isUpdateSupportedButDeviceNotWired: true if the update is supported only on USB and the device is not wired, on Android", () => {
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
    isNewFirmwareUpdateUxSupported.mockReturnValue(true);
    isBleUpdateSupported.mockReturnValue(false);
    PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "android" });

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: true,
        hasCompletedOnboarding: true,
        lastConnectedDevice: { modelId: "nanoX", wired: false },
      }),
    );

    const { isUpdateSupportedButDeviceNotWired } = result.current;
    expect(isUpdateSupportedButDeviceNotWired).toBe(true);
  });

  it("should not call startFirmwareUpdateFlow when onClickUpdate is called if update flow is not supported", () => {
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
    isNewFirmwareUpdateUxSupported.mockReturnValue(false);

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: true,
        hasCompletedOnboarding: true,
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(true);

    act(() => result.current.closeUnsupportedUpdateDrawer());
    expect(result.current.unsupportedUpdateDrawerOpened).toBe(false);
  });

  it("should not call startFirmwareUpdateFlow when onClickUpdate is called for a bluetooth Nano X update with version < 2.4.0", () => {
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion", version: "2.4.0" } });
    isNewFirmwareUpdateUxSupported.mockReturnValue(true);

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: true,
        hasCompletedOnboarding: true,
        lastConnectedDevice: { modelId: "nanoX", wired: false },
        seenDevices: [{ modelId: "nanoX", deviceInfo: { version: "2.3.9" } }],
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(true);
  });

  it("should call startFirmwareUpdateFlow when onClickUpdate is called if new update flow is supported", () => {
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
    isNewFirmwareUpdateUxSupported.mockReturnValue(true);
    isBleUpdateSupported.mockReturnValue(true);

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: true,
        hasCompletedOnboarding: true,
        seenDevices: [{ modelId: "nanoX", deviceInfo: { version: "3.0.0" } }],
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(false);
    expect(navigateToNewUpdateFlow).toHaveBeenCalled();
  });

  it("should call startFirmwareUpdateFlow when onClickUpdate is called for a bluetooth Nano X update with version >= 2.4.0", () => {
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
    isBleUpdateSupported.mockReturnValue(true);
    isNewFirmwareUpdateUxSupported.mockReturnValue(true);

    const { result } = renderHook(
      () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
      withState({
        hasConnectedDevice: true,
        hasCompletedOnboarding: true,
        lastConnectedDevice: { modelId: "nanoX", wired: false },
        seenDevices: [{ modelId: "nanoX", deviceInfo: { version: "2.4.0" } }],
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(false);
    expect(navigateToNewUpdateFlow).toHaveBeenCalled();
  });

  describe("analytics", () => {
    it("should track banner impression when shouldDisplayWallet40MainNav is true and screen is focused", () => {
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      renderHook(
        () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
        withState({
          hasConnectedDevice: true,
          hasCompletedOnboarding: true,
          withWallet40MainNav: true,
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith("banner_impression", {
        banner: "OS update",
        page: "portfolio",
      });
    });

    it("should track banner impression with 'my ledger' page when on MyLedgerDevice screen", () => {
      mockUseRoute.mockReturnValue({ name: "MyLedgerDevice" });
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      renderHook(
        () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
        withState({
          hasConnectedDevice: true,
          hasCompletedOnboarding: true,
          withWallet40MainNav: true,
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith("banner_impression", {
        banner: "OS update",
        page: "my ledger",
      });
    });

    it("should not track banner impression when shouldDisplayWallet40MainNav is false", () => {
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      renderHook(
        () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
        withState({
          hasConnectedDevice: true,
          hasCompletedOnboarding: true,
        }),
      );

      expect(mockTrack).not.toHaveBeenCalledWith("banner_impression", expect.anything());
    });

    it("should not track banner impression when screen is not focused", () => {
      mockUseFocusEffect.mockImplementation(() => {});
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      renderHook(
        () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
        withState({
          hasConnectedDevice: true,
          hasCompletedOnboarding: true,
          withWallet40MainNav: true,
        }),
      );

      expect(mockTrack).not.toHaveBeenCalledWith("banner_impression", expect.anything());
    });

    it("should track impression only once even if re-rendered", () => {
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      const { rerender } = renderHook(
        () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
        withState({
          hasConnectedDevice: true,
          hasCompletedOnboarding: true,
          withWallet40MainNav: true,
        }),
      );

      rerender({});

      const impressionCalls = mockTrack.mock.calls.filter(
        ([event]: [string]) => event === "banner_impression",
      );
      expect(impressionCalls).toHaveLength(1);
    });

    it("should track button_clicked when onClickUpdate is called", () => {
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
      isNewFirmwareUpdateUxSupported.mockReturnValue(false);

      const { result } = renderHook(
        () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
        withState({
          hasConnectedDevice: true,
          hasCompletedOnboarding: true,
          withWallet40MainNav: true,
        }),
      );

      act(() => result.current.onClickUpdate());

      expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
        page: "portfolio",
        banner: "OS update",
        button: "click(update)",
      });
    });

    it("should track button_clicked with 'my ledger' page when on MyLedgerDevice screen", () => {
      mockUseRoute.mockReturnValue({ name: "MyLedgerDevice" });
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
      isNewFirmwareUpdateUxSupported.mockReturnValue(false);

      const { result } = renderHook(
        () => useUpdateBannerViewModel({ onBackFromUpdate: jest.fn() }),
        withState({
          hasConnectedDevice: true,
          hasCompletedOnboarding: true,
          withWallet40MainNav: true,
        }),
      );

      act(() => result.current.onClickUpdate());

      expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
        page: "my ledger",
        banner: "OS update",
        button: "click(update)",
      });
    });
  });
});
