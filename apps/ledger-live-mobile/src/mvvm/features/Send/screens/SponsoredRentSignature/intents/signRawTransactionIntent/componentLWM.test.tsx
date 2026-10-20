import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { SignRawTransactionIntentComponentLWM } from "./componentLWM";

const extraProps = { strategyLabel: "Energy rental - Provider", feeLabel: "Rental fee: 3.2 USDT" };

describe("SignRawTransactionIntentComponentLWM", () => {
  it("names the provider and the rent while waiting on the device", () => {
    render(
      <SignRawTransactionIntentComponentLWM
        jobState={{ type: "device-signature-requested", deviceModelId: DeviceModelId.stax }}
        extraProps={extraProps}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-sponsored-rent-signature-prompt")).toBeOnTheScreen();
    expect(screen.getByText("Energy rental - Provider")).toBeOnTheScreen();
    expect(screen.getByText("Rental fee: 3.2 USDT")).toBeOnTheScreen();
  });

  it("shows a loader once the device signed", () => {
    render(
      <SignRawTransactionIntentComponentLWM
        jobState={{ type: "device-signature-granted", deviceModelId: DeviceModelId.stax }}
        extraProps={extraProps}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-sponsored-rent-signature-loading")).toBeOnTheScreen();
  });

  it("offers Close and Retry after a refusal on the device", async () => {
    const onClose = jest.fn();
    const retry = jest.fn();
    const { user } = render(
      <SignRawTransactionIntentComponentLWM
        jobState={{ type: "cancelled", retry }}
        extraProps={extraProps}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Energy rental canceled")).toBeOnTheScreen();
    await user.press(screen.getByTestId("send-sponsored-rent-signature-cancelled-retry"));
    await user.press(screen.getByTestId("send-sponsored-rent-signature-cancelled-close"));
    expect(retry).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing before the job starts", () => {
    const { toJSON } = render(
      <SignRawTransactionIntentComponentLWM
        jobState={undefined}
        extraProps={extraProps}
        onClose={jest.fn()}
      />,
    );

    expect(toJSON()).toBeNull();
  });
});
