import React from "react";
import { render, renderHook, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { DeviceAppVerifyNotSupported } from "@ledgerhq/live-common/errors";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared/react";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { openURL } from "~/renderer/linking";
import { VerifyAddressIntentComponentLWD } from "../VerifyAddressIntentComponentLWD";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));

const mockOpenURL = jest.mocked(openURL);

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
      <VerifyAddressIntentComponentLWD
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

function isDialogBlocked() {
  return renderHook(() => useDeviceBlocked()).result.current;
}

describe("VerifyAddressIntentComponentLWD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing before the job emits a state", () => {
    const { container } = renderComponent(undefined);

    expect(container).toBeEmptyDOMElement();
  });

  it("should ask the user to continue on the device and block closing while the address is requested", () => {
    renderComponent(VERIFYING);

    expect(screen.getByTestId("receive-verify-address-continue-on-device")).toBeVisible();
    expect(isDialogBlocked()).toBe(true);
  });

  it("should release the dialog once the device shows the address, and go back to it on Got it", async () => {
    const { user, onClose, rerender } = renderComponent(VERIFYING);

    rerender(<VerifyAddressScreen jobState={{ type: "addressDisplayed" }} onClose={onClose} />);

    expect(screen.getByText("Address securely displayed")).toBeVisible();
    expect(isDialogBlocked()).toBe(false);
    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each<VerifyAddressIntentJobState>([
    { type: "verified", address: ADDRESS },
    { type: "cancelled", retry: jest.fn() },
  ])("should keep asking to compare the address when the device answers $type", jobState => {
    renderComponent(jobState);

    expect(screen.getByText("Address securely displayed")).toBeVisible();
    expect(screen.getByRole("button", { name: "Got it" })).toBeVisible();
  });

  it("should warn the user not to use the address when the device confirms another one", async () => {
    const { user, onClose } = renderComponent({
      type: "mismatch",
      expectedAddress: ADDRESS,
      reportedAddress: "0xDEAD",
    });

    expect(screen.getByText("This address doesn't match your Ledger")).toBeVisible();
    expect(isDialogBlocked()).toBe(false);
    await user.click(screen.getByRole("button", { name: "Contact Ledger Support" }));
    expect(mockOpenURL).toHaveBeenCalledWith(expect.stringContaining("support.ledger.com"));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Close" }));
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
});
