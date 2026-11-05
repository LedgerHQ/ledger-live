import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, within } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import type { AccountLike } from "@ledgerhq/types-live";
import AccountDetailBalanceSummary from "./AccountDetailBalanceSummary";

const NBSP = " ";
const ADA = (value: number) => new BigNumber(value).times(1e6);

const accountWith = (delegation?: Record<string, unknown>): CardanoAccount =>
  ({
    type: "Account",
    id: "cardano-account",
    currency: getCryptoCurrencyById("cardano"),
    balance: ADA(20),
    spendableBalance: ADA(12),
    cardanoResources: { delegation },
  }) as unknown as CardanoAccount;

const card = (id: string) =>
  within(screen.getByTestId(`account-detail-cardano-balance-summary-${id}`));

describe("Cardano AccountDetailBalanceSummary", () => {
  it("shows only the available balance without a delegation", () => {
    render(<AccountDetailBalanceSummary account={accountWith()} />);

    expect(card("available").getByText(`12${NBSP}ADA`)).toBeVisible();
    expect(screen.queryByTestId("account-detail-cardano-balance-summary-delegated")).toBeNull();
  });

  it("adds the delegated assets and the rewards when delegating", () => {
    render(
      <AccountDetailBalanceSummary account={accountWith({ poolId: "pool", rewards: ADA(3) })} />,
    );

    expect(card("delegated").getByText(`20${NBSP}ADA`)).toBeVisible();
    expect(card("rewards").getByText(`3${NBSP}ADA`)).toBeVisible();
  });

  it("renders nothing for a token account", () => {
    render(<AccountDetailBalanceSummary account={{ type: "TokenAccount" } as AccountLike} />);

    expect(screen.queryByTestId("account-detail-cardano-balance-summary-available")).toBeNull();
  });
});
