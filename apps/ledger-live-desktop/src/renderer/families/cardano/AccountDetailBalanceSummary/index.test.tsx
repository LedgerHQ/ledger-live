import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, within } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import AccountDetailBalanceSummary from ".";

const accountWith = (delegation?: Record<string, unknown>) =>
  ({
    type: "Account",
    id: "cardano-account",
    currency: getCryptoCurrencyById("cardano"),
    balance: new BigNumber(20).times(1e6),
    spendableBalance: new BigNumber(12).times(1e6),
    cardanoResources: { delegation },
  }) as unknown as CardanoAccount;

describe("Cardano AccountDetailBalanceSummary", () => {
  it("shows only the available balance without a delegation", () => {
    render(<AccountDetailBalanceSummary account={accountWith()} />);

    const summary = screen.getByTestId("account-detail-cardano-balance-summary");
    expect(within(summary).getByText(/12/)).toBeInTheDocument();
    expect(within(summary).queryByText("Delegated assets")).toBeNull();
  });

  it("adds the delegated assets and the rewards when delegating", () => {
    render(
      <AccountDetailBalanceSummary
        account={accountWith({ poolId: "pool", rewards: new BigNumber(3).times(1e6) })}
      />,
    );

    const summary = screen.getByTestId("account-detail-cardano-balance-summary");
    expect(within(summary).getByText(/20/)).toBeInTheDocument();
    expect(within(summary).getByText(/3 ADA|3\.0*\s?ADA/)).toBeInTheDocument();
  });

  it("renders nothing for a token account", () => {
    const { container } = render(
      <AccountDetailBalanceSummary account={{ type: "TokenAccount" } as TokenAccount} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
