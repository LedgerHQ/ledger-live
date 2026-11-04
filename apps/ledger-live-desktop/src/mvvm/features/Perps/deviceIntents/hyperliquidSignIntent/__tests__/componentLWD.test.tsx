import React from "react";
import { render, renderHook, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { HyperliquidSignIntentJobState } from "@features/platform-hyperliquid-sign-intent";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { HyperliquidSignIntentComponentLWD } from "../componentLWD";

const SIGNING: HyperliquidSignIntentJobState = {
  type: "signing",
  deviceModelId: DeviceModelId.STAX,
  deviceName: "My Stax",
};

function renderComponent(jobState: HyperliquidSignIntentJobState | undefined) {
  return render(
    <HyperliquidSignIntentComponentLWD
      jobState={jobState}
      extraProps={undefined}
      onClose={jest.fn()}
    />,
  );
}

describe("HyperliquidSignIntentComponentLWD", () => {
  it("renders nothing before the job emits a state", () => {
    const { container } = renderComponent(undefined);

    expect(container).toBeEmptyDOMElement();
  });

  it("asks the user to continue on their device while signing", () => {
    renderComponent(SIGNING);

    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
    expect(screen.getByText("My Stax")).toBeVisible();
  });

  it("blocks closing the dialog only while signing", () => {
    const blocked = renderHook(() => useDeviceBlocked());
    const { rerender } = renderComponent(SIGNING);

    expect(blocked.result.current).toBe(true);

    rerender(
      <HyperliquidSignIntentComponentLWD
        jobState={{ type: "refused" }}
        extraProps={undefined}
        onClose={jest.fn()}
      />,
    );

    expect(blocked.result.current).toBe(false);
  });

  it.each<HyperliquidSignIntentJobState>([
    { type: "signed" },
    { type: "refused" },
    { type: "error", error: new Error("certificate not found") },
  ])("leaves the $type outcome to the live app while the dialog closes", jobState => {
    renderComponent(jobState);

    expect(screen.getByTestId("perps-sign-intent-done")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
