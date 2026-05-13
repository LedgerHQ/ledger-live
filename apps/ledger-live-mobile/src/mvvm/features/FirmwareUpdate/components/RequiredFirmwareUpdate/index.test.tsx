import React from "react";
import { render, screen } from "@tests/test-renderer";
import { RequiredFirmwareUpdateView } from "./index";

jest.mock("~/analytics", () => ({
  TrackScreen: () => null,
  useTrack: () => jest.fn(),
  track: jest.fn(),
}));

const baseProps = {
  isUsbCapable: true,
  title: "Firmware update required",
  description: "Update your device to continue",
  ctaLabel: "Go to OS Update",
  onPressCta: jest.fn(),
};

describe("RequiredFirmwareUpdateView", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the title and description", () => {
    render(<RequiredFirmwareUpdateView {...baseProps} />);

    expect(screen.getByText("Firmware update required")).toBeVisible();
    expect(screen.getByText("Update your device to continue")).toBeVisible();
  });

  it("renders the CTA and calls onPressCta when it is pressed (USB-capable)", async () => {
    const onPressCta = jest.fn();
    const { user } = render(<RequiredFirmwareUpdateView {...baseProps} onPressCta={onPressCta} />);

    const cta = screen.getByText("Go to OS Update");
    expect(cta).toBeVisible();

    await user.press(cta);
    expect(onPressCta).toHaveBeenCalledTimes(1);
  });

  it("hides the CTA when the device is not USB-capable", () => {
    render(<RequiredFirmwareUpdateView {...baseProps} isUsbCapable={false} />);

    expect(screen.queryByText("Go to OS Update")).toBeNull();
  });
});
