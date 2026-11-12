import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "tests/testSetup";
import { SignTransactionIntentComponentLWD } from "./componentLWD";

jest.mock("~/renderer/animations", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/components/DeviceAction/animations", () => ({
  getDeviceAnimation: () => null,
}));

const extraProps = { sponsoredTransfer: false, onDeviceConfirmationShown: jest.fn() };

describe("SignTransactionIntentComponentLWD", () => {
  beforeEach(() => jest.clearAllMocks());

  it("asks to continue on the device while the signature is requested", () => {
    render(
      <SignTransactionIntentComponentLWD
        jobState={{ type: "device-signature-requested", deviceModelId: DeviceModelId.stax }}
        extraProps={extraProps}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-signature-title")).toHaveTextContent(
      "Continue on your Ledger Stax",
    );
    expect(extraProps.onDeviceConfirmationShown).toHaveBeenCalledTimes(1);
  });

  it("titles the sponsored transfer signature", () => {
    render(
      <SignTransactionIntentComponentLWD
        jobState={{ type: "pending", deviceModelId: DeviceModelId.stax }}
        extraProps={{ ...extraProps, sponsoredTransfer: true }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-signature-title")).toHaveTextContent("Confirm transfer");
  });

  it("shows the broadcast loader once signed", () => {
    render(
      <SignTransactionIntentComponentLWD
        jobState={{ type: "signed", signedOperation: {} as never }}
        extraProps={extraProps}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-signature-loading")).toHaveTextContent(
      "Broadcasting transaction...",
    );
  });

  it("offers to retry or close after a refusal on the device", async () => {
    const retry = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <SignTransactionIntentComponentLWD
        jobState={{ type: "cancelled", retry }}
        extraProps={extraProps}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Transaction canceled")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("offers to retry or close after a signing failure", async () => {
    const retry = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <SignTransactionIntentComponentLWD
        jobState={{ type: "error", error: new Error("signing failed"), retry }}
        extraProps={extraProps}
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId("send-signature-error")).toBeVisible();
    await user.click(screen.getByTestId("send-signature-error-retry"));
    await user.click(screen.getByTestId("send-signature-error-close"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
