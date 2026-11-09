import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { LedgerSyncJobState } from "@features/platform-intent-wallet-sync";
import { LedgerSyncJobStateLWM } from "./LedgerSyncJobStateLWM";

const TEST_ID = "wallet-sync-intent";

const AWAITING_CONFIRMATION: LedgerSyncJobState = {
  type: "awaiting-device-confirmation",
  deviceModelId: DeviceModelId.STAX,
  deviceName: "Lily's Ledger",
};

function renderJobState(jobState: LedgerSyncJobState | undefined) {
  const onClose = jest.fn();
  const rendered = render(
    <LedgerSyncJobStateLWM jobState={jobState} onClose={onClose} testID={TEST_ID} />,
  );
  return { ...rendered, onClose };
}

describe("LedgerSyncJobStateLWM", () => {
  it.each([
    ["undefined", undefined, `${TEST_ID}-pending`],
    ["pending", { type: "pending" } as const, `${TEST_ID}-pending`],
  ])("should show the loading screen, unlocked, when the job state is %s", (_, jobState, id) => {
    const { store } = renderJobState(jobState);

    expect(screen.getByTestId(id)).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(false);
  });

  it("should ask to continue on the device and lock the drawer while it waits", () => {
    const { store } = renderJobState(AWAITING_CONFIRMATION);

    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
    expect(screen.getByText("Lily's Ledger")).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(true);
  });

  it("should show the loading screen and keep the drawer locked while the SDK finishes", () => {
    const { store, rerender, onClose } = renderJobState(AWAITING_CONFIRMATION);

    rerender(
      <LedgerSyncJobStateLWM
        jobState={{ type: "processing" }}
        onClose={onClose}
        testID={TEST_ID}
      />,
    );

    expect(screen.getByTestId(`${TEST_ID}-processing`)).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(true);
  });

  it("should offer Retry and Close, unlocked, when the user refused on the device", async () => {
    const retry = jest.fn();
    const { user, store, onClose } = renderJobState({
      type: "device-rejected",
      error: new Error("UserRefusedOnDevice"),
      retry,
    });

    expect(screen.getByText("Operation rejected on Ledger device")).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(false);
    await user.press(screen.getByText("Retry"));
    await user.press(screen.getByText("Close"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["failed", { type: "failed", reason: "not-allowed", error: new Error("x") } as const],
    ["completed", { type: "completed" } as const],
  ])("should render nothing when the job state is %s", (_, jobState) => {
    const { store } = renderJobState(jobState);

    expect(screen.queryByTestId(`${TEST_ID}-pending`)).toBeNull();
    expect(screen.queryByTestId(`${TEST_ID}-rejected`)).toBeNull();
    expect(screen.queryByTestId(`${TEST_ID}-continue-on-device`)).toBeNull();
    expect(store.getState().appstate.modalLock).toBe(false);
  });
});
