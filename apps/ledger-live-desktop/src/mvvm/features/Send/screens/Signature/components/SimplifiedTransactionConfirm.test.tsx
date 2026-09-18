import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/types-devices";
import { render, screen } from "tests/testSetup";
import { SimplifiedTransactionConfirm } from "./SimplifiedTransactionConfirm";

jest.mock("~/renderer/animations", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/hooks/useTheme", () => ({
  __esModule: true,
  default: () => ({ theme: "dark" }),
}));
jest.mock("~/renderer/components/DeviceAction/animations", () => ({
  getDeviceAnimation: () => null,
}));
jest.mock("~/renderer/components/DeviceAction/DeviceBlocker", () => ({
  DeviceBlocker: () => null,
}));

const mockDevice: Device = {
  deviceId: "mock-device-id",
  modelId: DeviceModelId.nanoS,
  wired: true,
};

describe("SimplifiedTransactionConfirm", () => {
  it("renders nothing when device is null", () => {
    const { container } = render(<SimplifiedTransactionConfirm device={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onShown exactly once when a device is provided", () => {
    const onShown = jest.fn();
    render(<SimplifiedTransactionConfirm device={mockDevice} onShown={onShown} />);
    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it("renders the title and the instruction", () => {
    render(<SimplifiedTransactionConfirm device={mockDevice} />);
    expect(screen.getByTestId("send-signature-prompt")).toBeVisible();
    expect(screen.getByTestId("send-signature-title")).toBeVisible();
  });

  it("shows no transaction detail — recipient and amount are verified on device", () => {
    const { container } = render(<SimplifiedTransactionConfirm device={mockDevice} />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });
});
