import React from "react";
import { render, screen, fireEvent, act } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/devices";
import type { DeviceInfo } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { track } from "@shared/analytics";
import { setDrawer } from "~/renderer/drawers/Provider";
import DeviceName from "../DeviceName";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

const device: Device = { deviceId: "", modelId: DeviceModelId.stax, wired: true };
// oxlint-disable-next-line typescript/consistent-type-assertions
const deviceInfo = { version: "1.0.0" } as DeviceInfo;

describe("DeviceName", () => {
  it("tracks a rename with the device model, not the chosen name", () => {
    render(
      <DeviceName
        deviceName="My Stax"
        deviceInfo={deviceInfo}
        device={device}
        onRefreshDeviceInfo={jest.fn()}
        setPreventResetOnDeviceChange={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("manager-device-rename-button"));
    const { onSetName } = jest.mocked(setDrawer).mock.calls[0][1] as {
      onSetName: (name: string) => void;
    };
    act(() => onSetName("Alice's Stax"));

    expect(track).toHaveBeenCalledWith("Page Manager RenamedDevice", {
      modelId: DeviceModelId.stax,
    });
    expect(track).not.toHaveBeenCalledWith(
      "Page Manager RenamedDevice",
      expect.objectContaining({ deviceName: expect.anything() }),
    );
    expect(screen.getByText("Alice's Stax")).toBeVisible();
  });
});
