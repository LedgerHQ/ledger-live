import { act, renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { State } from "~/reducers/types";
import { useRequiredFirmwareUpdateViewModel } from "./useRequiredFirmwareUpdateViewModel";

jest.mock("~/analytics", () => ({
  TrackScreen: () => null,
  useTrack: () => jest.fn(),
  track: jest.fn(),
}));

const nanoX = {
  modelId: DeviceModelId.nanoX,
  deviceId: "nanoX",
  wired: true,
};

const fakeDeviceInfo = { version: "2.0.0", seVersion: "2.0.0" };
const otherDeviceInfo = { version: "1.4.0", seVersion: "1.4.0" };

const stateWithDeviceInfo = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    seenDevices: [{ modelId: DeviceModelId.nanoX, deviceInfo: fakeDeviceInfo } as never],
  },
});

const stateWithoutDeviceInfo = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    seenDevices: [{ modelId: DeviceModelId.nanoX } as never],
  },
});

/** A different model is last-seen, but the current flow's device (Nano X) also
 * has an entry earlier in seenDevices. We expect the VM to pick the Nano X
 * entry by modelId rather than the most recent (different-model) entry. */
const stateWithDifferentLastSeenDevice = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    seenDevices: [
      { modelId: DeviceModelId.nanoX, deviceInfo: fakeDeviceInfo } as never,
      { modelId: DeviceModelId.stax, deviceInfo: otherDeviceInfo } as never,
    ],
  },
});

type MockNav = {
  navigate: jest.Mock;
  goBack: jest.Mock;
  getState: jest.Mock;
  getParent: jest.Mock;
};

const makeNavigation = (routeNames: string[], parent?: MockNav): MockNav => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  getState: jest.fn(() => ({ routeNames })),
  getParent: jest.fn(() => parent),
});

const renderVM = (
  navigation: MockNav,
  overrideInitialState: (state: State) => State,
  onClose?: () => void,
) =>
  renderHook(
    () =>
      useRequiredFirmwareUpdateViewModel({
        device: nanoX as never,
        navigation: navigation as never,
        onClose,
      }),
    { overrideInitialState },
  );

describe("useRequiredFirmwareUpdateViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("derived view state", () => {
    it("exposes the 'update from LLM' copy and isUsbCapable=true when deviceInfo is known", () => {
      const nav = makeNavigation([ScreenName.FirmwareUpdate]);
      const { result } = renderVM(nav, stateWithDeviceInfo);

      expect(result.current.isUsbCapable).toBe(true);
      expect(result.current.title).toMatch(/Firmware update required/);
      expect(result.current.ctaLabel).toBe("Go to OS Update");
    });

    it("exposes the 'update on computer' copy and isUsbCapable=false when deviceInfo is missing", () => {
      const nav = makeNavigation([ScreenName.FirmwareUpdate]);
      const { result } = renderVM(nav, stateWithoutDeviceInfo);

      expect(result.current.isUsbCapable).toBe(false);
      expect(result.current.title).toMatch(/Firmware update required on computer/);
    });

    it("matches deviceInfo by device.modelId rather than picking the most recent entry", () => {
      const nav = makeNavigation([ScreenName.FirmwareUpdate]);
      const { result } = renderVM(nav, stateWithDifferentLastSeenDevice);

      // Last-seen entry is a Stax, but the device passed to the VM is a Nano X.
      // The VM should find the Nano X entry and expose isUsbCapable=true.
      expect(result.current.isUsbCapable).toBe(true);
    });
  });

  describe("onPressCta", () => {
    it("navigates to FirmwareUpdate on the same navigator when it registers the screen", () => {
      const nav = makeNavigation([ScreenName.FirmwareUpdate]);
      const { result } = renderVM(nav, stateWithDeviceInfo);

      act(() => result.current.onPressCta());

      expect(nav.navigate).toHaveBeenCalledWith(
        ScreenName.FirmwareUpdate,
        expect.objectContaining({
          device: nanoX,
          deviceInfo: fakeDeviceInfo,
          onBackFromUpdate: expect.any(Function),
        }),
      );
    });

    it("navigates with the deviceInfo matching device.modelId, not the most recent entry", () => {
      const nav = makeNavigation([ScreenName.FirmwareUpdate]);
      const { result } = renderVM(nav, stateWithDifferentLastSeenDevice);

      act(() => result.current.onPressCta());

      expect(nav.navigate).toHaveBeenCalledWith(
        ScreenName.FirmwareUpdate,
        expect.objectContaining({
          device: nanoX,
          // fakeDeviceInfo belongs to the Nano X entry, not the Stax (most recent) entry.
          deviceInfo: fakeDeviceInfo,
        }),
      );
    });

    it("does not pass firmwareUpdateContext (destination screen fetches its own)", () => {
      const nav = makeNavigation([ScreenName.FirmwareUpdate]);
      const { result } = renderVM(nav, stateWithDeviceInfo);

      act(() => result.current.onPressCta());

      const params = nav.navigate.mock.calls[0][1];
      expect(params).not.toHaveProperty("firmwareUpdateContext");
    });

    it("walks up the navigator tree to find the ancestor that registers FirmwareUpdate", () => {
      const root = makeNavigation([ScreenName.FirmwareUpdate, "Portfolio"]);
      const middle = makeNavigation(["SomeOtherScreen"], root);
      const inner = makeNavigation(["ExchangeStart", "ExchangeComplete"], middle);
      const { result } = renderVM(inner, stateWithDeviceInfo);

      act(() => result.current.onPressCta());

      expect(inner.navigate).not.toHaveBeenCalled();
      expect(middle.navigate).not.toHaveBeenCalled();
      expect(root.navigate).toHaveBeenCalledWith(
        ScreenName.FirmwareUpdate,
        expect.objectContaining({ deviceInfo: fakeDeviceInfo }),
      );
    });

    it("does not navigate when no ancestor navigator registers FirmwareUpdate", () => {
      const root = makeNavigation(["Portfolio", "Settings"]);
      const inner = makeNavigation(["ExchangeStart"], root);
      const { result } = renderVM(inner, stateWithDeviceInfo);

      act(() => result.current.onPressCta());

      expect(inner.navigate).not.toHaveBeenCalled();
      expect(root.navigate).not.toHaveBeenCalled();
    });

    it("does not navigate when deviceInfo is missing", () => {
      const nav = makeNavigation([ScreenName.FirmwareUpdate]);
      const { result } = renderVM(nav, stateWithoutDeviceInfo);

      act(() => result.current.onPressCta());

      expect(nav.navigate).not.toHaveBeenCalled();
    });

    it("calls onClose after navigating so the originating drawer dismisses", () => {
      const nav = makeNavigation([ScreenName.FirmwareUpdate]);
      const onClose = jest.fn();
      const { result } = renderVM(nav, stateWithDeviceInfo, onClose);

      act(() => result.current.onPressCta());

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when the navigate is skipped (no deviceInfo)", () => {
      const nav = makeNavigation([ScreenName.FirmwareUpdate]);
      const onClose = jest.fn();
      const { result } = renderVM(nav, stateWithoutDeviceInfo, onClose);

      act(() => result.current.onPressCta());

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
