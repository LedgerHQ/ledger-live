import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/ledger-wallet-framework/errors";
import {
  CasperInvalidTransferId,
  InvalidMinimumAmount,
  MayBlockAccount,
} from "@ledgerhq/coin-casper/errors";
import { CASPER_MINIMUM_VALID_AMOUNT_MOTES } from "@ledgerhq/coin-casper/constants";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

const VALID_ADDRESS = "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581";
const RECIPIENT_ADDRESS = "0203A17118eC0e64c4e4FdbDbEe0eA14D118C9aAf08C6c81bbB776Cae607cEB84EcB";
const MOCK_FEES = new BigNumber(100_000_000);
const MIN_AMOUNT = new BigNumber(CASPER_MINIMUM_VALID_AMOUNT_MOTES);

jest.mock("@ledgerhq/coin-casper/logic", () => ({
  ...jest.requireActual("@ledgerhq/coin-casper/logic"),
  getAddress: jest.fn(),
  getEstimatedFees: jest.fn(),
  isAddressValid: jest.fn(),
  validateMemo: jest.fn(),
}));

jest.mock("../../../bridge/mockHelpers", () => ({
  scanAccounts: jest.fn(),
  signOperation: jest.fn(),
  signRawOperation: jest.fn(),
  broadcast: jest.fn(),
  sync: jest.fn(),
  makeAccountBridgeReceive: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  getSerializedAddressParameters: jest.fn(),
  updateTransaction: jest.fn((tx, patch) => ({ ...tx, ...patch })),
}));

jest.mock("../../../account", () => ({
  getMainAccount: jest.fn(account => account),
}));

jest.mock("../../../bridge/validateAddress", () => ({
  validateAddress: jest.fn(),
}));

import {
  getAddress,
  getEstimatedFees,
  isAddressValid,
  validateMemo,
} from "@ledgerhq/coin-casper/logic";
import mock from "./mock";

const { accountBridge } = mock;

const makeAccount = (overrides?: Partial<Account>): Account =>
  ({
    id: "casper:account",
    type: "Account",
    currency: { name: "Casper" },
    balance: new BigNumber("10000000000"),
    spendableBalance: new BigNumber("10000000000"),
    ...overrides,
  }) as unknown as Account;

const makeTx = (overrides?: Partial<Transaction>): Transaction => ({
  family: "casper",
  amount: MIN_AMOUNT,
  recipient: RECIPIENT_ADDRESS,
  fees: MOCK_FEES,
  useAllAmount: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  (getAddress as jest.Mock).mockReturnValue({ address: VALID_ADDRESS });
  (isAddressValid as jest.Mock).mockReturnValue(true);
  (validateMemo as jest.Mock).mockReturnValue(true);
  (getEstimatedFees as jest.Mock).mockReturnValue(MOCK_FEES);
});

