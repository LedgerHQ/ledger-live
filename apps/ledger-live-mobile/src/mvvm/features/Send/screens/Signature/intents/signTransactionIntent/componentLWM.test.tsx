import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { SignTransactionIntentComponentLWM } from "./componentLWM";

const jobState = { type: "device-signature-requested", deviceModelId: DeviceModelId.stax } as const;

describe("SignTransactionIntentComponentLWM", () => {
  it("titles a sponsored send's transfer as its own step", () => {
    render(
      <SignTransactionIntentComponentLWM
        jobState={jobState}
        extraProps={{ sponsoredTransfer: true }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-signature-prompt")).toBeOnTheScreen();
    expect(screen.getByText("Confirm transfer")).toBeOnTheScreen();
  });

  it("keeps the device prompt for a standard send", () => {
    render(
      <SignTransactionIntentComponentLWM
        jobState={jobState}
        extraProps={{ sponsoredTransfer: false }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText(/^Continue\s+on\s+your\s+Ledger\s+Stax$/)).toBeOnTheScreen();
    expect(screen.queryByText("Confirm transfer")).toBeNull();
  });
});
