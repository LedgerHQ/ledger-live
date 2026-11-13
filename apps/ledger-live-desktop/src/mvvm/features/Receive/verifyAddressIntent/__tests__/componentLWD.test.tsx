import React from "react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { DeviceAppVerifyNotSupported } from "@ledgerhq/live-common/errors";
import { VerifyAddressIntentComponentLWD } from "../componentLWD";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

function renderComponent(jobState: VerifyAddressIntentJobState | undefined) {
  const onClose = jest.fn();
  const { user, container } = render(
    <VerifyAddressIntentComponentLWD
      jobState={jobState}
      extraProps={undefined}
      onClose={onClose}
    />,
  );
  return { user, onClose, container };
}

describe("VerifyAddressIntentComponentLWD", () => {
  it("should render nothing before the job emits a state", () => {
    const { container } = renderComponent(undefined);

    expect(container).toBeEmptyDOMElement();
  });

  it("should ask the user to continue on the device until the address is displayed", () => {
    renderComponent({ type: "verifying", deviceModelId: DeviceModelId.STAX, deviceName: "Stax" });

    expect(screen.getByTestId("receive-verify-address-continue-on-device")).toBeVisible();
  });

  it.each<VerifyAddressIntentJobState>([
    { type: "addressDisplayed" },
    { type: "verified", address: ADDRESS },
  ])("should show the address securely displayed when the job is $type", async jobState => {
    const { user, onClose } = renderComponent(jobState);

    expect(screen.getByText("Address securely displayed")).toBeVisible();
    await user.click(screen.getByTestId("receive-address-displayed-got-it"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should offer to retry when the user rejects on the device", async () => {
    const retry = jest.fn();
    const { user, onClose } = renderComponent({ type: "cancelled", retry });

    expect(screen.getByText("Operation rejected on Ledger device")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show the device app error when it cannot display the address", async () => {
    const { user, onClose } = renderComponent({
      type: "unsupported",
      error: new DeviceAppVerifyNotSupported(),
    });

    expect(screen.getByText("App update required")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show the wrong device error when the device shows another address", async () => {
    const { user, onClose } = renderComponent({
      type: "mismatch",
      expectedAddress: ADDRESS,
      reportedAddress: "0xDEAD",
    });

    expect(screen.getByTestId("receive-verify-address-error")).toBeVisible();
    expect(screen.getByText(/recovery phrase or passphrase associated/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
