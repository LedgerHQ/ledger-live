jest.mock("../logic", () => ({
  calcMaxSpendableAmount: jest.fn(),
  getFeeRate: jest.fn(),
  isValidKaspaAddress: jest.fn(),
  parseExtendedPublicKey: jest.fn(),
  scanUtxos: jest.fn(),
  selectUtxos: jest.fn(),
}));
jest.mock("@ledgerhq/live-network/cache", () => ({
  makeLRUCache: (fn: unknown) => jest.fn(fn as () => unknown),
  minutes: jest.fn(),
}));

import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  InvalidAddress,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { calcMaxSpendableAmount, getFeeRate, isValidKaspaAddress, selectUtxos } from "../logic";
import type { KaspaAccount, Transaction } from "../types";
import getTransactionStatus, { getCachedUtxos } from "./getTransactionStatus";

const mockedCalcMaxSpendableAmount = jest.mocked(calcMaxSpendableAmount);
const mockedGetFeeRate = jest.mocked(getFeeRate);
const mockedIsValidKaspaAddress = jest.mocked(isValidKaspaAddress);
const mockedSelectUtxos = jest.mocked(selectUtxos);
const mockedGetCachedUtxos = jest.mocked(getCachedUtxos);

const account = {
  id: "js:2:kaspa:xpub:",
  xpub: "xpub",
  balance: new BigNumber(1_000_000),
  currency: { name: "Kaspa" },
} as KaspaAccount;

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "kaspa",
    amount: new BigNumber(20_000_000),
    recipient: "kaspa:recipient",
    feesStrategy: "fast",
    useAllAmount: false,
    networkInfo: [],
    ...overrides,
  }) as Transaction;

describe("getTransactionStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsValidKaspaAddress.mockReturnValue(true);
    mockedGetFeeRate.mockReturnValue(new BigNumber(1));
    mockedGetCachedUtxos.mockResolvedValue({ utxos: [] });
    mockedCalcMaxSpendableAmount.mockReturnValue(new BigNumber(100_000_000));
    mockedSelectUtxos.mockReturnValue({ fee: new BigNumber(1_000) } as ReturnType<
      typeof selectUtxos
    >);
  });

  it("should require a recipient and amount before selecting UTXOs", async () => {
    const status = await getTransactionStatus(
      account,
      createTransaction({ recipient: "", amount: new BigNumber(0) }),
    );

    expect(status.errors).toEqual({
      recipient: new RecipientRequired(""),
      amount: new AmountRequired(""),
    });
    expect(mockedGetCachedUtxos).not.toHaveBeenCalled();
  });

  it("should reject an invalid recipient with the account currency name", async () => {
    mockedIsValidKaspaAddress.mockReturnValue(false);

    const status = await getTransactionStatus(account, createTransaction());

    expect(status.errors.recipient).toEqual(new InvalidAddress("", { currencyName: "Kaspa" }));
  });

  it.each([
    [undefined, FeeNotLoaded],
    [new BigNumber(0), FeeRequired],
  ])("should validate the custom fee rate %s", async (customFeeRate, ErrorClass) => {
    const status = await getTransactionStatus(
      account,
      createTransaction({ feesStrategy: "custom", customFeeRate }),
    );

    expect(status.errors.feePerByte).toBeInstanceOf(ErrorClass);
  });

  it("should return the selected fee and total for a valid transaction", async () => {
    const utxos = [{}] as Awaited<ReturnType<typeof getCachedUtxos>>["utxos"];
    mockedGetCachedUtxos.mockResolvedValue({ utxos });
    mockedSelectUtxos.mockReturnValue({ fee: new BigNumber(2_000) } as ReturnType<
      typeof selectUtxos
    >);

    const status = await getTransactionStatus(account, createTransaction());

    expect(mockedSelectUtxos).toHaveBeenCalledWith(utxos, false, new BigNumber(20_000_000), 1);
    expect(status).toMatchObject({
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(2_000),
      amount: new BigNumber(20_000_000),
      totalSpent: new BigNumber(20_002_000),
    });
  });

  it("should set the maximum spendable amount for a send-max transaction", async () => {
    const maximum = new BigNumber(30_000_000);
    mockedCalcMaxSpendableAmount.mockReturnValue(maximum);

    const status = await getTransactionStatus(account, createTransaction({ useAllAmount: true }));

    expect(status.amount).toEqual(maximum);
    expect(status.totalSpent).toEqual(maximum.plus(1_000));
  });
});
