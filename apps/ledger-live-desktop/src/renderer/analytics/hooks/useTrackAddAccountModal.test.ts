import { renderHook } from "@testing-library/react";
import { UseTrackAddAccountModal, useTrackAddAccountModal } from "./useTrackAddAccountModal";
import { track } from "../segment";
import { CantOpenDevice, UserRefusedOnDevice, LockedDeviceError } from "@ledgerhq/errors";
import type { Device } from "@ledgerhq/types-devices";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
}));

describe("useTrackAddAccountModal", () => {
  const deviceMock: Device = {
    modelId: "europa",
    wired: false,
  };

  const defaultArgs: UseTrackAddAccountModal = {
    location: HOOKS_TRACKING_LOCATIONS.addAccountModal,
    requestOpenApp: "Bitcoin",
    device: deviceMock,
    error: null,
    isTrackingEnabled: true,
    userMustConnectDevice: null,
    isLocked: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should track "Connection failed" if error is CantOpenDevice', () => {
    renderHook(() =>
      useTrackAddAccountModal({
        ...defaultArgs,
        error: new CantOpenDevice(),
      }),
    );

    expect(track).toHaveBeenCalledWith(
      "Connection failed",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.addAccountModal,
      }),
      true,
    );
  });

  it('should track "Open app denied" if there was a previous "requestOpenApp" and now the error is UserRefusedOnDevice', () => {
    const { rerender } = renderHook(props => useTrackAddAccountModal(props), {
      initialProps: {
        ...defaultArgs,
        requestOpenApp: "Bitcoin",
      },
    });

    rerender({
      ...defaultArgs,
      //@ts-expect-error requestOpenApp should be a string
      requestOpenApp: null,
      error: new UserRefusedOnDevice(),
    });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.addAccountModal,
      }),
      true,
    );
  });

  it('should track "Device connection lost" if userMustConnectDevice is true', () => {
    renderHook(() =>
      useTrackAddAccountModal({
        ...defaultArgs,
        userMustConnectDevice: true,
      }),
    );

    expect(track).toHaveBeenCalledWith(
      "Device connection lost",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.addAccountModal,
      }),
      true,
    );
  });

  it('should track "Device locked" if isLocked is true', () => {
    renderHook(() =>
      useTrackAddAccountModal({
        ...defaultArgs,
        isLocked: true,
      }),
    );

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.addAccountModal,
      }),
      true,
    );
  });

  it('should track "Device locked" if error is LockedDeviceError', () => {
    renderHook(() =>
      useTrackAddAccountModal({
        ...defaultArgs,
        error: new LockedDeviceError(),
      }),
    );

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.addAccountModal,
      }),
      true,
    );
  });

  it("should use the previous device if the current device is undefined on subsequent renders", () => {
    const { rerender } = renderHook(props => useTrackAddAccountModal(props), {
      initialProps: {
        ...defaultArgs,
        device: { modelId: "europa", wired: true },
      },
    });

    rerender({
      ...defaultArgs,
      // @ts-expect-error device should be a Device
      device: undefined,
      error: new CantOpenDevice(),
    });

    expect(track).toHaveBeenCalledWith(
      "Connection failed",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.addAccountModal,
      }),
      true,
    );
  });

  it("should not track if location is not HOOKS_TRACKING_LOCATIONS.addAccountModal", () => {
    renderHook(() =>
      useTrackAddAccountModal({
        ...defaultArgs,
        //@ts-expect-error location should be HOOKS_TRACKING_LOCATIONS enum
        location: "NOT Add account",
      }),
    );

    expect(track).not.toHaveBeenCalled();
  });

  it("should include correct connection type based on device.wired", () => {
    const wiredDeviceMock = { ...deviceMock, wired: true };

    renderHook((props: UseTrackAddAccountModal) => useTrackAddAccountModal(props), {
      initialProps: {
        ...defaultArgs,
        device: wiredDeviceMock,
        error: new LockedDeviceError(),
      },
    });

    expect(track).toHaveBeenCalledWith(
      "Device locked",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.addAccountModal,
      }),
      true,
    );
  });
});
