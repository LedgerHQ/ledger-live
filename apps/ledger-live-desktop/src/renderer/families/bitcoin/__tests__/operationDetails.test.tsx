import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { TFunction } from "i18next";
import { Operation } from "@ledgerhq/types-live";
import { DataList } from "~/renderer/drawers/OperationDetails";
import operationDetails from "../operationDetails";

const { OperationDetailsExtra, addressCell } = operationDetails;

const mockT = ((key: string) => key) as TFunction;

const ZCASH_OPERATION_TYPES = [
  "SHIELDED_TX_SAPLING_IN",
  "SHIELDED_TX_SAPLING_OUT",
  "SHIELDED_TX_ORCHARD_IN",
  "SHIELDED_TX_ORCHARD_OUT",
] as const;

const createOperation = (
  type: string,
  options: { senders?: string[]; recipients?: string[] } = {},
): Operation =>
  ({
    id: `op-${type}-1`,
    hash: "0xhash",
    type,
    value: new BigNumber(1000),
    fee: new BigNumber(100),
    senders: options.senders ?? ["sender1"],
    recipients: options.recipients ?? ["recipient1"],
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

describe("Zcash operationDetails", () => {
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

const zcashCurrency = getCryptoCurrencyById("zcash");

describe("addressCell", () => {
  describe("Zcash shielded operations", () => {
    it("should show the address when discreet mode is off (sapling)", () => {
      const address = "zs1abc123def456";
      const operation = createOperation("SHIELDED_TX_SAPLING_IN", {
        senders: [address],
      });

      const AddressCell = addressCell["SHIELDED_TX_SAPLING_IN"];

      const { container } = render(<AddressCell operation={operation} currency={zcashCurrency} />, {
        initialState: {
          settings: {
            discreetMode: false,
          },
        },
      });

      expect(container).toHaveTextContent(address);
    });

    it("should show asterisks instead of the address when discreet mode is on (sapling)", () => {
      const address = "zs1abc123def456";
      const operation = createOperation("SHIELDED_TX_SAPLING_OUT", {
        recipients: [address],
      });

      const AddressCell = addressCell["SHIELDED_TX_SAPLING_OUT"];

      const { container } = render(<AddressCell operation={operation} currency={zcashCurrency} />, {
        initialState: {
          settings: {
            discreetMode: true,
          },
        },
      });

      const asterisks = "*".repeat(address.length);
      expect(screen.getByText(asterisks)).toBeInTheDocument();
      expect(container).not.toHaveTextContent(address);
    });

    it("should show the address when discreet mode is off (orchard)", () => {
      const address = "zs1abc123def456";
      const operation = createOperation("SHIELDED_TX_ORCHARD_IN", {
        senders: [address],
      });

      const AddressCell = addressCell["SHIELDED_TX_ORCHARD_IN"];

      const { container } = render(<AddressCell operation={operation} currency={zcashCurrency} />, {
        initialState: {
          settings: {
            discreetMode: false,
          },
        },
      });

      expect(container).toHaveTextContent(address);
    });

    it("should show asterisks instead of the address when discreet mode is on (orchard)", () => {
      const address = "zs1abc123def456";
      const operation = createOperation("SHIELDED_TX_ORCHARD_OUT", {
        recipients: [address],
      });

      const AddressCell = addressCell["SHIELDED_TX_ORCHARD_OUT"];

      const { container } = render(<AddressCell operation={operation} currency={zcashCurrency} />, {
        initialState: {
          settings: {
            discreetMode: true,
          },
        },
      });

      const asterisks = "*".repeat(address.length);
      expect(screen.getByText(asterisks)).toBeInTheDocument();
      expect(container).not.toHaveTextContent(address);
    });
  });
});

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");

describe("splitAddress", () => {
  describe("Zcash shielded operations", () => {
    it.each(ZCASH_OPERATION_TYPES)(
      "should show the address when discreet mode is off for %s",
      operationType => {
        const address = "zs1abc123def456";
        const operation = createOperation(operationType, {
          senders: operationType.includes("IN") ? [address] : undefined,
          recipients: operationType.includes("OUT") ? [address] : undefined,
        });

        const { container } = render(
          <DataList
            lines={[address]}
            t={mockT}
            cryptoCurrency={zcashCurrency}
            operation={operation}
          />,
          {
            initialState: {
              settings: {
                discreetMode: false,
              },
            },
          },
        );

        expect(container).toHaveTextContent(address);
      },
    );

    it.each(ZCASH_OPERATION_TYPES)(
      "should show asterisks when discreet mode is on for %s",
      operationType => {
        const address = "zs1abc123def456";
        const operation = createOperation(operationType, {
          senders: operationType.includes("IN") ? [address] : undefined,
          recipients: operationType.includes("OUT") ? [address] : undefined,
        });

        const { container } = render(
          <DataList
            lines={[address]}
            t={mockT}
            cryptoCurrency={zcashCurrency}
            operation={operation}
          />,
          {
            initialState: {
              settings: {
                discreetMode: true,
              },
            },
          },
        );

        const asterisks = "*".repeat(address.length);
        expect(container).toHaveTextContent(asterisks);
        expect(container).not.toHaveTextContent(address);
      },
    );
  });

  describe("Bitcoin IN and OUT operations", () => {
    it("should show recipient address for IN operation regardless of discreet mode", () => {
      const recipientAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
      const operation = createOperation("IN", { recipients: [recipientAddress] });

      const { container } = render(
        <DataList
          lines={[recipientAddress]}
          t={mockT}
          cryptoCurrency={bitcoinCurrency}
          operation={operation}
        />,
        {
          initialState: {
            settings: {
              discreetMode: false,
            },
          },
        },
      );

      expect(container).toHaveTextContent(recipientAddress);
    });

    it("should show recipient address for IN operation when discreet mode is on (no effect)", () => {
      const recipientAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
      const operation = createOperation("IN", { recipients: [recipientAddress] });

      const { container } = render(
        <DataList
          lines={[recipientAddress]}
          t={mockT}
          cryptoCurrency={bitcoinCurrency}
          operation={operation}
        />,
        {
          initialState: {
            settings: {
              discreetMode: true,
            },
          },
        },
      );

      expect(container).toHaveTextContent(recipientAddress);
    });

    it("should show sender address for OUT operation regardless of discreet mode", () => {
      const senderAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
      const operation = createOperation("OUT", { senders: [senderAddress] });

      const { container } = render(
        <DataList
          lines={[senderAddress]}
          t={mockT}
          cryptoCurrency={bitcoinCurrency}
          operation={operation}
        />,
        {
          initialState: {
            settings: {
              discreetMode: false,
            },
          },
        },
      );

      expect(container).toHaveTextContent(senderAddress);
    });

    it("should show sender address for OUT operation when discreet mode is on (no effect)", () => {
      const senderAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
      const operation = createOperation("OUT", { senders: [senderAddress] });

      const { container } = render(
        <DataList
          lines={[senderAddress]}
          t={mockT}
          cryptoCurrency={bitcoinCurrency}
          operation={operation}
        />,
        {
          initialState: {
            settings: {
              discreetMode: true,
            },
          },
        },
      );

      expect(container).toHaveTextContent(senderAddress);
    });
  });
});
