import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { AddMemberJobState } from "@features/platform-intent-wallet-sync";
import { AddMemberComponentLWM } from "./componentLWM";

const TEST_ID = "wallet-sync-add-member";

function renderComponent(jobState: AddMemberJobState | undefined) {
  const onClose = jest.fn();
  const { user, store } = render(
    <AddMemberComponentLWM jobState={jobState} extraProps={undefined} onClose={onClose} />,
  );
  return { user, store, onClose };
}

describe("AddMemberComponentLWM", () => {
  it.each([
    ["undefined", undefined],
    ["pending", { type: "pending" } as const],
  ])("should show the loading screen when the job state is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.getByTestId(`${TEST_ID}-pending`)).toBeVisible();
  });

  it("should ask to continue on the device and lock the drawer while it waits", () => {
    const { store } = renderComponent({
      type: "awaiting-device-confirmation",
      deviceModelId: DeviceModelId.STAX,
      deviceName: "Lily's Ledger",
    });

    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
    expect(screen.getByText("Lily's Ledger")).toBeVisible();
    expect(store.getState().appstate.modalLock).toBe(true);
  });

  it("should offer Retry and Close when the user refused on the device", async () => {
    const retry = jest.fn();
    const { user, onClose } = renderComponent({
      type: "device-rejected",
      error: new Error("UserRefusedOnDevice"),
      retry,
    });

    expect(screen.getByText("Operation rejected on Ledger device")).toBeVisible();
    await user.press(screen.getByText("Retry"));
    await user.press(screen.getByText("Close"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["failed", { type: "failed", reason: "already-secured-other-seed", error: new Error("x") }],
    ["completed", { type: "completed" }],
  ] as const)("should render nothing when the job state is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.queryByTestId(`${TEST_ID}-pending`)).toBeNull();
    expect(screen.queryByTestId(`${TEST_ID}-rejected`)).toBeNull();
    expect(screen.queryByTestId(`${TEST_ID}-continue-on-device`)).toBeNull();
  });
});
