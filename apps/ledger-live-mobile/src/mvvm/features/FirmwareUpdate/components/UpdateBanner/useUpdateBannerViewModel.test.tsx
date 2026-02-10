import ReactNative from "react-native";
import { act, renderHook } from "@testing-library/react-native";
import { useUpdateBannerViewModel } from "./useUpdateBannerViewModel";

/** Brace yourselves for the mocks ... */

// Mock react-navigation
const mockUseRoute = jest.fn();
const mockUseNavigation = jest.fn();
const mockUseIsFocused = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: (...args: unknown[]) => mockUseRoute(...args),
  useNavigation: (...args: unknown[]) => mockUseNavigation(...args),
  useIsFocused: (...args: unknown[]) => mockUseIsFocused(...args),
}));

// Mock analytics
const mockTrack = jest.fn();
jest.mock("~/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

jest.mock("react-redux", () => {
  const actual = jest.requireActual("react-redux");
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockUseSelector = jest
    .fn()
    .mockImplementation((selector: () => unknown) => selector()) as jest.Mock & {
    withTypes: () => jest.Mock;
  };
  mockUseSelector.withTypes = () => mockUseSelector;
  return {
    ...actual,
    useSelector: mockUseSelector,
  };
});

// Mock the selectors
jest.mock("~/reducers/settings", () => ({
  ...jest.requireActual("~/reducers/settings"),
  lastSeenDeviceSelector: jest.fn(),
  lastConnectedDeviceSelector: jest.fn(),
  hasCompletedOnboardingSelector: jest.fn(),
}));
const { lastConnectedDeviceSelector, hasCompletedOnboardingSelector, lastSeenDeviceSelector } =
  jest.requireMock("~/reducers/settings");

jest.mock("~/reducers/appstate", () => ({
  ...jest.requireActual("~/reducers/appstate"),
  hasConnectedDeviceSelector: jest.fn(),
}));
const { hasConnectedDeviceSelector } = jest.requireMock("~/reducers/appstate");

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

// Mock useWalletFeaturesConfig
const mockUseWalletFeaturesConfig = jest.fn();
jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  useWalletFeaturesConfig: (...args: unknown[]) => mockUseWalletFeaturesConfig(...args),
}));

// Mock navigation to new and old update flows
jest.mock("../../utils/navigateToNewUpdateFlow", () => ({
  navigateToNewUpdateFlow: jest.fn(),
}));
const { navigateToNewUpdateFlow } = jest.requireMock("../../utils/navigateToNewUpdateFlow");

/** TESTS */

