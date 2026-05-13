import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import { render, screen } from "tests/testSetup";
import { StatusSection } from "../components/Status/StatusSection";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

function renderStatusSection({
  sendStatus = "pending",
  receiveStatus = "pending",
}: {
  sendStatus?: TransactionStatusValue;
  receiveStatus?: TransactionStatusValue;
} = {}) {
  return render(
    <StatusSection
      sendCurrency={bitcoin}
      receiveCurrency={ethereum}
      sendStatus={sendStatus}
      receiveStatus={receiveStatus}
      sentAmount="0.1 BTC"
      receivedAmount="2 ETH"
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

  it("should render completed and cancelled receive status labels for refunded swaps", () => {
    renderStatusSection({ sendStatus: "refunded", receiveStatus: "refunded" });

    expect(screen.getByText("Sending BTC")).toBeVisible();
    expect(screen.getByText("Receiving ETH")).toBeVisible();
    expect(screen.getByText("Refunded")).toBeVisible();
    expect(screen.getByText("Cancelled")).toBeVisible();
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

    expect(screen.queryByText("Sending BTC")).not.toBeInTheDocument();
    expect(screen.queryByText("Ongoing")).not.toBeInTheDocument();
  });
});
