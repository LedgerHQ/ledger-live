import React from "react";
import { Linking } from "react-native";
import { track, trackPage } from "@shared/analytics";
import { fireEvent, render } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { ShowExchangeErrorIntentJobState } from "@ledgerhq/live-common/exchange/intents/index";
import { ShowExchangeErrorIntentComponent } from "./component";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

const mockExportLogs = jest.fn(async () => undefined);
jest.mock("~/components/useExportLogs", () => ({
  __esModule: true,
  default: () => mockExportLogs,
}));

function renderComponent(
  jobState: ShowExchangeErrorIntentJobState | undefined,
  onClose = jest.fn(),
) {
  return {
    onClose,
    ...render(
      <ShowExchangeErrorIntentComponent
        jobState={jobState}
        extraProps={undefined}
        onClose={onClose}
      />,
    ),
  };
}

describe("ShowExchangeErrorIntentComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockImplementation(async () => {});
  });

  it("shows nothing before the job reports", () => {
    const { queryByTestId } = renderComponent(undefined);

    expect(queryByTestId("wallet-api-exchange-error")).toBeNull();
    expect(queryByTestId("wallet-api-exchange-incompatible-device")).toBeNull();
  });

  describe("error", () => {
    it("tells the user what went wrong", () => {
      const { getByTestId, getByText } = renderComponent({
        type: "error",
        error: new Error("Something odd happened"),
      });

      expect(getByTestId("wallet-api-exchange-error")).toBeTruthy();
      expect(getByText("Something odd happened")).toBeTruthy();
    });

    it("gives support the swap code and the reference id", () => {
      const error = Object.assign(new Error("failed"), {
        cause: { swapCode: "swap001", correlationId: "abc123" },
      });

      const { getByText } = renderComponent({ type: "error", error });

      expect(getByText("Error code: swap001")).toBeTruthy();
      expect(getByText("Reference ID: abc123")).toBeTruthy();
    });

    it("shows a lone reference id without a code", () => {
      const error = Object.assign(new Error("failed"), { cause: { correlationId: "abc123" } });

      const { getByText, queryByText } = renderComponent({ type: "error", error });

      expect(getByText("Reference ID: abc123")).toBeTruthy();
      expect(queryByText(/Error code/)).toBeNull();
    });

    it("has no details block when the error carries neither", () => {
      const { queryByText } = renderComponent({ type: "error", error: new Error("failed") });

      expect(queryByText(/Error code|Reference ID/)).toBeNull();
    });

    it("saves the logs from its main button, and has no retry", () => {
      const { getByTestId, getByText, queryByTestId } = renderComponent({
        type: "error",
        error: new Error("failed"),
      });

      expect(getByText("Save logs")).toBeTruthy();
      fireEvent.press(getByTestId("wallet-api-exchange-error-save-logs"));

      expect(mockExportLogs).toHaveBeenCalledTimes(1);
      expect(queryByTestId("wallet-api-exchange-error-retry")).toBeNull();
    });

    it("closes from its second button", () => {
      const { getByTestId, onClose } = renderComponent({
        type: "error",
        error: new Error("failed"),
      });

      fireEvent.press(getByTestId("wallet-api-exchange-error-close"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("tracks the failed step and error key, but none of the error's other fields", () => {
      const error = Object.assign(new Error("sanctioned"), {
        step: "INIT",
        title: "AddressesSanctionedError",
        addresses: ["bc1qsanctioned"],
      });

      renderComponent({ type: "error", error });

      expect(trackPage).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "Swap",
          name: "Swap Error Screen",
          props: {
            swapVersion: expect.any(String),
            flow: "swap",
            step: "INIT",
            title: "AddressesSanctionedError",
          },
        }),
        expect.anything(),
      );
    });
  });

  describe("incompatible device", () => {
    const state: ShowExchangeErrorIntentJobState = {
      type: "incompatible-device",
      provider: "thorswap",
      deviceModelId: DeviceModelId.nanoS,
      sourceCurrencyId: "bitcoin",
      targetCurrencyId: "ethereum",
    };

    it("tells the user the Nano S cannot swap with this provider", () => {
      const { getByTestId, getAllByText } = renderComponent(state);

      expect(getByTestId("wallet-api-exchange-incompatible-device")).toBeTruthy();
      // Both the title and the description say it.
      expect(getAllByText(/is not compatible with/)).toHaveLength(2);
    });

    it("sends the user to the devices that can, and tracks it", () => {
      const { getByTestId } = renderComponent(state);

      fireEvent.press(getByTestId("wallet-api-exchange-incompatible-device-explore"));

      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining("shop.ledger.com"));
      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          button: "explore_compatible_devices",
          page: "Swap Nano S Incompatibility",
          flow: "swap",
          deviceModel: "nanoS",
          variant: "provider",
          provider: "thorswap",
          sourceCurrency: "bitcoin",
          targetCurrency: "ethereum",
        }),
      );
    });

    it("closes to swap with another provider, and tracks it", () => {
      const { getByTestId, onClose } = renderComponent(state);

      fireEvent.press(getByTestId("wallet-api-exchange-incompatible-device-other-provider"));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({ button: "swap_with_another_provider" }),
      );
    });

    it("leaves the currencies out of the tracking when they are not known", () => {
      const { getByTestId } = renderComponent({
        type: "incompatible-device",
        provider: "thorswap",
        deviceModelId: DeviceModelId.nanoS,
      });

      fireEvent.press(getByTestId("wallet-api-exchange-incompatible-device-explore"));

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.not.objectContaining({ sourceCurrency: expect.anything() }),
      );
    });
  });
});
