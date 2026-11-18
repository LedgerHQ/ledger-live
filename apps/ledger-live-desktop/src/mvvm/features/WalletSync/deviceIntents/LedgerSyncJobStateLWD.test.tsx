import React from "react";
import { renderHook } from "@testing-library/react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { LedgerSyncJobState } from "@features/platform-intent-wallet-sync";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { LedgerSyncJobStateLWD } from "./LedgerSyncJobStateLWD";

const TEST_ID = "wallet-sync-intent";

const AWAITING_CONFIRMATION: LedgerSyncJobState = {
  type: "awaiting-device-confirmation",
  deviceModelId: DeviceModelId.STAX,
  deviceName: "Lily's Ledger",
};

function renderJobState(jobState: LedgerSyncJobState | undefined) {
  const onClose = jest.fn();
  const rendered = render(
    <LedgerSyncJobStateLWD jobState={jobState} onClose={onClose} testID={TEST_ID} />,
  );
  return { ...rendered, onClose };
}

function isDialogBlocked() {
  return renderHook(() => useDeviceBlocked()).result.current;
}

describe("LedgerSyncJobStateLWD", () => {
  it.each([
    ["undefined", undefined],
    ["pending", { type: "pending" } as const],
  ])("should show the loading screen, unblocked, when the job state is %s", (_, jobState) => {
    renderJobState(jobState);

    expect(screen.getByTestId(`${TEST_ID}-pending`)).toBeVisible();
    expect(isDialogBlocked()).toBe(false);
  });

  it("should ask to continue on the device and block the dialog while it waits", () => {
    renderJobState(AWAITING_CONFIRMATION);

    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
    expect(screen.getByText("Lily's Ledger")).toBeVisible();
    expect(isDialogBlocked()).toBe(true);
  });

  it("should show the loading screen and keep the dialog blocked while the SDK finishes", () => {
    const { rerender, onClose } = renderJobState(AWAITING_CONFIRMATION);

    rerender(
      <LedgerSyncJobStateLWD
        jobState={{ type: "processing" }}
        onClose={onClose}
        testID={TEST_ID}
      />,
    );

    expect(screen.getByTestId(`${TEST_ID}-processing`)).toBeVisible();
    expect(isDialogBlocked()).toBe(true);
  });

  it("should offer Retry and Close, unblocked, when the user refused on the device", async () => {
    const retry = jest.fn();
    const { user, onClose } = renderJobState({
      type: "device-rejected",
      error: new Error("UserRefusedOnDevice"),
      retry,
    });

    expect(screen.getByText("Operation rejected on Ledger device")).toBeVisible();
    expect(isDialogBlocked()).toBe(false);
    await user.click(screen.getByTestId(`${TEST_ID}-retry`));
    await user.click(screen.getByTestId(`${TEST_ID}-close`));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["failed", { type: "failed", reason: "not-allowed", error: new Error("x") } as const],
    ["completed", { type: "completed" } as const],
  ])("should render nothing when the job state is %s", (_, jobState) => {
    renderJobState(jobState);

    expect(screen.queryByTestId(`${TEST_ID}-pending`)).toBeNull();
    expect(screen.queryByTestId(`${TEST_ID}-rejected`)).toBeNull();
    expect(screen.queryByTestId(`${TEST_ID}-continue-on-device`)).toBeNull();
    expect(isDialogBlocked()).toBe(false);
  });
});
