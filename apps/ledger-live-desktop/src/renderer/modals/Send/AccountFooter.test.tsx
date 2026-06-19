import React from "react";
import { render, screen } from "tests/testSetup";
import BigNumber from "bignumber.js";
import AccountFooter from "./AccountFooter";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createMockAccount } from "../../../mvvm/features/Send/screens/Recipient/__integrations__/__fixtures__/accounts";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { TokenAccount } from "@ledgerhq/types-live";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

jest.mock("~/renderer/components/FormattedVal", () => ({
  __esModule: true,
  default: ({
    val,
    unit,
    showCode,
  }: {
    val: BigNumber;
    unit: { code: string };
    showCode?: boolean;
  }) => (
    <div data-testid="formatted-val">
      {val.toFixed()} {showCode && unit?.code}
    </div>
  ),
}));

jest.mock("~/renderer/components/CounterValue", () => ({
  __esModule: true,
  default: ({ currency }: { currency: { ticker: string } }) => (
    <div data-testid="counter-value">{currency?.ticker}</div>
  ),
}));

jest.mock("~/renderer/components/CurrencyBadge", () => ({
  CurrencyCircleIcon: ({ currency }: { currency: { ticker: string } }) => (
    <div data-testid="currency-circle-icon" data-ticker={currency?.ticker} />
  ),
}));

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: () => null,
}));

describe("AccountFooter", () => {
  const status = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(603),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  } as TransactionStatus;

  it("shows the native fees currency icon when sending from a token sub-account", () => {
    const tezos = getCryptoCurrencyById("tezos");
    const wusdcToken = {
      type: "TokenCurrency" as const,
      id: "tezos/fa2/usdc",
      contractAddress: "KT1",
      parentCurrency: tezos,
      name: "Wrapped USDC",
      ticker: "wUSDC",
      disableCountervalue: false,
      units: [{ name: "wUSDC", code: "wUSDC", magnitude: 6 }],
    };
    const tokenAccount = {
      type: "TokenAccount" as const,
      id: "wusdc-sub-account-id",
      token: wusdcToken,
      balance: new BigNumber(1_000_000),
      spendableBalance: new BigNumber(1_000_000),
    } as unknown as TokenAccount;
    const parentAccount = createMockAccount({ id: "tezos-acc", currency: tezos });

    render(<AccountFooter account={tokenAccount} parentAccount={parentAccount} status={status} />);

    expect(screen.getByTestId("currency-circle-icon")).toHaveAttribute("data-ticker", "XTZ");
    expect(screen.getByTestId("formatted-val")).toHaveTextContent("XTZ");
  });

  it("shows the account currency icon when sending from a main account", () => {
    const tezos = getCryptoCurrencyById("tezos");
    const account = createMockAccount({ id: "tezos-acc", currency: tezos });

    render(<AccountFooter account={account} status={status} />);

    expect(screen.getByTestId("currency-circle-icon")).toHaveAttribute("data-ticker", "XTZ");
    expect(screen.getByTestId("formatted-val")).toHaveTextContent("XTZ");
    expect(screen.getByTestId("counter-value")).toHaveTextContent("XTZ");
  });
});
