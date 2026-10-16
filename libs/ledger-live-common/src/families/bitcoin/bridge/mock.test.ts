import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { getBitcoinEstimationRecipient } from "@ledgerhq/coin-bitcoin/api";
import type { Transaction } from "../types";
import mockBridge from "./mock";

const { accountBridge } = mockBridge;
const account = {
  type: "Account",
  currency: getCryptoCurrencyById("bitcoin"),
  balance: new BigNumber(100_000),
} as unknown as Account;

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  ...accountBridge.createTransaction(account),
  recipient: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  amount: new BigNumber(10_000),
  ...overrides,
});

describe("bitcoin mock bridge", () => {
  it("creates a transaction in the generic shape", () => {
    expect(accountBridge.createTransaction(account)).toEqual({
      family: "bitcoin",
      mode: "send",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      feesStrategy: "medium",
      familySpecificData: { utxoStrategy: { strategy: 0, excludeUTXOs: [] }, feePerByte: "10" },
    });
  });

  it("prices a preset strategy with its rate", async () => {
    const prepared = await accountBridge.prepareTransaction(
      account,
      transaction({ feesStrategy: "fast" }),
    );
    expect(prepared.fees).toEqual(new BigNumber(1_000));
    expect(prepared.feeParameters).toEqual({
      feePerByte: "4",
      feeRates: { fast: "4", medium: "3", slow: "2" },
      relayFeePerByte: "1",
    });
  });

  it("prices a custom strategy with the user's rate, else the medium one", async () => {
    const custom = await accountBridge.prepareTransaction(
      account,
      transaction({ feesStrategy: "custom" }),
    );
    expect(custom.feeParameters?.feePerByte).toBe("10");
    const noRate = await accountBridge.prepareTransaction(
      account,
      transaction({ feesStrategy: null, familySpecificData: {} }),
    );
    expect(noRate.feeParameters?.feePerByte).toBe("3");
  });

  it("keeps the same transaction when nothing changes", async () => {
    const prepared = await accountBridge.prepareTransaction(account, transaction());
    expect(await accountBridge.prepareTransaction(account, prepared)).toBe(prepared);
  });

  it("computes the status from the transaction's rate", async () => {
    const prepared = await accountBridge.prepareTransaction(account, transaction());
    const status = await accountBridge.getTransactionStatus(account, prepared);
    expect(status.estimatedFees).toEqual(new BigNumber(750));
    expect(status.totalSpent).toEqual(new BigNumber(10_750));
    expect(status.errors).toEqual({});

    const dust = await accountBridge.getTransactionStatus(account, {
      ...prepared,
      amount: new BigNumber(100),
    });
    expect(dust.errors.dustLimit).toBeDefined();

    const noRate = await accountBridge.getTransactionStatus(
      account,
      transaction({ familySpecificData: {} }),
    );
    expect(noRate.estimatedFees).toEqual(new BigNumber(0));
    expect(noRate.errors.dustLimit).toBeUndefined();
  });

  it("estimates the max spendable at the transaction's rate", async () => {
    expect(
      await accountBridge.estimateMaxSpendable({ account, transaction: transaction() }),
    ).toEqual(new BigNumber(97_500));
    expect(await accountBridge.estimateMaxSpendable({ account })).toEqual(new BigNumber(95_000));
  });

  it("estimates with the currency's estimation recipient", () => {
    expect(accountBridge.getEstimationRecipient?.(account)).toBe(
      getBitcoinEstimationRecipient("bitcoin"),
    );
  });
});
