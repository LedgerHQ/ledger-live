import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { DustLimit } from "./errors";
import { createFixtureAccount } from "./fixtures/common.fixtures";
import { createTransaction } from "./createTransaction";
import transactionModule, {
  formatTransaction,
  formatTransactionStatus,
  fromTransactionRaw,
  toTransactionRaw,
  toTransactionStatusRaw,
} from "./transaction";
import type {
  BitcoinAccount,
  BitcoinInput,
  BitcoinOutput,
  Transaction,
  TransactionRaw,
  TransactionStatus,
} from "./types";

const RECIPIENT = "BC1QQMXQDRKXGX6SWRVJL9L2E6SZVVKG45ALL5U4FL";
const PREVIOUS_TX_HASH = "0a29f6b6bc8799a849072a3c3d804e8ce487c7675c3b833da48e5640e08dbe85";

const rawTransaction: TransactionRaw = {
  family: "bitcoin",
  recipient: RECIPIENT,
  amount: "997",
  useAllAmount: false,
  feePerByte: "2",
  feesStrategy: "medium",
  rbf: true,
  utxoStrategy: { strategy: 1, excludeUTXOs: [{ hash: PREVIOUS_TX_HASH, outputIndex: 3 }] },
  networkInfo: {
    family: "bitcoin",
    feeItems: {
      items: [
        { key: "0", speed: "high", feePerByte: "3" },
        { key: "1", speed: "standard", feePerByte: "2" },
        { key: "2", speed: "low", feePerByte: "1" },
      ],
      defaultFeePerByte: "1",
    },
    relayFeePerByte: "1",
  },
  opReturnData: Buffer.from("charley loves heidi", "utf-8"),
  replaceTxId: PREVIOUS_TX_HASH,
};

const transaction: Transaction = {
  family: "bitcoin",
  recipient: RECIPIENT,
  amount: new BigNumber(997),
  useAllAmount: false,
  feePerByte: new BigNumber(2),
  feesStrategy: "medium",
  rbf: true,
  utxoStrategy: { strategy: 1, excludeUTXOs: [{ hash: PREVIOUS_TX_HASH, outputIndex: 3 }] },
  networkInfo: {
    family: "bitcoin",
    feeItems: {
      items: [
        { key: "0", speed: "high", feePerByte: new BigNumber(3) },
        { key: "1", speed: "standard", feePerByte: new BigNumber(2) },
        { key: "2", speed: "low", feePerByte: new BigNumber(1) },
      ],
      defaultFeePerByte: new BigNumber(1),
    },
    relayFeePerByte: new BigNumber(1),
  },
  opReturnData: Buffer.from("charley loves heidi", "utf-8"),
  replaceTxId: PREVIOUS_TX_HASH,
};

const txInput: BitcoinInput = {
  address: "bc1q8vp7v5wyv8nvhsh5p2dvkgalep4q325kd5xk4e",
  value: new BigNumber(100_000),
  previousTxHash: PREVIOUS_TX_HASH,
  previousOutputIndex: 2,
};

const txOutput: BitcoinOutput = {
  hash: PREVIOUS_TX_HASH,
  outputIndex: 1,
  blockHeight: 99_990,
  address: "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe",
  value: new BigNumber(98_751),
  rbf: true,
  isChange: true,
};

const status: TransactionStatus = {
  errors: { dustLimit: new DustLimit() },
  warnings: {},
  estimatedFees: new BigNumber(250),
  amount: new BigNumber(997),
  totalSpent: new BigNumber(1_247),
  txInputs: [txInput],
  txOutputs: [txOutput],
  opReturnData: "charley loves heidi",
  changeAddress: "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe",
};

