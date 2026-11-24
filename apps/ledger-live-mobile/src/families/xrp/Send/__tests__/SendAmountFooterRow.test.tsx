import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { SendAmountFooterRow } from "../SendAmountFooterRow";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_IOU_TOKEN_ACCOUNT,
} from "../../__mocks__/account.mock";

const mockCalculateCountervalue = jest.fn();
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculateCountervalueCallback: () => mockCalculateCountervalue,
}));

const xrpTransaction = {
  family: "xrp",
  amount: new BigNumber(100),
  recipient: "rRecipient",
} as Transaction;
const tokenTransaction = { ...xrpTransaction, subAccountId: XRP_IOU_TOKEN_ACCOUNT.id };

const makeStatus = (totalSpent: number) =>
  ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(12),
    amount: new BigNumber(100),
    totalSpent: new BigNumber(totalSpent),
  }) as TransactionStatus;

describe("xrp SendAmountFooterRow", () => {
  beforeEach(() => {
    mockCalculateCountervalue.mockReturnValue(null);
  });

  it("shows the issuer fee in the token's unit", () => {
    render(
      <SendAmountFooterRow
        account={XRP_ACCOUNT_WITH_TOKEN}
        transaction={tokenTransaction}
        status={makeStatus(102)}
      />,
    );

    expect(screen.getByText("Issuer fee")).toBeVisible();
    expect(screen.getByTestId("xrp-send-issuer-fee-value")).toHaveTextContent("2 RLUSD");
  });

  it("shows the countervalue first and the token amount next to it", () => {
    mockCalculateCountervalue.mockReturnValue(new BigNumber(150));

    render(
      <SendAmountFooterRow
        account={XRP_ACCOUNT_WITH_TOKEN}
        transaction={tokenTransaction}
        status={makeStatus(102)}
      />,
    );

    expect(screen.getByTestId("xrp-send-issuer-fee-value")).toHaveTextContent(/1\.50/);
    expect(screen.getByTestId("xrp-send-issuer-fee-secondary-value")).toHaveTextContent("2 RLUSD");
  });

  it("shows nothing when the token has no issuer fee", () => {
    render(
      <SendAmountFooterRow
        account={XRP_ACCOUNT_WITH_TOKEN}
        transaction={tokenTransaction}
        status={makeStatus(100)}
      />,
    );

    expect(screen.queryByTestId("xrp-send-issuer-fee-row")).toBeNull();
  });

  it("shows nothing on an XRP send, whose extra spending is the network fee", () => {
    render(
      <SendAmountFooterRow
        account={XRP_ACCOUNT}
        transaction={xrpTransaction}
        status={makeStatus(112)}
      />,
    );

    expect(screen.queryByTestId("xrp-send-issuer-fee-row")).toBeNull();
  });
});
