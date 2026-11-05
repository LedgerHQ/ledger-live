import React from "react";
import { renderHook } from "@testing-library/react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { RemoveMemberJobState } from "@features/platform-intent-wallet-sync";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { RemoveMemberComponentLWD } from "./componentLWD";

const TEST_ID = "wallet-sync-remove-member";

function renderComponent(jobState: RemoveMemberJobState | undefined) {
  const onClose = jest.fn();
  const { user } = render(
    <RemoveMemberComponentLWD jobState={jobState} extraProps={undefined} onClose={onClose} />,
  );
  return { user, onClose };
}

describe("RemoveMemberComponentLWD", () => {
  it.each([
    ["undefined", undefined],
    ["pending", { type: "pending" } as const],
  ])("should show the loading screen when the job state is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.getByTestId(`${TEST_ID}-pending`)).toBeVisible();
  });

  it("should ask to continue on the device and block the dialog while it waits", () => {
    renderComponent({
      type: "awaiting-device-confirmation",
      deviceModelId: DeviceModelId.STAX,
      deviceName: "Lily's Ledger",
    });

    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
    expect(screen.getByText("Lily's Ledger")).toBeVisible();
    expect(renderHook(() => useDeviceBlocked()).result.current).toBe(true);
  });

  it("should offer Retry and Close when the user refused on the device", async () => {
    const retry = jest.fn();
    const { user, onClose } = renderComponent({
      type: "device-rejected",
      error: new Error("UserRefusedOnDevice"),
      retry,
    });

    expect(screen.getByText("Operation rejected on Ledger device")).toBeVisible();
    await user.click(screen.getByTestId(`${TEST_ID}-retry`));
    await user.click(screen.getByTestId(`${TEST_ID}-close`));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["failed", { type: "failed", reason: "not-allowed", error: new Error("x") }],
    ["completed", { type: "completed" }],
  ] as const)("should render nothing when the job state is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.queryByTestId(`${TEST_ID}-pending`)).toBeNull();
    expect(screen.queryByTestId(`${TEST_ID}-rejected`)).toBeNull();
    expect(screen.queryByTestId(`${TEST_ID}-continue-on-device`)).toBeNull();
  });
});
