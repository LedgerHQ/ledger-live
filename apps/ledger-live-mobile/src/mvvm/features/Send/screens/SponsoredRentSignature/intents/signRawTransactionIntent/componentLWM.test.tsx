import React from "react";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { SignRawTransactionIntentComponentLWM } from "./componentLWM";

const TERMS_URL = "https://provider.example/terms";
const extraProps = {
  strategyLabel: "Energy rental - Provider",
  feeLabel: "Rental fee: 3.2 USDT",
  providerName: "Provider",
  termsUrl: TERMS_URL,
};

describe("SignRawTransactionIntentComponentLWM", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("names the provider and the rent while waiting on the device", () => {
    render(
      <SignRawTransactionIntentComponentLWM
        jobState={{ type: "device-signature-requested", deviceModelId: DeviceModelId.stax }}
        extraProps={extraProps}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-sponsored-rent-signature-prompt")).toBeOnTheScreen();
    expect(screen.getByText("Approve network fees sponsoring")).toBeOnTheScreen();
    expect(screen.getByText("Energy rental - Provider")).toBeOnTheScreen();
    expect(screen.getByText("Rental fee: 3.2 USDT")).toBeOnTheScreen();
  });

  it("tells the user that signing accepts the provider's terms, and opens them", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user } = render(
      <SignRawTransactionIntentComponentLWM
        jobState={{ type: "device-signature-requested", deviceModelId: DeviceModelId.stax }}
        extraProps={extraProps}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-sponsored-rent-signature-terms")).toHaveTextContent(
      "By signing this transaction, you agree to Provider's Terms and Conditions.",
    );
    await user.press(screen.getByTestId("send-sponsored-rent-signature-terms-link"));
    expect(openURL).toHaveBeenCalledWith(TERMS_URL);
  });

  it("shows no terms notice without a provider's terms", () => {
    render(
      <SignRawTransactionIntentComponentLWM
        jobState={{ type: "device-signature-requested", deviceModelId: DeviceModelId.stax }}
        extraProps={{ ...extraProps, termsUrl: null }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.queryByTestId("send-sponsored-rent-signature-terms")).toBeNull();
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
