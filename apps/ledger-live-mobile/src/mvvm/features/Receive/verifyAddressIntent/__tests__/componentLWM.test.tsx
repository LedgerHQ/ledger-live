import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { DeviceAppVerifyNotSupported } from "@ledgerhq/live-common/errors";
import { track, trackPage } from "@shared/analytics";
import { DeviceIntentTrackingProvider } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import { DeviceIntentExecutorHeaderContext } from "@ledgerhq/live-dmk-shared/react";
import { VerifyAddressIntentComponentLWM } from "../componentLWM";

const mockTrack = jest.mocked(track);
const mockTrackPage = jest.mocked(trackPage);

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

  it("should keep the drawer locked with no action while the address is shown on the device", () => {
    const { onClose, rerender, store } = renderComponent(VERIFYING);

    rerender(<VerifyAddressScreen jobState={{ type: "addressDisplayed" }} onClose={onClose} />);

    expect(screen.getByText("Address securely displayed")).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(true);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should hide the drawer header, and its close button, only while the address is shown on the device", () => {
    const releaseHeader = jest.fn();
    const requestHeaderOverride = jest.fn(() => releaseHeader);
    const renderWithHeader = (jobState: VerifyAddressIntentJobState) => (
      <DeviceIntentExecutorHeaderContext.Provider value={{ requestHeaderOverride }}>
        <VerifyAddressScreen jobState={jobState} onClose={jest.fn()} />
      </DeviceIntentExecutorHeaderContext.Provider>
    );
    const { rerender } = render(renderWithHeader({ type: "addressDisplayed" }));

    expect(requestHeaderOverride).toHaveBeenCalledTimes(1);

    rerender(renderWithHeader({ type: "verified", address: ADDRESS }));

    expect(releaseHeader).toHaveBeenCalledTimes(1);
  });

  it("should release the drawer and confirm the match once the user confirms on the device", async () => {
    const { user, onClose, rerender, store } = renderComponent(VERIFYING);
    rerender(<VerifyAddressScreen jobState={{ type: "addressDisplayed" }} onClose={onClose} />);

    rerender(
      <VerifyAddressScreen jobState={{ type: "verified", address: ADDRESS }} onClose={onClose} />,
    );

    expect(screen.getByText("Address verified")).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(false);
    await user.press(screen.getByText("Done"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should offer the device refusal screen with Retry and Close, without the Connect App tracking, when the user rejects on the device", async () => {
    const retry = jest.fn();
    const { user, onClose, store } = renderComponent({ type: "cancelled", retry });

    expect(screen.getByText("Operation rejected on Ledger device")).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(false);
    await user.press(screen.getByText("Retry"));
    await user.press(screen.getByText("Close"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockTrackPage).not.toHaveBeenCalled();
    expect(mockTrack).not.toHaveBeenCalled();
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
