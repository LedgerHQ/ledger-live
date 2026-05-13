import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { render, screen } from "tests/testSetup";
import { TransactionHeader } from "../components/TransactionHeader";
import { formatCreatedAt } from "../utils";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

describe("TransactionHeader", () => {
  it("should render the swap title and creation date when currencies are available", () => {
    const createdAt = new Date(2024, 0, 2, 15, 4).getTime();

    render(
      <TransactionHeader
        sendCurrency={bitcoin}
        receiveCurrency={ethereum}
        createdAt={createdAt}
        locale="en-US"
      />,
    );

    expect(screen.getByRole("heading", { name: "Swap BTC → ETH" })).toBeVisible();
    expect(screen.getByText(formatCreatedAt(createdAt, "en-US"))).toBeVisible();
  });

  it("should hide the swap title and date while header data is loading", () => {
    render(<TransactionHeader locale="en-US" />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText("Swap BTC → ETH")).not.toBeInTheDocument();
  });
});
