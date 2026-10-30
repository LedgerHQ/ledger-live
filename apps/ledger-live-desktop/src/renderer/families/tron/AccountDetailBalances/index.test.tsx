import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, within } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountDetailBalances from ".";

jest.mock("~/renderer/hooks/useAccountUnit", () => {
  const actual = jest.requireActual("~/renderer/hooks/useAccountUnit");
  return { ...actual, useMaybeAccountUnit: jest.fn(actual.useMaybeAccountUnit) };
});

const TRX = (value: number) => new BigNumber(value).times(1e6);

type Resources = Partial<TronAccount["tronResources"]>;

const accountWith = (resources: Resources = {}): TronAccount =>
  ({
    type: "Account",
    id: "tron-account",
    currency: getCryptoCurrencyById("tron"),
    spendableBalance: TRX(5),
    tronResources: {
      frozen: {},
      delegatedFrozen: {},
      unFrozen: {},
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

    expect(card("available").getByText(`5 TRX`)).toBeInTheDocument();
  });

  it("adds up every frozen, delegated and unfrozen amount", () => {
    const account = accountWith({
      frozen: { bandwidth: { amount: TRX(1) }, energy: { amount: TRX(2) } },
      delegatedFrozen: { bandwidth: { amount: TRX(4) }, energy: { amount: TRX(8) } },
      unFrozen: {
        bandwidth: [{ amount: TRX(16) }, { amount: TRX(32) }],
        energy: [{ amount: TRX(64) }],
      },
    } as unknown as Resources);

    render(<AccountDetailBalances account={account} />);

    expect(card("frozen").getByText(`127 TRX`)).toBeInTheDocument();
  });

  it("shows a zero frozen amount when nothing is frozen", () => {
    render(<AccountDetailBalances account={accountWith()} />);

    expect(card("frozen").getByText(`0 TRX`)).toBeInTheDocument();
  });

  it("shows the bandwidth left once the used one is deducted", () => {
    const account = accountWith({
      bandwidth: {
        freeLimit: new BigNumber(600),
        gainedLimit: new BigNumber(100),
        freeUsed: new BigNumber(150),
        gainedUsed: new BigNumber(50),
      },
    } as unknown as Resources);

    render(<AccountDetailBalances account={account} />);

    expect(card("bandwidth").getByText("500")).toBeInTheDocument();
  });

  it("shows the energy", () => {
    render(<AccountDetailBalances account={accountWith({ energy: new BigNumber(42) })} />);

    expect(card("energy").getByText("42")).toBeInTheDocument();
  });

  it("shows a dash for the bandwidth and the energy when there is none", () => {
    render(<AccountDetailBalances account={accountWith()} />);

    expect(card("bandwidth").getByText("–")).toBeInTheDocument();
    expect(card("energy").getByText("–")).toBeInTheDocument();
  });

  it("renders nothing while the unit of the account is not known", () => {
    jest.mocked(useMaybeAccountUnit).mockReturnValueOnce(undefined);

    const { container } = render(<AccountDetailBalances account={accountWith()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a token account", () => {
    const { container } = render(
      <AccountDetailBalances account={{ type: "TokenAccount" } as TokenAccount} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
