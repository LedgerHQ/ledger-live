import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { VerifyAddressIntentComponentLWM } from "../componentLWM";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const ADDRESS = "0xAbC0000000000000000000000000000000000001";

function renderComponent(jobState: VerifyAddressIntentJobState | undefined) {
  const onClose = jest.fn();
  const { user, toJSON } = render(
    <VerifyAddressIntentComponentLWM
      jobState={jobState}
      extraProps={undefined}
      onClose={onClose}
    />,
  );
  return { user, onClose, toJSON };
}

describe("VerifyAddressIntentComponentLWM", () => {
  it("should render nothing before the job emits a state", () => {
    const { toJSON } = renderComponent(undefined);

    expect(toJSON()).toBeNull();
  });

  it("should ask the user to continue on the device until the address is displayed", () => {
    renderComponent({ type: "verifying", deviceModelId: DeviceModelId.STAX, deviceName: "Stax" });

    expect(screen.getByTestId("receive-verify-continue-on-device")).toBeOnTheScreen();
  });

  it("should show the address displayed screen as soon as the address is on the device", () => {
    renderComponent({ type: "addressDisplayed" });

    expect(screen.getByTestId("receive-address-displayed")).toBeOnTheScreen();
  });

  it("should keep the address displayed screen once confirmed and leave on Got it", async () => {
    const { user, onClose } = renderComponent({ type: "verified", address: ADDRESS });

    expect(screen.getByText("Address securely displayed")).toBeOnTheScreen();
    await user.press(screen.getByTestId("receive-address-displayed-got-it"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should offer to retry when the user rejects on the device", async () => {
    const retry = jest.fn();
    const { user } = renderComponent({ type: "cancelled", retry });

    expect(screen.getByTestId("receive-verify-rejected")).toBeOnTheScreen();
    await user.press(screen.getByTestId("receive-verify-retry"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it.each<VerifyAddressIntentJobState>([
    { type: "mismatch", expectedAddress: ADDRESS, reportedAddress: "0xDEAD" },
    { type: "unsupported", error: new Error("cannot display") },
  ])("should show the device error screen when the job state is $type", async jobState => {
    const { user, onClose } = renderComponent(jobState);

    expect(screen.getByTestId("receive-verify-error")).toBeOnTheScreen();
    await user.press(screen.getByTestId("receive-verify-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
