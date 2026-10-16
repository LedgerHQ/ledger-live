import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type {
  BitcoinAccount,
  BitcoinOutput,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { render, screen } from "tests/testSetup";
import CoinControlModal from "../CoinControlModal";

// The bridge's updateTransaction merges the patch onto the transaction.
// Mocking it also avoids the Suspense boundary that useAccountBridge (React `use`) requires.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  }),
}));

const mockSelect = jest.fn();
jest.mock("~/renderer/components/Select", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockSelect(props);
    return null;
  },
}));

type SelectProps = {
  value: { value: string } | undefined;
  onChange: (item: { value: string } | null) => void;
};

const utxo = (
  hash: string,
  outputIndex: number,
  blockHeight: number | null,
  value: number,
): BitcoinOutput => ({
  hash,
  outputIndex,
  blockHeight,
  address: `bc1q${hash}address`,
  value: new BigNumber(value),
  rbf: false,
  isChange: false,
});

const account: BitcoinAccount = {
  ...genAccount("bitcoin-coin-control", {
    currency: getCryptoCurrencyById("bitcoin"),
    operationsSize: 0,
  }),
  blockHeight: 100,
  bitcoinResources: {
    utxos: [
      utxo("aaa", 0, 90, 1000),
      utxo("bbb", 1, 95, 2000),
      utxo("ddd", 2, 96, 3000),
      utxo("ccc", 3, null, 4000),
    ],
  },
};

const familySpecificData = {
  rbf: true,
  utxoStrategy: { strategy: 2 as const, excludeUTXOs: [{ hash: "bbb", outputIndex: 1 }] },
};

const estimatedTransaction: Transaction = {
  family: "bitcoin",
  amount: new BigNumber(500),
  recipient: "bc1qrecipient",
  familySpecificData,
  feeParameters: {
    inputs: [{ txid: "aaa", vout: 0, value: "1000", address: "bc1qaaaaddress" }],
    outputs: [
      { address: "bc1qrecipient", value: "500", isChange: false },
      { address: "bc1qchange", value: "4321", isChange: true },
    ],
  },
};

const status: TransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(100),
  amount: new BigNumber(500),
  totalSpent: new BigNumber(600),
};

const renderModal = (transaction: Transaction) => {
  const onChange = jest.fn();
  const updateTransaction = jest.fn();
  return {
    onChange,
    updateTransaction,
    ...render(
      <CoinControlModal
        isOpened
        onClose={jest.fn()}
        account={account}
        transaction={transaction}
        status={status}
        onChange={onChange}
        updateTransaction={updateTransaction}
      />,
    ),
  };
};

const lastSelectProps = (): SelectProps =>
  mockSelect.mock.calls[mockSelect.mock.calls.length - 1][0];

describe("bitcoin CoinControlModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const node = document.createElement("div");
    node.id = "modals";
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  it("marks the coins the last estimation selected and shows its change", () => {
    renderModal(estimatedTransaction);

    expect(screen.getAllByText("SELECTED")).toHaveLength(1);
    expect(screen.getByText(/0\.00004321/)).toBeInTheDocument();
  });

  it("shows no selected coin nor change before any estimation", () => {
    renderModal({ ...estimatedTransaction, feeParameters: undefined });

    expect(screen.queryByText("SELECTED")).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.00004321/)).not.toBeInTheDocument();
  });

  it("excludes a coin, keeping the other user choices", async () => {
    const { user, updateTransaction } = renderModal(estimatedTransaction);

    await user.click(screen.getByText("#0 of"));

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updater = updateTransaction.mock.calls[0][0];
    expect(updater(estimatedTransaction)).toEqual({
      ...estimatedTransaction,
      familySpecificData: {
        rbf: true,
        utxoStrategy: {
          strategy: 2,
          excludeUTXOs: [
            { hash: "bbb", outputIndex: 1 },
            { hash: "aaa", outputIndex: 0 },
          ],
        },
      },
    });
  });

  it("includes back an excluded coin", async () => {
    const { user, updateTransaction } = renderModal(estimatedTransaction);

    await user.click(screen.getByText("#1 of"));

    const updater = updateTransaction.mock.calls[0][0];
    expect(updater(estimatedTransaction)).toEqual({
      ...estimatedTransaction,
      familySpecificData: { rbf: true, utxoStrategy: { strategy: 2, excludeUTXOs: [] } },
    });
  });

  it("does not toggle a pending coin", async () => {
    const { user, updateTransaction } = renderModal(estimatedTransaction);

    await user.click(screen.getByText("#3 of"));

    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it("selects the picking strategy of the transaction", () => {
    renderModal(estimatedTransaction);

    expect(lastSelectProps().value?.value).toBe("MERGE_OUTPUTS");
  });

  it("changes the picking strategy, keeping the exclusions and the other user choices", () => {
    const { onChange } = renderModal(estimatedTransaction);

    lastSelectProps().onChange({ value: "OPTIMIZE_SIZE" });
    expect(onChange).toHaveBeenLastCalledWith({
      ...estimatedTransaction,
      familySpecificData: {
        ...familySpecificData,
        utxoStrategy: { ...familySpecificData.utxoStrategy, strategy: 1 },
      },
    });

    lastSelectProps().onChange(null);
    expect(onChange).toHaveBeenLastCalledWith({
      ...estimatedTransaction,
      familySpecificData: {
        ...familySpecificData,
        utxoStrategy: { ...familySpecificData.utxoStrategy, strategy: 0 },
      },
    });
  });

  it("defaults the picking strategy of a transaction without user choices", () => {
    const { onChange } = renderModal({ ...estimatedTransaction, familySpecificData: undefined });

    expect(lastSelectProps().value?.value).toBe("DEEP_OUTPUTS_FIRST");

    lastSelectProps().onChange({ value: "MERGE_OUTPUTS" });
    expect(onChange).toHaveBeenLastCalledWith({
      ...estimatedTransaction,
      familySpecificData: { utxoStrategy: { strategy: 2, excludeUTXOs: [] } },
    });
  });
});
