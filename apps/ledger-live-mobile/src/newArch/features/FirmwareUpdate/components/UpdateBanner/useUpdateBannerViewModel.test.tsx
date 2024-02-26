import { act, renderHook } from "@testing-library/react-native";
import { useUpdateBannerViewModel } from "./useUpdateBannerViewModel";

/** Brace yourselves for the mocks ... */

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn().mockImplementation((selector: () => unknown) => selector()),
}));

jest.mock("~/reducers/settings", () => ({
  ...jest.requireActual("~/reducers/settings"),
  lastSeenDeviceSelector: jest.fn(),
  lastConnectedDeviceSelector: jest.fn(),
  hasCompletedOnboardingSelector: jest.fn(),
}));
const { lastConnectedDeviceSelector, hasCompletedOnboardingSelector } =
  jest.requireMock("~/reducers/settings");

jest.mock("~/reducers/appstate", () => ({
  ...jest.requireActual("~/reducers/appstate"),
  hasConnectedDeviceSelector: jest.fn(),
}));
const { hasConnectedDeviceSelector } = jest.requireMock("~/reducers/appstate");

jest.mock("@ledgerhq/live-common/device/hooks/useLatestFirmware", () => ({
  ...jest.requireActual("@ledgerhq/live-common/device/hooks/useLatestFirmware"),
  useLatestFirmware: jest.fn(),
}));
const { useLatestFirmware } = jest.requireMock(
  "@ledgerhq/live-common/device/hooks/useLatestFirmware",
);

jest.mock("../../utils/isFirmwareUpdateSupported", () => ({
  ...jest.requireActual("../../utils/isFirmwareUpdateSupported"),
  isOldFirmwareUpdateUxSupported: jest.fn().mockImplementation(() => ({
    updateSupported: true,
    updateSupportedButDeviceNotWired: false,
  })),
  isNewFirmwareUpdateUxSupported: jest.fn().mockImplementation(() => ({ updateSupported: true })),
}));
const { isOldFirmwareUpdateUxSupported, isNewFirmwareUpdateUxSupported } = jest.requireMock(
  "../../utils/isFirmwareUpdateSupported",
);

jest.mock("../../utils/navigateToFirmwareUpdateFlow", () => ({
  ...jest.requireActual("../../utils/navigateToFirmwareUpdateFlow"),
  navigateToFirmwareUpdateFlow: jest.fn(),
}));

jest.requireMock("../../utils/navigateToFirmwareUpdateFlow");
const navigateToFwUpdateFlowSpy = jest.spyOn(
  jest.requireMock("../../utils/navigateToFirmwareUpdateFlow"),
  "navigateToFirmwareUpdateFlow",
);

/** TESTS */

describe("useUpdateBannerViewModel", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should return bannerVisible: true if conditions are fulfilled", () => {
    const lastConnectedDevice = { modelId: "mockModelId" };
    lastConnectedDeviceSelector.mockReturnValue(lastConnectedDevice);
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

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

  it("should return the correct values of isUpdateSupportedButDeviceNotWired", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

    // true
    isOldFirmwareUpdateUxSupported.mockReturnValue({
      updateSupported: false,
      updateSupportedButDeviceNotWired: true,
    });

    const { result: res1 } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );
    expect(res1.current.isUpdateSupportedButDeviceNotWired).toBe(true);

    // false
    isOldFirmwareUpdateUxSupported.mockReturnValue({
      updateSupported: false,
      updateSupportedButDeviceNotWired: false,
    });

    const { result: res2 } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );
    expect(res2.current.isUpdateSupportedButDeviceNotWired).toBe(false);
  });

  it("should not call startFirmwareUpdateFlow when onClickUpdate is called if update flow is not supported", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

    isOldFirmwareUpdateUxSupported.mockReturnValue({
      updateSupported: false,
      updateSupportedButDeviceNotWired: false,
    });
    isNewFirmwareUpdateUxSupported.mockReturnValue(false);

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(true);
    expect(navigateToFwUpdateFlowSpy).not.toHaveBeenCalled();

    act(() => result.current.closeUnsupportedUpdateDrawer());
    expect(result.current.unsupportedUpdateDrawerOpened).toBe(false);
  });

  it("should not call startFirmwareUpdateFlow when onClickUpdate is called if old update flow is supported", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

    isOldFirmwareUpdateUxSupported.mockReturnValue({
      updateSupported: true,
      updateSupportedButDeviceNotWired: false,
    });
    isNewFirmwareUpdateUxSupported.mockReturnValue(false);

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(false);
    expect(navigateToFwUpdateFlowSpy).toHaveBeenCalled();
  });

  it("should call startFirmwareUpdateFlow when onClickUpdate is called if new update flow is supported", () => {
    hasConnectedDeviceSelector.mockReturnValue(true);
    hasCompletedOnboardingSelector.mockReturnValue(true);
    useLatestFirmware.mockReturnValue({ final: { name: "mockVersion" } });

    isOldFirmwareUpdateUxSupported.mockReturnValue({
      updateSupported: false,
      updateSupportedButDeviceNotWired: false,
    });
    isNewFirmwareUpdateUxSupported.mockReturnValue(true);

    const { result } = renderHook(() =>
      useUpdateBannerViewModel({
        onBackFromUpdate: jest.fn(),
      }),
    );

    act(() => result.current.onClickUpdate());

    expect(result.current.unsupportedUpdateDrawerOpened).toBe(false);
    expect(navigateToFwUpdateFlowSpy).toHaveBeenCalled();
  });
});