describe("useUpdateBannerViewModel", () => {
  let PlatformSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    PlatformSpy = jest.spyOn(ReactNative, "Platform", "get");
    mockUseRoute.mockReturnValue({ name: "Portfolio" });
    mockUseNavigation.mockReturnValue({ navigate: jest.fn() });
    mockUseIsFocused.mockReturnValue(true);
    mockUseWalletFeaturesConfig.mockReturnValue({ shouldDisplayWallet40MainNav: false });
  });
  afterEach(() => {
    PlatformSpy?.mockRestore();
  });

  it("should return bannerVisible: true if conditions are fulfilled", () => {
    const lastConnectedDevice = { modelId: "mockModelId" };
    lastConnectedDeviceSelector.mockReturnValue(lastConnectedDevice);
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion", version: "1.0.0" } });

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    expect(result.current.bannerVisible).toBe(true);
    expect(result.current.version).toBe("mockVersion");
    expect(result.current.lastConnectedDevice).toBe(lastConnectedDevice);
  });

  it("should return bannerVisible: false if there is no update", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue(null);

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    expect(result.current.bannerVisible).toBe(false);
  });

  it("should return bannerVisible: false if onboarding has not been completed", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(false);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    expect(result.current.bannerVisible).toBe(false);
  });

  it("should return bannerVisible: false if there is no connected device", () => {
    hasConnectedDeviceSelector.mockReturnValue(false);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    expect(result.current.bannerVisible).toBe(false);
  });

  it("should return isUpdateSupportedButDeviceNotWired: true if the update is supported only on USB and the device is not wired, on iOS", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
    lastConnectedDeviceSelector.mockReturnValue({ modelId: "nanoX", wired: false });
    isNewFirmwareUpdateUxSupported.mockReturnValue(true);
    isBleUpdateSupported.mockReturnValue(false);
    PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "ios" });

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    const { isUpdateSupportedButDeviceNotWired } = result.current;
    expect(isUpdateSupportedButDeviceNotWired).toBe(false);
  });

  it("should return isUpdateSupportedButDeviceNotWired: true if the update is supported only on USB and the device is not wired, on Android", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
    lastConnectedDeviceSelector.mockReturnValue({ modelId: "nanoX", wired: false });
    isNewFirmwareUpdateUxSupported.mockReturnValue(true);
    isBleUpdateSupported.mockReturnValue(false);
    PlatformSpy.mockReturnValue({ ...ReactNative.Platform, OS: "android" });

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    const { isUpdateSupportedButDeviceNotWired } = result.current;
    expect(isUpdateSupportedButDeviceNotWired).toBe(true);
  });

  it("should not call startFirmwareUpdateFlow when onClickUpdate is called if update flow is not supported", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

    isNewFirmwareUpdateUxSupported.mockReturnValue(false);

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(true);

    act(() => result.current.closeUnsupportedUpdateDrawer());
    expect(result.current.unsupportedUpdateDrawerOpened).toBe(false);
  });

  it("should not call startFirmwareUpdateFlow when onClickUpdate is called for a bluetooth Nano X update with version < 2.4.0", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion", version: "2.4.0" } });
    lastConnectedDeviceSelector.mockReturnValue({ modelId: "nanoX", wired: false });
    lastSeenDeviceSelector.mockReturnValue({ modelId: "nanoX", deviceInfo: { version: "2.3.9" } });

    isNewFirmwareUpdateUxSupported.mockReturnValue(true);

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(true);
  });

  it("should call startFirmwareUpdateFlow when onClickUpdate is called if new update flow is supported", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
    lastSeenDeviceSelector.mockReturnValue({ modelId: "mockId", deviceInfo: { version: "3.0.0" } });

    isNewFirmwareUpdateUxSupported.mockReturnValue(true);
    isBleUpdateSupported.mockReturnValue(true);

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(false);
    expect(navigateToNewUpdateFlow).toHaveBeenCalled();
  });

  it("should call startFirmwareUpdateFlow when onClickUpdate is called for a bluetooth Nano X update with version >= 2.4.0", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
    lastConnectedDeviceSelector.mockReturnValue({
      modelId: "nanoX",
      wired: false,
    });
    lastSeenDeviceSelector.mockReturnValue({ modelId: "nanoX", deviceInfo: { version: "2.4.0" } });

    isBleUpdateSupported.mockReturnValue(true);
    isNewFirmwareUpdateUxSupported.mockReturnValue(true);

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(false);
    expect(navigateToNewUpdateFlow).toHaveBeenCalled();
  });

  describe("analytics", () => {
    it("should track banner impression when shouldDisplayWallet40MainNav is true and screen is focused", () => {
      mockUseWalletFeaturesConfig.mockReturnValue({ shouldDisplayWallet40MainNav: true });
      mockUseIsFocused.mockReturnValue(true);
      hasConnectedDeviceSelector.mockReturnValue(true);
      hasCompletedOnboardingSelector.mockReturnValue(true);
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      renderHook(() =>
        useUpdateBannerViewModel({
          onBackFromUpdate: jest.fn(),
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith("banner_impression", {
        banner: "OS update",
        page: "portfolio",
      });
    });

    it("should track banner impression with 'my ledger' page when on MyLedgerDevice screen", () => {
      mockUseWalletFeaturesConfig.mockReturnValue({ shouldDisplayWallet40MainNav: true });
      mockUseIsFocused.mockReturnValue(true);
      mockUseRoute.mockReturnValue({ name: "MyLedgerDevice" });
      hasConnectedDeviceSelector.mockReturnValue(true);
      hasCompletedOnboardingSelector.mockReturnValue(true);
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      renderHook(() =>
        useUpdateBannerViewModel({
          onBackFromUpdate: jest.fn(),
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith("banner_impression", {
        banner: "OS update",
        page: "my ledger",
      });
    });

    it("should not track banner impression when shouldDisplayWallet40MainNav is false", () => {
      mockUseWalletFeaturesConfig.mockReturnValue({ shouldDisplayWallet40MainNav: false });
      mockUseIsFocused.mockReturnValue(true);
      hasConnectedDeviceSelector.mockReturnValue(true);
      hasCompletedOnboardingSelector.mockReturnValue(true);
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      renderHook(() =>
        useUpdateBannerViewModel({
          onBackFromUpdate: jest.fn(),
        }),
      );

      expect(mockTrack).not.toHaveBeenCalledWith("banner_impression", expect.anything());
    });

    it("should not track banner impression when screen is not focused", () => {
      mockUseWalletFeaturesConfig.mockReturnValue({ shouldDisplayWallet40MainNav: true });
      mockUseIsFocused.mockReturnValue(false);
      hasConnectedDeviceSelector.mockReturnValue(true);
      hasCompletedOnboardingSelector.mockReturnValue(true);
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      renderHook(() =>
        useUpdateBannerViewModel({
          onBackFromUpdate: jest.fn(),
        }),
      );

      expect(mockTrack).not.toHaveBeenCalledWith("banner_impression", expect.anything());
    });

    it("should track impression only once even if re-rendered", () => {
      mockUseWalletFeaturesConfig.mockReturnValue({ shouldDisplayWallet40MainNav: true });
      mockUseIsFocused.mockReturnValue(true);
      hasConnectedDeviceSelector.mockReturnValue(true);
      hasCompletedOnboardingSelector.mockReturnValue(true);
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

      const { rerender } = renderHook(() =>
        useUpdateBannerViewModel({
          onBackFromUpdate: jest.fn(),
        }),
      );

      rerender({});

      const impressionCalls = mockTrack.mock.calls.filter(
        ([event]: [string]) => event === "banner_impression",
      );
      expect(impressionCalls).toHaveLength(1);
    });

    it("should track button_clicked when onClickUpdate is called", () => {
      mockUseWalletFeaturesConfig.mockReturnValue({ shouldDisplayWallet40MainNav: true });
      hasConnectedDeviceSelector.mockReturnValue(true);
      hasCompletedOnboardingSelector.mockReturnValue(true);
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
      isNewFirmwareUpdateUxSupported.mockReturnValue(false);

      const { result } = renderHook(() =>
        useUpdateBannerViewModel({
          onBackFromUpdate: jest.fn(),
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
      mockUseWalletFeaturesConfig.mockReturnValue({ shouldDisplayWallet40MainNav: true });
      mockUseRoute.mockReturnValue({ name: "MyLedgerDevice" });
      hasConnectedDeviceSelector.mockReturnValue(true);
      hasCompletedOnboardingSelector.mockReturnValue(true);
      useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });
      isNewFirmwareUpdateUxSupported.mockReturnValue(false);

      const { result } = renderHook(() =>
        useUpdateBannerViewModel({
          onBackFromUpdate: jest.fn(),
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
