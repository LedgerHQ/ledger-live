import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { DeviceAppVerifyNotSupported } from "@ledgerhq/live-common/errors";
import { DeviceIntentTrackingProvider } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import { VerifyAddressIntentComponentLWM } from "../VerifyAddressIntentComponentLWM";

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const VERIFYING: VerifyAddressIntentJobState = {
  type: "verifying",
  deviceModelId: DeviceModelId.STAX,
  deviceName: "Stax",
};

function VerifyAddressScreen({
  jobState,
  onClose,
}: Readonly<{ jobState: VerifyAddressIntentJobState | undefined; onClose: () => void }>) {
  return (
    <DeviceIntentTrackingProvider value={{ sourceFlow: "receive" }}>
      <VerifyAddressIntentComponentLWM
        jobState={jobState}
        extraProps={undefined}
        onClose={onClose}
      />
    </DeviceIntentTrackingProvider>
  );
}

function renderComponent(jobState: VerifyAddressIntentJobState | undefined) {
  const onClose = jest.fn();
  const rendered = render(<VerifyAddressScreen jobState={jobState} onClose={onClose} />);
  return { ...rendered, onClose };
}

describe("VerifyAddressIntentComponentLWM", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing before the job emits a state", () => {
    renderComponent(undefined);

    expect(screen.toJSON()).toBeNull();
  });

  it("should ask the user to continue on the device and lock the drawer while the address is requested", () => {
    const { store } = renderComponent(VERIFYING);

    expect(screen.getByTestId("receive-verify-address-continue-on-device")).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(true);
  });

  it("should unlock the drawer once the device shows the address, and go back to it on Got it", async () => {
    const { user, onClose, rerender, store } = renderComponent(VERIFYING);

    rerender(<VerifyAddressScreen jobState={{ type: "addressDisplayed" }} onClose={onClose} />);

    expect(screen.getByText("Address securely displayed")).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(false);
    await user.press(screen.getByText("Got it"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each<VerifyAddressIntentJobState>([
    { type: "verified", address: ADDRESS },
    { type: "cancelled", retry: jest.fn() },
  ])("should keep asking to compare the address when the device answers $type", jobState => {
    renderComponent(jobState);

    expect(screen.getByText("Address securely displayed")).toBeVisible();
    expect(screen.getByText("Got it")).toBeVisible();
  });

  it("should warn the user not to use the address when the device confirms another one", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user, onClose, store } = renderComponent({
      type: "mismatch",
      expectedAddress: ADDRESS,
      reportedAddress: "0xDEAD",
    });

    expect(screen.getByText("This address doesn't match your Ledger")).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(false);
    await user.press(screen.getByText("Contact Ledger Support"));
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("support.ledger.com"));
    expect(onClose).not.toHaveBeenCalled();

    await user.press(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show the device app error when it cannot display the address", async () => {
    const { user, onClose } = renderComponent({
      type: "unsupported",
      error: new DeviceAppVerifyNotSupported(),
    });

    expect(screen.getByText("Open My Ledger to update this app")).toBeVisible();
    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
