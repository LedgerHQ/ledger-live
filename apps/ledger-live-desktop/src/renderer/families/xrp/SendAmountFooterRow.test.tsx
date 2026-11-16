import React from "react";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { render, screen } from "tests/testSetup";
import SendAmountFooterRow from "./SendAmountFooterRow";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT } from "./__mocks__/account.mock";

const mockCalculateCountervalue = jest.fn();
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculateCountervalueCallback: () => mockCalculateCountervalue,
}));

const account = { ...XRP_ACCOUNT, subAccounts: [XRP_IOU_TOKEN_ACCOUNT] };
const tokenTransaction = { family: "xrp", subAccountId: XRP_IOU_TOKEN_ACCOUNT.id } as Transaction;

function makeStatus(amount: number, totalSpent: number) {
  return {
    errors: {},
    warnings: {},
    amount: new BigNumber(amount),
    totalSpent: new BigNumber(totalSpent),
    estimatedFees: new BigNumber(12),
  } as TransactionStatus;
}

describe("xrp SendAmountFooterRow", () => {
  beforeEach(() => {
    mockCalculateCountervalue.mockReturnValue(null);
  });

  it("shows the issuer fee in the token's unit", () => {
    render(
      <SendAmountFooterRow
        account={account}
        transaction={tokenTransaction}
        status={makeStatus(100, 102)}
      />,
    );

    expect(screen.getByText("Issuer fee")).toBeVisible();
    expect(screen.getByText("2 RLUSD")).toBeVisible();
  });

  it("shows the countervalue first and the token amount next to it", () => {
    mockCalculateCountervalue.mockReturnValue(new BigNumber(150));

    render(
      <SendAmountFooterRow
        account={account}
        transaction={tokenTransaction}
        status={makeStatus(100, 102)}
      />,
    );

    expect(screen.getByTestId("xrp-send-issuer-fee-row")).toHaveTextContent(/1\.50.*2 RLUSD/);
  });

  it("shows nothing when the token has no issuer fee", () => {
    render(
      <SendAmountFooterRow
        account={account}
        transaction={tokenTransaction}
        status={makeStatus(100, 100)}
      />,
    );

    expect(screen.queryByTestId("xrp-send-issuer-fee-row")).not.toBeInTheDocument();
  });

  it("shows nothing on an XRP send", () => {
    render(
      <SendAmountFooterRow
        account={account}
        transaction={{ family: "xrp" } as Transaction}
        status={makeStatus(100, 112)}
      />,
    );

    expect(screen.queryByTestId("xrp-send-issuer-fee-row")).not.toBeInTheDocument();
  });
});
