import React from "react";
import { act, render, screen } from "@tests/test-renderer";
import { RequiredFirmwareUpdate } from "./rendering";
import { ScreenName } from "~/const";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { State } from "~/reducers/types";

jest.mock("~/analytics", () => ({
  TrackScreen: () => null,
  useTrack: () => jest.fn(),
  track: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase", () => ({
  getLatestFirmwareForDeviceUseCase: jest.fn(),
}));

const { getLatestFirmwareForDeviceUseCase } = jest.requireMock(
  "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase",
);

const nanoX = {
  modelId: DeviceModelId.nanoX,
  deviceId: "nanoX",
  wired: true,
};

const fakeFirmwareContext = { final: { name: "2.4.0" } };
const fakeDeviceInfo = { version: "2.0.0", seVersion: "2.0.0" };

const stateWithLastSeenDevice = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    seenDevices: [{ modelId: DeviceModelId.nanoX, deviceInfo: fakeDeviceInfo } as never],
  },
});

type MockNav = {
  navigate: jest.Mock;
  goBack: jest.Mock;
  reset: jest.Mock;
  getState: jest.Mock;
  getParent: jest.Mock;
};

const makeNavigation = (routeNames: string[], parent?: MockNav): MockNav => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(() => ({ routeNames })),
  getParent: jest.fn(() => parent),
});

describe("RequiredFirmwareUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getLatestFirmwareForDeviceUseCase.mockResolvedValue(fakeFirmwareContext);
  });

  it("renames the CTA to 'Go to OS Update'", async () => {
    const nav = makeNavigation([ScreenName.FirmwareUpdate]);
    render(<RequiredFirmwareUpdate navigation={nav as never} device={nanoX} />, {
      overrideInitialState: stateWithLastSeenDevice,
    });

    expect(screen.getByText("Go to OS Update")).toBeOnTheScreen();
  });

  it("navigates to FirmwareUpdate on the same navigator when it registers the screen", async () => {
    const nav = makeNavigation([ScreenName.FirmwareUpdate]);
    const { user } = render(<RequiredFirmwareUpdate navigation={nav as never} device={nanoX} />, {
      overrideInitialState: stateWithLastSeenDevice,
    });

    await act(async () => {
      await user.press(screen.getByText("Go to OS Update"));
    });

    expect(nav.navigate).toHaveBeenCalledWith(
      ScreenName.FirmwareUpdate,
      expect.objectContaining({
        device: nanoX,
        deviceInfo: fakeDeviceInfo,
        firmwareUpdateContext: fakeFirmwareContext,
        onBackFromUpdate: expect.any(Function),
      }),
    );
  });

  it("walks up to the ancestor navigator that registers FirmwareUpdate", async () => {
    const root = makeNavigation([ScreenName.FirmwareUpdate, "Portfolio"]);
    const middle = makeNavigation(["SomeOtherScreen"], root);
    const inner = makeNavigation(["ExchangeStart", "ExchangeComplete"], middle);

    const { user } = render(<RequiredFirmwareUpdate navigation={inner as never} device={nanoX} />, {
      overrideInitialState: stateWithLastSeenDevice,
    });

    await act(async () => {
      await user.press(screen.getByText("Go to OS Update"));
    });

    expect(inner.navigate).not.toHaveBeenCalled();
    expect(middle.navigate).not.toHaveBeenCalled();
    expect(root.navigate).toHaveBeenCalledWith(
      ScreenName.FirmwareUpdate,
      expect.objectContaining({ firmwareUpdateContext: fakeFirmwareContext }),
    );
  });

  it("calls onClose after navigating so the drawer dismisses cleanly", async () => {
    const nav = makeNavigation([ScreenName.FirmwareUpdate]);
    const onClose = jest.fn();
    const { user } = render(
      <RequiredFirmwareUpdate navigation={nav as never} device={nanoX} onClose={onClose} />,
      { overrideInitialState: stateWithLastSeenDevice },
    );

    await act(async () => {
      await user.press(screen.getByText("Go to OS Update"));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("prefetches the firmware context on mount so the first tap has data", async () => {
    const nav = makeNavigation([ScreenName.FirmwareUpdate]);
    render(<RequiredFirmwareUpdate navigation={nav as never} device={nanoX} />, {
      overrideInitialState: stateWithLastSeenDevice,
    });

    expect(getLatestFirmwareForDeviceUseCase).toHaveBeenCalledWith(fakeDeviceInfo);
  });

  it("does not navigate when every fetch attempt fails (would otherwise show a blank screen)", async () => {
    getLatestFirmwareForDeviceUseCase.mockReset().mockRejectedValue(new Error("network"));
    const nav = makeNavigation([ScreenName.FirmwareUpdate]);
    const { user } = render(<RequiredFirmwareUpdate navigation={nav as never} device={nanoX} />, {
      overrideInitialState: stateWithLastSeenDevice,
    });

    await act(async () => {
      await user.press(screen.getByText("Go to OS Update"));
    });

    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it("recovers on tap when only the mount-time prefetch fails", async () => {
    getLatestFirmwareForDeviceUseCase
      .mockReset()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(fakeFirmwareContext);
    const nav = makeNavigation([ScreenName.FirmwareUpdate]);
    const { user } = render(<RequiredFirmwareUpdate navigation={nav as never} device={nanoX} />, {
      overrideInitialState: stateWithLastSeenDevice,
    });

    await act(async () => {
      await user.press(screen.getByText("Go to OS Update"));
    });

    expect(getLatestFirmwareForDeviceUseCase.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(nav.navigate).toHaveBeenCalledWith(
      ScreenName.FirmwareUpdate,
      expect.objectContaining({ firmwareUpdateContext: fakeFirmwareContext }),
    );
  });

  it("hides the CTA when lastSeenDevice has no deviceInfo", () => {
    const nav = makeNavigation([ScreenName.FirmwareUpdate]);
    const stateNoDeviceInfo = (state: State): State => ({
      ...state,
      settings: {
        ...state.settings,
        seenDevices: [{ modelId: DeviceModelId.nanoX } as never],
      },
    });

    render(<RequiredFirmwareUpdate navigation={nav as never} device={nanoX} />, {
      overrideInitialState: stateNoDeviceInfo,
    });

    expect(screen.queryByText("Go to OS Update")).not.toBeOnTheScreen();
  });
});
