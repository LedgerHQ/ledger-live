import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { HyperliquidSignIntentJobState } from "@features/platform-hyperliquid-sign-intent";
import { HyperliquidSignIntentComponentLWM } from "../componentLWM";

function renderComponent(jobState: HyperliquidSignIntentJobState | undefined) {
  render(
    <HyperliquidSignIntentComponentLWM
      jobState={jobState}
      extraProps={undefined}
      onClose={jest.fn()}
    />,
  );
}

describe("HyperliquidSignIntentComponentLWM", () => {
  it("renders nothing before the job emits a state", () => {
    renderComponent(undefined);

    expect(screen.queryByTestId("perps-sign-intent-signing")).toBeNull();
  });

  it("asks the user to continue on their device while signing", () => {
    renderComponent({ type: "signing", deviceModelId: DeviceModelId.FLEX, deviceName: "My Flex" });

    expect(screen.getByText("Continue on your Ledger Flex")).toBeVisible();
    expect(
      screen.getByText("Follow the instructions displayed on your Secure Touchscreen."),
    ).toBeVisible();
  });

  it.each<HyperliquidSignIntentJobState>([
    { type: "signed" },
    { type: "refused" },
    { type: "error", error: new Error("certificate not found") },
  ])("leaves the $type outcome to the live app while the drawer closes", jobState => {
    renderComponent(jobState);

    expect(screen.getByTestId("perps-sign-intent-done")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
