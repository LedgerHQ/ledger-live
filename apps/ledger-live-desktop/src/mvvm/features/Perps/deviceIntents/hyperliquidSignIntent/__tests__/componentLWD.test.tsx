import React from "react";
import { render, renderHook, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { HyperliquidSignIntentJobState } from "@features/platform-hyperliquid-sign-intent";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { HyperliquidSignIntentComponentLWD } from "../componentLWD";

const mockHandleExportLogs = jest.fn();
jest.mock("LLD/hooks/useExportLogs", () => ({
  useExportLogs: () => ({ handleExportLogs: mockHandleExportLogs }),
}));

const SIGNING: HyperliquidSignIntentJobState = {
  type: "signing",
  deviceModelId: DeviceModelId.STAX,
  deviceName: "My Stax",
};

function renderComponent(jobState: HyperliquidSignIntentJobState | undefined) {
  const onClose = jest.fn();
  const view = render(
    <HyperliquidSignIntentComponentLWD
      jobState={jobState}
      extraProps={undefined}
      onClose={onClose}
    />,
  );

  return { ...view, onClose };
}

describe("HyperliquidSignIntentComponentLWD", () => {
  beforeEach(() => jest.clearAllMocks());

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

  it("tells the user the action was rejected and lets them close", async () => {
    const { user, onClose } = renderComponent({ type: "refused" });

    expect(screen.getByText("Action rejected")).toBeVisible();
    await user.click(screen.getByTestId("perps-sign-intent-refused-close"));

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
      await user.click(screen.getByTestId("perps-sign-intent-error-save-logs"));

      expect(mockHandleExportLogs).toHaveBeenCalledTimes(1);
    });

    it("lets the user close", async () => {
      const { user, onClose } = renderComponent(errorState);

      await user.click(screen.getByTestId("perps-sign-intent-error-close"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
