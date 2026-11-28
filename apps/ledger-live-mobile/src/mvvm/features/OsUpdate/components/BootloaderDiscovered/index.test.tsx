import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { OsUpdateFlowMode } from "@features/flow-device-os-update";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { BootloaderDiscovered } from "./index";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const device = { deviceId: "usb|1", modelId: DeviceModelId.stax, wired: true } as Device;

describe("BootloaderDiscovered", () => {
  it("opens the OS update flow in bootloader repair mode for the device", async () => {
    const { user } = render(<BootloaderDiscovered device={device} />);

    await user.press(screen.getByText("Continue"));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OsUpdate, {
      device: expect.objectContaining({ id: "usb|1", deviceModelId: DeviceModelId.stax }),
      mode: OsUpdateFlowMode.BOOTLOADER_REPAIR,
    });
  });
});
