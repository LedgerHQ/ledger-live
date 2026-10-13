import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import transactionModule, {
  formatTransaction,
  formatTransactionStatus,
  fromTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionRaw,
  toTransactionStatusRaw,
} from "./transaction";
import type { Transaction, TransactionRaw, TransactionStatus } from "./types";

const account = {
  type: "Account",
  currency: getCryptoCurrencyById("bitcoin"),
} as unknown as Account;

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  family: "bitcoin",
  amount: new BigNumber(1_000),
  recipient: "bc1qrecipient",
  useAllAmount: false,
  feesStrategy: "medium",
  ...overrides,
});

describe("transaction raw", () => {
  it("round-trips every field but the derived fee parameters", () => {
    const full = transaction({
      mode: "send",
      fees: new BigNumber(250),
      nonce: new BigNumber(3),
      customFees: { parameters: { fees: new BigNumber(9) } },
      familySpecificData: { feePerByte: "12", rbf: true, opReturnData: "6869" },
      feeParameters: { feePerByte: "12" },
    });
    const raw = toTransactionRaw(full);
    expect(raw).toEqual({
      family: "bitcoin",
      amount: "1000",
      recipient: "bc1qrecipient",
      useAllAmount: false,
      mode: "send",
      fees: "250",
      nonce: "3",
      customFees: { parameters: { fees: "9" } },
      familySpecificData: { feePerByte: "12", rbf: true, opReturnData: "6869" },
      feesStrategy: "medium",
    });
    const { feeParameters: _derived, ...persisted } = full;
    expect(fromTransactionRaw(raw)).toEqual(persisted);
  });

  it("keeps a minimal transaction minimal", () => {
    const raw = toTransactionRaw(transaction({ customFees: { parameters: {} } }));
    expect(raw).toEqual({
      family: "bitcoin",
      amount: "1000",
      recipient: "bc1qrecipient",
      useAllAmount: false,
      fees: null,
      customFees: { parameters: { fees: null } },
      feesStrategy: "medium",
    });
    expect(fromTransactionRaw(raw)).toEqual(
      transaction({ fees: null, customFees: { parameters: { fees: undefined } } }),
    );
    expect(
      fromTransactionRaw({
        family: "bitcoin",
        amount: "1",
        recipient: "r",
        feesStrategy: null,
      } as TransactionRaw),
    ).toEqual({
      family: "bitcoin",
      amount: new BigNumber(1),
      recipient: "r",
      fees: null,
      feesStrategy: null,
    });
  });
});

describe("transaction status raw", () => {
  it("uses the common status", () => {
    const status: TransactionStatus = {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(1),
      amount: new BigNumber(2),
      totalSpent: new BigNumber(3),
    };
    expect(fromTransactionStatusRaw(toTransactionStatusRaw(status))).toEqual(status);
  });
});

describe("formatters", () => {
  const status: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(250),
    amount: new BigNumber(1_000),
    totalSpent: new BigNumber(1_250),
  };

  it("lists the selected inputs and outputs", () => {
    const text = formatTransactionStatus(
      transaction({
        feeParameters: {
          inputs: [{ txid: "t", vout: 1, value: "5000", address: "bc1qme" }],
          outputs: [
            { address: "bc1qrecipient", value: "1000", isChange: false },
            { address: "bc1qchange", value: "3750", isChange: true },
            { address: null, value: "0", isChange: false },
          ],
        },
      }),
      status,
      account,
    );
    expect(text).toContain("TX INPUTS (1):");
    expect(text).toMatch(/0\.00005 +bc1qme t@1/);
    expect(text).toContain("TX OUTPUTS (3):");
    expect(text).toMatch(/bc1qchange \(change\)/);
    expect(text).toMatch(/ OP_RETURN/);
  });

  it("formats a transaction before its first estimation", () => {
    expect(formatTransactionStatus(transaction(), status, account)).toContain(
      "TX INPUTS (0):\n\nTX OUTPUTS (0):",
    );
    expect(formatTransaction(transaction(), account)).toBe(`
SEND 0.00001\u00a0BTC
TO bc1qrecipient
with feePerByte=? (network info not loaded)
DEEP_OUTPUTS_FIRST`);
  });

  it("formats the strategy, the rates, the replaced and excluded outputs", () => {
    expect(
      formatTransaction(
        transaction({
          useAllAmount: true,
          familySpecificData: {
            utxoStrategy: { strategy: 1, excludeUTXOs: [{ hash: "h", outputIndex: 2 }] },
            replaceTxId: "old",
          },
          feeParameters: { feePerByte: "20", feeRates: { slow: "10", medium: "20", fast: "30" } },
        }),
        account,
      ),
    ).toBe(`
SEND MAX
TO bc1qrecipient
with feePerByte=20 (network fees: fast=30, medium=20, slow=10)
OPTIMIZE_SIZE replacing old
exclude h @2`);
  });

  it("exposes the transaction module", () => {
    expect(transactionModule).toEqual({
      fromTransactionRaw,
      toTransactionRaw,
      formatTransaction,
      formatTransactionStatus,
      fromTransactionStatusRaw,
      toTransactionStatusRaw,
    });
  });
});
