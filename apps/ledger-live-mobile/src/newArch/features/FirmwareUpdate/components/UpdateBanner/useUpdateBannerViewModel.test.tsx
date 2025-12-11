import ReactNative from "react-native";
import { act, renderHook } from "@testing-library/react-native";
import { useUpdateBannerViewModel } from "./useUpdateBannerViewModel";

/** Brace yourselves for the mocks ... */

// Mock react-navigation
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

// Mock react redux's useSelector
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn().mockImplementation((selector: () => unknown) => selector()),
}));

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

// Mock navigation to new and old update flows
jest.mock("../../utils/navigateToNewUpdateFlow", () => ({
  navigateToNewUpdateFlow: jest.fn(),
}));
const { navigateToNewUpdateFlow } = jest.requireMock("../../utils/navigateToNewUpdateFlow");

/** TESTS */

describe("useUpdateBannerViewModel", () => {
  let PlatformSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
    PlatformSpy = jest.spyOn(ReactNative, "Platform", "get");
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
});
