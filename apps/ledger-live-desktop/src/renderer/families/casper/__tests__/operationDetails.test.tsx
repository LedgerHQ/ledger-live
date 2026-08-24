import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { CasperAccount, CasperOperation } from "@ledgerhq/live-common/families/casper/types";
import operationDetails from "../operationDetails";

const { OperationDetailsExtra } = operationDetails;

const buildOperation = (transferId?: string): CasperOperation =>
  ({
    id: "casper:test-op",
    hash: "0xhash",
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: ["casperSender"],
    recipients: ["casperRecipient"],
    blockHeight: 100,
    blockHash: null,
    accountId: "casper:test-account",
    date: new Date("2026-01-01"),
    hasFailed: false,
    extra: transferId != null ? { transferId } : {},
  }) as unknown as CasperOperation;

const account = {} as CasperAccount;

describe("Casper OperationDetailsExtra", () => {
  it("renders the transfer id section when extra.transferId is set", () => {
    render(
      <OperationDetailsExtra
        account={account}
        operation={buildOperation("123456789")}
        type="OUT"
      />,
    );

    expect(screen.getByText("123456789")).toBeInTheDocument();
  });

  it("renders nothing when extra.transferId is absent", () => {
    const { container } = render(
      <OperationDetailsExtra account={account} operation={buildOperation()} type="OUT" />,
    );

    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
