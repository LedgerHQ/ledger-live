import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import { render, screen } from "@tests/test-renderer";
import { StatusSection } from "../components/Status/StatusSection";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

function renderStatusSection({
  sendStatus = "pending",
  receiveStatus = "pending",
  showReceivedAmountEstimated = false,
}: {
  sendStatus?: TransactionStatusValue;
  receiveStatus?: TransactionStatusValue;
  showReceivedAmountEstimated?: boolean;
} = {}) {
  return render(
    <StatusSection
      sendCurrency={bitcoin}
      receiveCurrency={ethereum}
      sendStatus={sendStatus}
      receiveStatus={receiveStatus}
      sentAmount="0.1 BTC"
      receivedAmount="2 ETH"
      showReceivedAmountEstimated={showReceivedAmountEstimated}
      isLoading={false}
    />,
  );
}

describe("StatusSection", () => {
  it("should render ongoing and unknown status labels", () => {
    renderStatusSection({ sendStatus: "pending", receiveStatus: "unknown" });

    expect(screen.getByText("Sending BTC")).toBeVisible();
    expect(screen.getByText("Receiving ETH")).toBeVisible();
    expect(screen.getByText("Ongoing")).toBeVisible();
    expect(screen.getByText("Unknown")).toBeVisible();
  });

  it("should render refunded and cancelled receive status labels for refunded swaps", () => {
    renderStatusSection({ sendStatus: "refunded", receiveStatus: "refunded" });

    expect(screen.getByText("Sending BTC")).toBeVisible();
    expect(screen.getByText("Receiving ETH")).toBeVisible();
    expect(screen.getByText("Refunded")).toBeVisible();
    expect(screen.getByText("Cancelled")).toBeVisible();
  });

  it("should render the estimated label under the received amount when enabled", () => {
    renderStatusSection({
      sendStatus: "finished",
      receiveStatus: "finished",
      showReceivedAmountEstimated: true,
    });

    expect(screen.getByText("(Estimated)")).toBeVisible();
  });

  it("should not render the estimated label when disabled", () => {
    renderStatusSection({ sendStatus: "finished", receiveStatus: "finished" });

    expect(screen.queryByText("(Estimated)")).toBeNull();
  });

  it("should not render the estimated label while the received amount is unavailable", () => {
    render(
      <StatusSection
        sendCurrency={bitcoin}
        receiveCurrency={ethereum}
        sendStatus="finished"
        receiveStatus="finished"
        sentAmount="0.1 BTC"
        receivedAmount={undefined}
        showReceivedAmountEstimated
        isLoading={false}
      />,
    );

    expect(screen.queryByText("(Estimated)")).toBeNull();
  });

  it("should hide title and status labels while loading", () => {
    render(
      <StatusSection
        sendCurrency={bitcoin}
        receiveCurrency={ethereum}
        sendStatus="pending"
        receiveStatus="pending"
        sentAmount={undefined}
        receivedAmount={undefined}
        isLoading
      />,
    );

    expect(screen.queryByText("Sending BTC")).toBeNull();
    expect(screen.queryByText("Ongoing")).toBeNull();
  });
});
