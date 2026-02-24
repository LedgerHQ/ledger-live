import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Operation } from "@ledgerhq/types-live";
import operationDetails from "../operationDetails";

const { amountCellExtra, OperationDetailsExtra } = operationDetails;

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

const zecUnit = {
  code: "ZEC",
  name: "Zcash",
  magnitude: 8,
};

const btcUnit = {
  code: "BTC",
  name: "Bitcoin",
  magnitude: 8,
};

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

  describe("amountCellExtra", () => {
    it.each(ZCASH_OPERATION_TYPES)(
      "should render amountCellExtra for Zcash with %s operation type",
      operationType => {
        const operation = createOperation(operationType);
        const AmountCellExtraComponent = amountCellExtra[operationType];

        expect(AmountCellExtraComponent).toBeDefined();

        render(
          <AmountCellExtraComponent
            operation={operation}
            currency={getCryptoCurrencyById("zcash")}
            unit={zecUnit}
          />,
        );

        const expectedLabels: Record<string, string> = {
          IN: "Transparent",
          OUT: "Transparent",
          SHIELDED_TX_SAPLING_IN: "🛡 Private (Sapling)",
          SHIELDED_TX_SAPLING_OUT: "🛡 Private (Sapling)",
          SHIELDED_TX_ORCHARD_IN: "🛡 Private (Orchard)",
          SHIELDED_TX_ORCHARD_OUT: "🛡 Private (Orchard)",
        };

        expect(screen.getByText(expectedLabels[operationType])).toBeInTheDocument();
      },
    );

    it("should return null for Bitcoin account and operation", () => {
      const operation = createOperation("IN");
      const AmountCellExtraComponent = amountCellExtra.IN;

      const { container } = render(
        <AmountCellExtraComponent
          operation={operation}
          currency={getCryptoCurrencyById("bitcoin")}
          unit={btcUnit}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
