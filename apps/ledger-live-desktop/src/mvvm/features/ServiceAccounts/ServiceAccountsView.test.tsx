import React from "react";
import { render, screen } from "tests/testSetup";
import { ServiceAccountsView } from "./ServiceAccountsView";
import type { ServiceAccountRowView } from "./types";

const row: ServiceAccountRowView = {
  id: "acc-eth",
  name: "Ethereum",
  address: "0x0000000000000000000000000000000000000001",
  network: "ethereum",
  status: "synchronized",
  error: null,
  value: 3000,
  valueLabel: "$3,000.00",
  balanceLabel: "1.5 ETH",
  pending: true,
};

describe("ServiceAccountsView", () => {
  it("should show the service total and the account balance", () => {
    render(
      <ServiceAccountsView
        phase="ready"
        error={null}
        totalLabel="$3,002.50"
        skippedCount={1}
        rows={[row]}
      />,
    );

    expect(screen.getByRole("region", { name: "Portfolio service" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Address" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Value" })).toBeVisible();
    expect(screen.getByText("Ethereum")).toBeVisible();
    expect(screen.getByText("$3,002.50")).toBeVisible();
    expect(screen.getByText("$3,000.00")).toBeVisible();
    expect(screen.getByText("1.5 ETH · Pending")).toBeVisible();
    expect(screen.getByText("1 local account was not sent")).toBeVisible();
  });

  it("should show the given empty state when no row is left", () => {
    render(
      <ServiceAccountsView
        phase="ready"
        error={null}
        totalLabel="$0.00"
        skippedCount={0}
        rows={[]}
        emptyState={<p>No match</p>}
      />,
    );

    expect(screen.getByText("No match")).toBeVisible();
    expect(screen.queryByTestId("portfolio-service-table")).toBeNull();
  });
});
