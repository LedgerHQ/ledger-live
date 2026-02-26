import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Operation } from "@ledgerhq/types-live";
import operationDetails from "../operationDetails";

const { OperationDetailsExtra } = operationDetails;

const ZCASH_OPERATION_TYPES = [
  "IN",
  "OUT",
  "SHIELDED_TX_SAPLING_IN",
  "SHIELDED_TX_SAPLING_OUT",
  "SHIELDED_TX_ORCHARD_IN",
  "SHIELDED_TX_ORCHARD_OUT",
] as const;

const createOperation = (type: string): Operation =>
  ({
    id: `op-${type}-1`,
    hash: "0xhash",
    type,
    value: new BigNumber(1000),
    fee: new BigNumber(100),
    senders: ["sender1"],
    recipients: ["recipient1"],
    blockHash: null,
    blockHeight: null,
    accountId: "account-1",
    date: new Date(),
    extra: {},
  }) as Operation;

const zcashAccount = {
  ...createFixtureAccount(),
  currency: getCryptoCurrencyById("zcash"),
};

const bitcoinAccount = createFixtureAccount();

describe("Bitcoin operationDetails", () => {
  describe("OperationDetailsExtra", () => {
    it.each(ZCASH_OPERATION_TYPES)(
      "should render OperationDetailsExtra for Zcash account with %s operation type",
      operationType => {
        const operation = createOperation(operationType);
        render(<OperationDetailsExtra account={zcashAccount} operation={operation} />);

        expect(screen.getByText("Transaction type")).toBeInTheDocument();
      },
    );

    it("should return null for Bitcoin account and operation", () => {
      const operation = createOperation("IN");
      const { container } = render(
        <OperationDetailsExtra account={bitcoinAccount} operation={operation} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
