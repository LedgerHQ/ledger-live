import { ReplacementTransactionUnderpriced } from "../../../errors";
import { BigNumber } from "bignumber.js";
import { validateEditTransaction, getEditTransactionStatus } from "./getTransactionStatus";
import type {
  Transaction as BtcTransaction,
  EditType,
  TransactionStatus,
} from "@ledgerhq/coin-bitcoin/types";
import { bitcoinPickingStrategy } from "@ledgerhq/coin-bitcoin/types";
import type { Account } from "@ledgerhq/types-live";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { getBitcoinCoinConfig } from "../coinConfig";

jest.mock("../coinConfig", () => ({
  getBitcoinCoinConfig: jest.fn(),
}));

const mockedGetBitcoinCoinConfig = jest.mocked(getBitcoinCoinConfig);
const coinConfigWithFees = (fees: BitcoinCoinConfig["fees"] = {}): BitcoinCoinConfig => ({
  status: { type: "active" },
  name: "Bitcoin",
  unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
  explorer: { url: "https://explorer.test.invalid" },
  fees,
});

const mainAccount = { currency: { id: "bitcoin" } } as Account;

beforeEach(() => {
  mockedGetBitcoinCoinConfig.mockReturnValue(coinConfigWithFees());
});

const makeTransaction = (overrides: Partial<BtcTransaction> = {}): BtcTransaction => ({
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "bc1qexample...",
  utxoStrategy: {
    strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
    excludeUTXOs: [],
  },
  rbf: true,
  feePerByte: new BigNumber(1),
  networkInfo: null,
  ...overrides,
});

const makeStatus = (overrides: Partial<TransactionStatus> = {}): TransactionStatus => ({
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(1),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(1),
  txInputs: undefined,
  txOutputs: undefined,
  opReturnData: undefined,
  changeAddress: undefined,
  ...overrides,
});

describe("validateEditTransaction", () => {
  it("returns empty errors and warnings when editType is undefined", () => {
    const transaction = { feePerByte: new BigNumber(10) } as BtcTransaction;
    const transactionToUpdate = { rbf: true, feePerByte: new BigNumber(5) } as BtcTransaction;

    const result = validateEditTransaction({
      mainAccount,
      transaction,
      transactionToUpdate,
      editType: undefined as unknown as EditType,
    });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });

  it("sets error when original transaction is not replaceable (rbf = false)", () => {
    const transaction = makeTransaction({ feePerByte: new BigNumber(10) });
    const transactionToUpdate = makeTransaction({
      rbf: false,
      feePerByte: new BigNumber(5),
    });

    const result = validateEditTransaction({
      mainAccount,
      transaction,
      transactionToUpdate,
      editType: "speedup",
    });

    expect(result.warnings).toEqual({});
    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

  it("sets error when new feePerByte is missing (replacement must have a fee)", () => {
    const baseTx = makeTransaction({ rbf: true, feePerByte: new BigNumber(5) });
    const baseEdited = makeTransaction({ feePerByte: new BigNumber(10) });

    const result = validateEditTransaction({
      mainAccount,
      transaction: { ...baseEdited, feePerByte: undefined },
      transactionToUpdate: baseTx,
      editType: "speedup",
    });

    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

  it("returns empty errors when only original feePerByte is missing and no replaceTxId", () => {
    const baseTx = makeTransaction({ rbf: true, feePerByte: new BigNumber(5) });
    const baseEdited = makeTransaction({ feePerByte: new BigNumber(10) });

    const result = validateEditTransaction({
      mainAccount,
      transaction: baseEdited,
      transactionToUpdate: { ...baseTx, feePerByte: undefined },
      editType: "speedup",
    });

    expect(result.errors).toEqual({});
  });

  it("returns empty errors when replaceTxId is set but original fee is not yet available (loading)", () => {
    const transaction = makeTransaction({ feePerByte: new BigNumber(11) });
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: undefined as unknown as typeof transaction.feePerByte,
      replaceTxId: "orig-txid",
    });

    const result = validateEditTransaction({
      mainAccount,
      transaction,
      transactionToUpdate,
      editType: "cancel",
    });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });

  it("sets error when transactionToUpdate.feePerByte is missing", () => {
    const transaction = makeTransaction({ feePerByte: new BigNumber(11) });
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: null as unknown as typeof transaction.feePerByte,
      replaceTxId: "orig-txid",
    });

    const result = validateEditTransaction({
      mainAccount,
      transaction,
      transactionToUpdate,
      editType: "speedup",
    });

    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

  it("sets error when new feePerByte is less than minimum required (RBF bump rule)", () => {
    // getMinFees rule of thumb: >= +10% and >= +1 sat/vB, ceil.
    // Original 10 => min is ceil(max(11, 11)) = 11.
    const transaction = makeTransaction({ feePerByte: new BigNumber(10) });
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: new BigNumber(10),
    });

    const result = validateEditTransaction({
      mainAccount,
      transaction,
      transactionToUpdate,
      editType: "speedup",
    });

    expect(result.warnings).toEqual({});
    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

  it("returns empty errors when new feePerByte meets or exceeds minimum required (RBF bump rule)", () => {
    // Original 10 => min is 11. New 12 is OK.
    const transaction = makeTransaction({ feePerByte: new BigNumber(12) });
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: new BigNumber(10),
    });

    const result = validateEditTransaction({
      mainAccount,
      transaction,
      transactionToUpdate,
      editType: "speedup",
    });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });
});

describe("getEditTransactionStatus", () => {
  it("merges edit transaction errors into existing status errors", async () => {
    const transaction = makeTransaction({ feePerByte: new BigNumber(10) });
    const transactionToUpdate = makeTransaction({
      rbf: false,
      feePerByte: new BigNumber(5),
    });

    const baseStatus = makeStatus({
      errors: { existingError: new Error("existing") },
    });

    const result = await getEditTransactionStatus({
      mainAccount,
      transaction,
      transactionToUpdate,
      status: baseStatus,
      editType: "speedup",
    });

    expect(result.estimatedFees).toEqual(baseStatus.estimatedFees);
    expect(result.errors.existingError).toBe(baseStatus.errors.existingError);
    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

  it("keeps original errors when validateEditTransaction returns no errors", async () => {
    const transaction = makeTransaction({ feePerByte: new BigNumber(10) });
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: new BigNumber(5),
    });

    const baseStatus = makeStatus({
      errors: { existingError: new Error("existing") },
    });

    const result = await getEditTransactionStatus({
      mainAccount,
      transaction,
      transactionToUpdate,
      status: baseStatus,
      editType: undefined as unknown as EditType,
    });

    expect(result.errors).toEqual(baseStatus.errors);
  });
});
