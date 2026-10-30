import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, within } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import type { AccountLike } from "@ledgerhq/types-live";
import AccountDetailBalances from "./AccountDetailBalances";

const NBSP = " ";

type Resources = Partial<TronAccount["tronResources"]>;

const accountWith = (resources: Resources = {}): TronAccount =>
  ({
    type: "Account",
    id: "tron-account",
    currency: getCryptoCurrencyById("tron"),
    spendableBalance: new BigNumber(5_000_000),
    tronResources: {
      tronPower: 0,
      energy: new BigNumber(0),
      bandwidth: {
        freeLimit: new BigNumber(0),
        gainedLimit: new BigNumber(0),
        freeUsed: new BigNumber(0),
        gainedUsed: new BigNumber(0),
      },
      ...resources,
    },
  }) as unknown as TronAccount;

const card = (id: string) => within(screen.getByTestId(`account-detail-tron-balances-${id}`));

describe("Tron AccountDetailBalances", () => {
  it("shows the available balance", () => {
    render(<AccountDetailBalances account={accountWith()} />);

    expect(card("available").getByText(`5${NBSP}TRX`)).toBeVisible();
  });

  it("shows the tron power as the frozen amount", () => {
    render(<AccountDetailBalances account={accountWith({ tronPower: 7 })} />);

    expect(card("frozen").getByText("7")).toBeVisible();
  });

  it("shows the bandwidth left once the used one is deducted", () => {
    const account = accountWith({
      bandwidth: {
        freeLimit: new BigNumber(1500),
        gainedLimit: new BigNumber(100),
        freeUsed: new BigNumber(150),
        gainedUsed: new BigNumber(50),
      },
    } as unknown as Resources);

    render(<AccountDetailBalances account={account} />);

    expect(card("bandwidth").getByText("1,400")).toBeVisible();
  });

  it("shows the energy", () => {
    render(<AccountDetailBalances account={accountWith({ energy: new BigNumber(42) })} />);

    expect(card("energy").getByText("42")).toBeVisible();
  });

  it("shows a dash for the bandwidth and the energy when there is none", () => {
    render(<AccountDetailBalances account={accountWith()} />);

    expect(card("bandwidth").getByText("-")).toBeVisible();
    expect(card("energy").getByText("-")).toBeVisible();
  });

  it("renders nothing for an account without tron resources", () => {
    render(<AccountDetailBalances account={{ type: "Account" } as AccountLike} />);

    expect(screen.queryByTestId("account-detail-tron-balances")).toBeNull();
  });
});
