import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { SimplifiedTransactionConfirm } from "./SimplifiedTransactionConfirm";

describe("SimplifiedTransactionConfirm", () => {
  it("renders the product name without duplicating the Ledger brand", () => {
    render(<SimplifiedTransactionConfirm deviceModelId={DeviceModelId.europa} />);

    expect(screen.getByText(/^Continue\s+on\s+your\s+Ledger\s+Flex$/)).toBeVisible();
    expect(screen.queryByText(/^Continue\s+on\s+your\s+Ledger\s+Ledger\s+Flex$/)).toBeNull();
  });

  it("shows the given title in place of the device prompt", () => {
    render(
      <SimplifiedTransactionConfirm
        deviceModelId={DeviceModelId.europa}
        title="Confirm transfer"
      />,
    );

    expect(screen.getByText("Confirm transfer")).toBeVisible();
    expect(screen.queryByText(/^Continue\s+on\s+your/)).toBeNull();
  });
});
