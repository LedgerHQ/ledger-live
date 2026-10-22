import React from "react";
import { Linking } from "react-native";
import { fireEvent, render } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { CompleteExchangeIntentJobState } from "@ledgerhq/live-common/exchange/intents/index";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { CompleteExchangeIntentComponent } from "./component";

jest.mock("~/components/ModalLock", () => {
  const { View } = jest.requireActual("react-native");
  return { __esModule: true, default: () => <View testID="modal-lock" /> };
});

function renderComponent(
  jobState: CompleteExchangeIntentJobState | undefined,
  onClose = jest.fn(),
) {
  return {
    onClose,
    ...render(
      <CompleteExchangeIntentComponent
        jobState={jobState}
        extraProps={undefined}
        onClose={onClose}
      />,
    ),
  };
}

const awaiting = (
  overrides: Partial<
    Extract<CompleteExchangeIntentJobState, { type: "awaiting-confirmation" }>
  > = {},
): CompleteExchangeIntentJobState => ({
  type: "awaiting-confirmation",
  deviceModelId: DeviceModelId.nanoX,
  exchangeType: ExchangeType.SWAP,
  provider: "changelly",
  sponsored: false,
  estimatedFees: "42",
  ...overrides,
});

describe("CompleteExchangeIntentComponent", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockImplementation(async () => {});
  });

  it.each([
    ["is not started", undefined],
    ["is preparing", { type: "preparing", deviceModelId: DeviceModelId.nanoX } as const],
    ["failed", { type: "error", error: new Error("failed") } as const],
  ])("shows a spinner while the confirmation %s", (_name, jobState) => {
    const { getByTestId, queryByTestId } = renderComponent(jobState);

    expect(getByTestId("wallet-api-exchange-loading")).toBeTruthy();
    expect(queryByTestId("wallet-api-exchange-confirm-prompt")).toBeNull();
    expect(queryByTestId("modal-lock")).toBeNull();
  });

  it.each<[string, CompleteExchangeIntentJobState]>([
    ["is confirmed and hands over to the coin app", { type: "confirmed" }],
    ["waits for the coin app", { type: "pending", deviceModelId: DeviceModelId.nanoX }],
    [
      "has the coin app sign",
      { type: "device-signature-requested", deviceModelId: DeviceModelId.nanoX },
    ],
    ["streams the transaction", { type: "device-streaming", progress: 0.5 }],
    ["got the signature", { type: "device-signature-granted", deviceModelId: DeviceModelId.nanoX }],
    ["is signed", { type: "signed", signedOperation: { operation: {} } as never }],
  ])("shows a spinner and keeps the drawer locked while the exchange %s", (_name, jobState) => {
    const { getByTestId, queryByTestId } = renderComponent(jobState);

    expect(getByTestId("wallet-api-exchange-loading")).toBeTruthy();
    expect(queryByTestId("wallet-api-exchange-confirm-prompt")).toBeNull();
    expect(getByTestId("modal-lock")).toBeTruthy();
  });

  it("asks the user to confirm a swap on the device, with the swap terms, and locks the drawer", () => {
    const { getByTestId, getByText, getAllByRole } = renderComponent(awaiting());

    expect(getByTestId("wallet-api-exchange-confirm-prompt")).toBeTruthy();
    expect(getByText("Confirm swap operation on device")).toBeTruthy();
    expect(getByText("Verify the swap details on your Ledger before sending it.")).toBeTruthy();
    expect(getByTestId("wallet-api-exchange-terms")).toBeTruthy();
    expect(getAllByRole("link").length).toBeGreaterThan(0);
    expect(getByTestId("modal-lock")).toBeTruthy();
  });

  it.each([
    ["sell", ExchangeType.SELL, "Confirm sell operation on device"],
    ["fund", ExchangeType.FUND, "Confirm Fund transaction"],
  ])(
    "asks the user to confirm a %s on the device, without swap terms",
    (_name, exchangeType, title) => {
      const { getByText, queryByTestId } = renderComponent(awaiting({ exchangeType }));

      expect(getByText(title)).toBeTruthy();
      expect(queryByTestId("wallet-api-exchange-terms")).toBeNull();
    },
  );

  it("tells the user the exchange was refused, and closes from its only button", () => {
    const { getByTestId, queryByTestId, onClose } = renderComponent({ type: "refused" });

    expect(getByTestId("wallet-api-exchange-refused")).toBeTruthy();
    // The nonce is spent: unlike the wallet-api signing drawer there is nothing to retry here.
    expect(queryByTestId("wallet-api-exchange-refused-retry")).toBeNull();

    fireEvent.press(getByTestId("wallet-api-exchange-refused-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