describe("mock accountBridge.getTransactionStatus", () => {
  it("returns RecipientRequired error when recipient is empty", async () => {
    const result = await accountBridge.getTransactionStatus(
      makeAccount(),
      makeTx({ recipient: "" }),
    );
    expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("returns InvalidAddress error when recipient address is invalid", async () => {
    (isAddressValid as jest.Mock).mockReturnValueOnce(false);
    const result = await accountBridge.getTransactionStatus(makeAccount(), makeTx());
    expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("returns InvalidAddressBecauseDestinationIsAlsoSource when recipient equals sender", async () => {
    const result = await accountBridge.getTransactionStatus(
      makeAccount(),
      makeTx({ recipient: VALID_ADDRESS }),
    );
    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("returns InvalidAddress for sender when sender address is invalid", async () => {
    (isAddressValid as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);
    const result = await accountBridge.getTransactionStatus(makeAccount(), makeTx());
    expect(result.errors.sender).toBeInstanceOf(InvalidAddress);
  });

  it("returns CasperInvalidTransferId when transferId memo is invalid", async () => {
    (validateMemo as jest.Mock).mockReturnValue(false);
    const result = await accountBridge.getTransactionStatus(
      makeAccount(),
      makeTx({ transferId: "not-a-number" }),
    );
    expect(result.errors.sender).toBeInstanceOf(CasperInvalidTransferId);
  });

  it("returns AmountRequired error when amount is zero", async () => {
    const result = await accountBridge.getTransactionStatus(
      makeAccount(),
      makeTx({ amount: new BigNumber(0) }),
    );
    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("returns NotEnoughBalance when amount + fees exceed spendable balance", async () => {
    const result = await accountBridge.getTransactionStatus(
      makeAccount({ spendableBalance: new BigNumber(100) }),
      makeTx({ amount: new BigNumber("9999999999") }),
    );
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("returns InvalidMinimumAmount when amount is below minimum", async () => {
    const result = await accountBridge.getTransactionStatus(
      makeAccount(),
      makeTx({ amount: new BigNumber(1) }),
    );
    expect(result.errors.amount).toBeInstanceOf(InvalidMinimumAmount);
  });

  it("sets MayBlockAccount warning when remaining balance is below minimum", async () => {
    const spendable = MIN_AMOUNT.plus(MOCK_FEES).plus(new BigNumber(1));
    const result = await accountBridge.getTransactionStatus(
      makeAccount({ balance: spendable, spendableBalance: spendable }),
      makeTx({ amount: MIN_AMOUNT }),
    );
    expect(result.warnings.amount).toBeInstanceOf(MayBlockAccount);
  });

  it("handles useAllAmount=true and computes amount from spendable balance", async () => {
    const spendable = new BigNumber("5000000000");
    const result = await accountBridge.getTransactionStatus(
      makeAccount({ balance: spendable, spendableBalance: spendable }),
      makeTx({ useAllAmount: true }),
    );
    expect(result.amount).toEqual(spendable.minus(MOCK_FEES));
  });

  it("returns NotEnoughBalance for useAllAmount when balance is zero", async () => {
    const result = await accountBridge.getTransactionStatus(
      makeAccount({ balance: new BigNumber(0), spendableBalance: new BigNumber(0) }),
      makeTx({ useAllAmount: true }),
    );
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("returns a clean status for a valid transaction", async () => {
    const result = await accountBridge.getTransactionStatus(makeAccount(), makeTx());
    expect(result.errors).toEqual({});
    expect(result.amount).toEqual(MIN_AMOUNT);
  });

  it("falls back to getEstimatedFees() when fees is null", async () => {
    const result = await accountBridge.getTransactionStatus(makeAccount(), makeTx({ fees: null }));
    expect(getEstimatedFees).toHaveBeenCalled();
    expect(result.estimatedFees).toEqual(MOCK_FEES);
    expect(result.totalSpent).toEqual(MIN_AMOUNT.plus(MOCK_FEES));
  });
});

describe("mock accountBridge.prepareTransaction", () => {
  it("returns transaction unchanged when not useAllAmount", async () => {
    const tx = makeTx();
    const result = await accountBridge.prepareTransaction(makeAccount(), tx);
    expect(result).toBe(tx);
  });

  it("computes amount from spendable balance when useAllAmount is true", async () => {
    const account = makeAccount({ spendableBalance: new BigNumber("5000000000") });
    const tx = makeTx({ useAllAmount: true });
    const result = await accountBridge.prepareTransaction(account, tx);
    expect(result.amount).toEqual(account.spendableBalance.minus(MOCK_FEES));
  });

  it("uses getEstimatedFees() as fee fallback when fees is null and useAllAmount is true", async () => {
    const account = makeAccount({ spendableBalance: new BigNumber("5000000000") });
    const tx = makeTx({ useAllAmount: true, fees: null });
    const result = await accountBridge.prepareTransaction(account, tx);
    expect(getEstimatedFees).toHaveBeenCalled();
    expect(result.amount).toEqual(account.spendableBalance.minus(MOCK_FEES));
  });
});

describe("mock accountBridge.estimateMaxSpendable", () => {
  it("returns zero when balance is zero", async () => {
    const result = await accountBridge.estimateMaxSpendable({
      account: makeAccount({ spendableBalance: new BigNumber(0) }),
    });
    expect(result).toEqual(new BigNumber(0));
  });

  it("returns zero when balance is less than or equal to fees", async () => {
    const result = await accountBridge.estimateMaxSpendable({
      account: makeAccount({ spendableBalance: MOCK_FEES }),
    });
    expect(result).toEqual(new BigNumber(0));
  });

  it("returns balance minus fees when balance exceeds fees", async () => {
    const balance = new BigNumber("5000000000");
    const result = await accountBridge.estimateMaxSpendable({
      account: makeAccount({ spendableBalance: balance }),
    });
    expect(result).toEqual(balance.minus(MOCK_FEES));
  });

  it("uses custom fees from transaction when provided", async () => {
    const balance = new BigNumber("5000000000");
    const customFees = new BigNumber("200000000");
    const result = await accountBridge.estimateMaxSpendable({
      account: makeAccount({ spendableBalance: balance }),
      transaction: makeTx({ fees: customFees }),
    });
    expect(result).toEqual(balance.minus(customFees));
  });
});
