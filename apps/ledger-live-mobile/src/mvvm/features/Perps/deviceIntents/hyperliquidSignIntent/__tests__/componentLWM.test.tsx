import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { HyperliquidSignIntentJobState } from "@features/platform-hyperliquid-sign-intent";
import { HyperliquidSignIntentComponentLWM } from "../componentLWM";

const mockExportLogs = jest.fn();
jest.mock("~/components/useExportLogs", () => ({
  __esModule: true,
  default: () => mockExportLogs,
}));

function renderComponent(jobState: HyperliquidSignIntentJobState | undefined) {
  const onClose = jest.fn();
  const { user } = render(
    <HyperliquidSignIntentComponentLWM
      jobState={jobState}
      extraProps={undefined}
      onClose={onClose}
    />,
  );

  return { user, onClose };
}

describe("HyperliquidSignIntentComponentLWM", () => {
  beforeEach(() => jest.clearAllMocks());

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

  it("tells the user the operation was rejected and lets them close", async () => {
    const { user, onClose } = renderComponent({ type: "refused" });

    expect(screen.getByText("Operation rejected on device")).toBeVisible();
    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("when signing failed", () => {
    const errorState: HyperliquidSignIntentJobState = {
      type: "error",
      error: new Error("certificate not found"),
    };

    it("lets the user save their logs", async () => {
      const { user } = renderComponent(errorState);

      expect(screen.getByTestId("perps-sign-intent-error")).toBeVisible();
      await user.press(screen.getByRole("button", { name: "Save logs" }));

      expect(mockExportLogs).toHaveBeenCalledTimes(1);
    });

    it("lets the user close", async () => {
      const { user, onClose } = renderComponent(errorState);

      await user.press(screen.getByRole("button", { name: "Close" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
