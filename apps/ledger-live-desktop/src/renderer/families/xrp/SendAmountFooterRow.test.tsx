import React from "react";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { render, screen } from "tests/testSetup";
import { HttpResponse, http, server } from "tests/server";
import SendAmountFooterRow from "./SendAmountFooterRow";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT } from "./__mocks__/account.mock";

const mockCalculateCountervalue = jest.fn();
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculateCountervalueCallback: () => mockCalculateCountervalue,
}));

const XRPL_TESTNET_NODE = "https://s.altnet.rippletest.net:51234";

// coin-xrp caches each issuer's account root: this file's issuer has a 1% fee
const feeToken = {
  ...XRP_IOU_TOKEN_ACCOUNT.token,
  contractAddress: "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
};
const tokenAccount = { ...XRP_IOU_TOKEN_ACCOUNT, token: feeToken };

const account = { ...XRP_ACCOUNT, subAccounts: [tokenAccount] };
const tokenTransaction = {
  family: "xrp",
  subAccountId: tokenAccount.id,
  amount: new BigNumber(100),
} as Transaction;

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
    server.use(
      http.post(XRPL_TESTNET_NODE, () => {
        const node = { LedgerEntryType: "AccountRoot", Flags: 0, TransferRate: 1_010_000_000 };

        return HttpResponse.json({ result: { node, account_data: node, status: "success" } });
      }),
    );
  });

  it("holds the issuer fee row while the fee of a token with one is computed", async () => {
    render(
      <SendAmountFooterRow
        account={account}
        transaction={tokenTransaction}
        status={makeStatus(100, 100)}
        bridgePending
      />,
    );

    expect(await screen.findByTestId("xrp-send-issuer-fee-loading")).toBeInTheDocument();
    expect(screen.getByText("Issuer fee")).toBeVisible();
  });

  it("holds no issuer fee row while no amount is set", async () => {
    const { rerender } = render(
      <SendAmountFooterRow
        account={account}
        transaction={tokenTransaction}
        status={makeStatus(100, 100)}
        bridgePending
      />,
    );
    await screen.findByTestId("xrp-send-issuer-fee-loading");

    rerender(
      <SendAmountFooterRow
        account={account}
        transaction={{ ...tokenTransaction, amount: new BigNumber(0) }}
        status={makeStatus(0, 0)}
        bridgePending
      />,
    );

    expect(screen.queryByTestId("xrp-send-issuer-fee-row")).not.toBeInTheDocument();
  });

  it("holds the issuer fee row while Max is computed", async () => {
    render(
      <SendAmountFooterRow
        account={account}
        transaction={{ ...tokenTransaction, amount: new BigNumber(0), useAllAmount: true }}
        status={makeStatus(0, 0)}
        bridgePending
      />,
    );

    expect(await screen.findByTestId("xrp-send-issuer-fee-loading")).toBeInTheDocument();
  });

  it("shows the computed issuer fee once the bridge is done", async () => {
    const { rerender } = render(
      <SendAmountFooterRow
        account={account}
        transaction={tokenTransaction}
        status={makeStatus(100, 100)}
        bridgePending
      />,
    );
    await screen.findByTestId("xrp-send-issuer-fee-loading");

    rerender(
      <SendAmountFooterRow
        account={account}
        transaction={tokenTransaction}
        status={makeStatus(100, 101)}
        bridgePending={false}
      />,
    );

    expect(screen.getByText("1 RLUSD")).toBeVisible();
    expect(screen.queryByTestId("xrp-send-issuer-fee-loading")).not.toBeInTheDocument();
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