describe("bitcoin transaction serialization", () => {
  it("builds the transaction from its raw form", () => {
    expect(fromTransactionRaw(rawTransaction)).toEqual(transaction);
  });

  it("builds the raw form from the transaction", () => {
    expect(toTransactionRaw(transaction)).toEqual(rawTransaction);
  });

  it("restores the same transaction after a round trip", () => {
    expect(fromTransactionRaw(toTransactionRaw(transaction))).toEqual(transaction);
  });

  it("restores an empty transaction after a round trip", () => {
    const empty = createTransaction(createFixtureAccount());

    expect(fromTransactionRaw(toTransactionRaw(empty))).toEqual(empty);
  });

  it("restores a transaction with an amount and a recipient after a round trip", () => {
    const account = createFixtureAccount();
    const sent: Transaction = {
      ...createTransaction(account),
      amount: new BigNumber(1000),
      recipient: account.freshAddress,
    };

    expect(fromTransactionRaw(toTransactionRaw(sent))).toEqual(sent);
  });

  it("keeps the fee per byte and the network info of a transaction that has none", () => {
    const raw: TransactionRaw = {
      ...rawTransaction,
      feePerByte: null,
      networkInfo: null,
    };

    expect(toTransactionRaw(fromTransactionRaw(raw))).toEqual(raw);
  });

  it("reads a missing relay fee as zero", () => {
    const withoutRelayFee: TransactionRaw = {
      ...rawTransaction,
      networkInfo: {
        family: "bitcoin",
        feeItems: { items: [], defaultFeePerByte: "1" },
      },
    };

    expect(fromTransactionRaw(withoutRelayFee).networkInfo?.relayFeePerByte).toEqual(
      new BigNumber(0),
    );
  });

  it("exposes the serializers on the default export", () => {
    expect(transactionModule.toTransactionRaw(transaction)).toEqual(rawTransaction);
  });
});

describe("bitcoin transaction status serialization", () => {
  it("serializes the amounts, the inputs and the outputs", () => {
    expect(toTransactionStatusRaw(status)).toMatchObject({
      estimatedFees: "250",
      amount: "997",
      totalSpent: "1247",
      txInputs: [[txInput.address, "100000", PREVIOUS_TX_HASH, 2]],
      txOutputs: [[PREVIOUS_TX_HASH, 1, 99_990, txOutput.address, "98751", 1, 1]],
      opReturnData: "charley loves heidi",
      changeAddress: status.changeAddress,
    });
  });

  it("restores the status after a round trip", () => {
    const restored = transactionModule.fromTransactionStatusRaw(toTransactionStatusRaw(status));

    expect(restored).toMatchObject({
      errors: { dustLimit: expect.objectContaining({ name: "DustLimit" }) },
      estimatedFees: status.estimatedFees,
      amount: status.amount,
      totalSpent: status.totalSpent,
      txInputs: status.txInputs,
      txOutputs: status.txOutputs,
      opReturnData: status.opReturnData,
      changeAddress: status.changeAddress,
    });
  });

  it("leaves the inputs and the outputs undefined when the status has none", () => {
    const withoutUtxos: TransactionStatus = {
      ...status,
      txInputs: undefined,
      txOutputs: undefined,
    };

    const restored = transactionModule.fromTransactionStatusRaw(
      toTransactionStatusRaw(withoutUtxos),
    );

    expect({ txInputs: restored.txInputs, txOutputs: restored.txOutputs }).toEqual({
      txInputs: undefined,
      txOutputs: undefined,
    });
  });
});

describe("bitcoin transaction formatting", () => {
  const account: BitcoinAccount = {
    ...createFixtureAccount(),
    currency: getCryptoCurrencyById("bitcoin"),
  };

  it("formats a send with its amount, recipient, fees and options", () => {
    expect(formatTransaction(transaction, account)).toEqual(
      `
SEND 0.00000997\u00a0BTC
TO ${RECIPIENT}
with feePerByte=2 (network fees: 0=3, 1=2, 2=1)
OPTIMIZE_SIZE pick-unconfirmed RBF-enabled
exclude ${PREVIOUS_TX_HASH} @3`,
    );
  });

  it("formats a send of the whole balance", () => {
    expect(formatTransaction({ ...transaction, useAllAmount: true }, account)).toContain(
      "SEND MAX",
    );
  });

  it("formats a send whose fees are not loaded", () => {
    const unloaded: Transaction = { ...transaction, feePerByte: null, networkInfo: null };

    expect(formatTransaction(unloaded, account)).toContain(
      "with feePerByte=? (network info not loaded)",
    );
  });

  it("formats the inputs and the outputs of a status", () => {
    const formatted = formatTransactionStatus(transaction, status, account);

    expect(formatted).toContain(
      `TX INPUTS (1):\n0.001        ${txInput.address} ${PREVIOUS_TX_HASH}@2`,
    );
    expect(formatted).toContain(
      `TX OUTPUTS (1):\n0.00098751   ${txOutput.address} (change) rbf ${PREVIOUS_TX_HASH} @1 (10)`,
    );
  });

  it("formats a status without inputs nor outputs", () => {
    const formatted = formatTransactionStatus(
      transaction,
      { ...status, txInputs: undefined, txOutputs: undefined },
      account,
    );

    expect(formatted).toContain("TX INPUTS (0):\n\nTX OUTPUTS (0):\n");
  });
});
