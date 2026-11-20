import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, ZcashTransferType } from "@ledgerhq/coin-zcash/types";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import SendModalTitle from "../SendModalTitle";

const baseAccount = createFixtureAccount();

const buildAccount = (currencyId: string) =>
  ({
    ...baseAccount,
    currency: { ...baseAccount.currency, id: currencyId } as CryptoCurrency,
  }) as unknown as Account;

const buildTransaction = (transferType?: ZcashTransferType) =>
  ({ family: "zcash", transferType }) as unknown as Transaction;

const renderTitle = ({
  currencyId = "zcash",
  transaction,
  flagEnabled = true,
}: {
  currencyId?: string;
  transaction: Transaction | null | undefined;
  flagEnabled?: boolean;
}) =>
  render(
    <SendModalTitle
      account={buildAccount(currencyId)}
      transaction={transaction}
      fallback="Fallback title"
    />,
    { initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }) },
  );

describe("zcash SendModalTitle", () => {
  it.each<[ZcashTransferType, string]>([
    ["transparent", "Public Send"],
    ["transparent-to-shielded", "Public to Private Send"],
    ["shielded-to-transparent", "Private to Public Send"],
    ["shielded", "Private Send"],
  ])("shows the %s transfer title", (transferType, title) => {
    renderTitle({ transaction: buildTransaction(transferType) });

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.queryByText("Fallback title")).not.toBeInTheDocument();
  });

  it("shows the transfer title on zcash_testnet", () => {
    renderTitle({ currencyId: "zcash_testnet", transaction: buildTransaction("shielded") });

    expect(screen.getByText("Private Send")).toBeInTheDocument();
  });

  it("shows the fallback when the zcashShielded flag is off", () => {
    renderTitle({ transaction: buildTransaction("shielded"), flagEnabled: false });

    expect(screen.getByText("Fallback title")).toBeInTheDocument();
    expect(screen.queryByText("Private Send")).not.toBeInTheDocument();
  });

  it("shows the fallback for a currency the zcash routing does not cover", () => {
    renderTitle({ currencyId: "bitcoin", transaction: buildTransaction("shielded") });

    expect(screen.getByText("Fallback title")).toBeInTheDocument();
  });

  it.each([null, undefined])("shows the fallback without a transaction (%s)", transaction => {
    renderTitle({ transaction });

    expect(screen.getByText("Fallback title")).toBeInTheDocument();
  });

  it("shows the fallback when the transaction has no transfer type", () => {
    renderTitle({ transaction: buildTransaction() });

    expect(screen.getByText("Fallback title")).toBeInTheDocument();
  });
});
