import { AnchorMode } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Unit } from "@ledgerhq/ledger-wallet-framework/types";
import transactionSerializer, { formatTransaction, fromTransactionRaw } from "./transaction";
import type { Transaction, TransactionRaw } from "../types";

jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  getAccountCurrency: jest.fn().mockImplementation((account: Account) => account.currency),
}));

jest.mock("@ledgerhq/coin-module-framework/currencies/index", () => ({
  formatCurrencyUnit: jest.fn().mockImplementation((unit: Unit, amount: BigNumber) => {
    return `${amount.toString()} ${unit.code}`;
  }),
}));

const { toTransactionRaw } = transactionSerializer;

const stxUnit: Unit = { name: "Stacks", code: "STX", magnitude: 6 };
const account = {
  id: "stacks-account-1",
  currency: { units: [stxUnit] },
} as unknown as Account;

const baseRaw = (): TransactionRaw => ({
  family: "stacks",
  amount: "1000",
  recipient: "",
  useAllAmount: false,
  network: "mainnet",
  anchorMode: AnchorMode.Any,
});

describe("transaction serialization", () => {
  it("round-trips mode, valAddress and familySpecificData for a staking-shaped transaction", () => {
    const raw: TransactionRaw = {
      ...baseRaw(),
      mode: "delegate",
      valAddress: "SP000000000000000000002Q6VF78.native-pool-signer-manager",
      familySpecificData: { numCycles: 1, startBurnHt: 12345 },
    };

    const transaction = fromTransactionRaw(raw);
    expect(transaction.mode).toBe("delegate");
    expect(transaction.valAddress).toBe("SP000000000000000000002Q6VF78.native-pool-signer-manager");
    expect(transaction.familySpecificData).toEqual({ numCycles: 1, startBurnHt: 12345 });

    expect(toTransactionRaw(transaction)).toEqual(raw);
  });

  it("still round-trips a plain transfer with no mode/valAddress (regression guard)", () => {
    const raw: TransactionRaw = { ...baseRaw(), recipient: "SP1abc" };

    const transaction = fromTransactionRaw(raw);
    expect(transaction.mode).toBeUndefined();
    expect(transaction.valAddress).toBeUndefined();
    expect(transaction.familySpecificData).toBeUndefined();

    expect(toTransactionRaw(transaction)).toEqual(raw);
  });

  it("throws on an unrecognized network", () => {
    const raw: TransactionRaw = { ...baseRaw(), network: "not-a-real-network" };
    expect(() => fromTransactionRaw(raw)).toThrow("network not-a-real-network not valid");
  });

  it("round-trips nonce, fee and fees when all three are set", () => {
    const raw: TransactionRaw = {
      ...baseRaw(),
      recipient: "SP1abc",
      nonce: "5",
      fee: "180",
      fees: "180",
    };

    const transaction = fromTransactionRaw(raw);
    expect(transaction.nonce).toEqual(new BigNumber(5));
    expect(transaction.fee).toEqual(new BigNumber(180));
    expect(transaction.fees).toEqual(new BigNumber(180));

    expect(toTransactionRaw(transaction)).toEqual(raw);
  });

  it("keeps fees as a literal null, distinct from undefined", () => {
    const raw: TransactionRaw = { ...baseRaw(), recipient: "SP1abc", fees: null };

    const transaction = fromTransactionRaw(raw);
    expect(transaction.fees).toBeNull();

    expect(toTransactionRaw(transaction)).toEqual(raw);
  });
});

describe("formatTransaction", () => {
  const baseTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
    ({
      family: "stacks",
      recipient: "SP1abc",
      useAllAmount: false,
      amount: new BigNumber(0),
      ...overrides,
    }) as unknown as Transaction;

  it("formats MAX when useAllAmount is set", () => {
    const result = formatTransaction(
      baseTransaction({ useAllAmount: true, amount: new BigNumber(1000) }),
      account,
    );
    expect(result).toBe("\nSEND MAX\nTO SP1abc");
  });

  it("formats an empty amount when the amount is zero and useAllAmount is false", () => {
    const result = formatTransaction(baseTransaction({ amount: new BigNumber(0) }), account);
    expect(result).toBe("\nSEND \nTO SP1abc");
  });

  it("formats the currency-unit amount for a non-zero, non-useAllAmount transfer", () => {
    const result = formatTransaction(baseTransaction({ amount: new BigNumber(1000) }), account);
    expect(result).toBe("\nSEND  1000 STX\nTO SP1abc");
  });
});
