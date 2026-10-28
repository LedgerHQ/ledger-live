import React from "react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { State } from "~/renderer/reducers";
import Disclaimer from "./Disclaimer";

jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  TrackScreen: () => null,
}));

const firmware = { osu: null, final: { name: "2.0.0" } } as unknown as FirmwareUpdateContext;

function renderDisclaimer(currentDevice: Device) {
  const onContinue = jest.fn();
  const rendered = render(<Disclaimer firmware={firmware} onContinue={onContinue} />, {
    initialState: { devices: { currentDevice, devices: [currentDevice] } } as Partial<State>,
  });
  return { ...rendered, onContinue };
}

const flex = { deviceId: "flex", modelId: DeviceModelId.europa };

describe("UpdateFirmwareModal Disclaimer", () => {
  it("GIVEN the device is connected over Bluetooth WHEN rendering THEN it asks for USB and blocks the update", async () => {
    const { user, onContinue } = renderDisclaimer({ ...flex, wired: false });

    expect(screen.getByText("Connect with USB")).toBeVisible();
    const installButton = screen.getByTestId("modal-continue-button");
    expect(installButton).toBeDisabled();
    await user.click(installButton);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("GIVEN the device is connected over USB WHEN rendering THEN the update can start", async () => {
    const { user, onContinue } = renderDisclaimer({ ...flex, wired: true });

    expect(screen.queryByText("Connect with USB")).toBeNull();
    await user.click(screen.getByTestId("modal-continue-button"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
