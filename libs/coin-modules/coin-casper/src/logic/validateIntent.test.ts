import type {
  Balance,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { getTransactionStatus } from "../bridge/getTransactionStatus";
import {
  CASPER_FEES_MOTES,
  CASPER_MAX_TRANSFER_ID,
  CASPER_MINIMUM_VALID_AMOUNT_MOTES,
} from "../constants";
import { CasperInvalidTransferId, InvalidMinimumAmount, MayBlockAccount } from "../errors";
import { TEST_ADDRESSES } from "../__tests__/fixtures/addresses.fixture";
import type { CasperAccount, CasperMemo, Transaction } from "../types";
import { validateIntent } from "./validateIntent";

const FEES = BigInt(CASPER_FEES_MOTES);
const MIN_AMOUNT = BigInt(CASPER_MINIMUM_VALID_AMOUNT_MOTES);
const OUT_OF_RANGE_TRANSFER_ID = (BigInt(CASPER_MAX_TRANSFER_ID) + 1n).toString();
const LARGE_BALANCE = 100_000_000_000n;
const VALID_AMOUNT = 3_000_000_000n;
const SENDER = TEST_ADDRESSES.SECP256K1;
const RECIPIENT = TEST_ADDRESSES.RECIPIENT_SECP256K1;

type Case = {
  name?: string;
  sender?: string;
  recipient: string;
  amount: bigint;
  useAllAmount?: boolean;
  transferId?: string;
  balance: bigint;
  locked?: bigint;
};

const sendCase = (overrides: Partial<Case> = {}): Case => ({
  recipient: RECIPIENT,
  amount: VALID_AMOUNT,
  balance: LARGE_BALANCE,
  ...overrides,
});

const buildIntent = (c: Case): TransactionIntent<CasperMemo> => ({
  intentType: "transaction",
  type: "send",
  sender: c.sender ?? SENDER,
  recipient: c.recipient,
  amount: c.amount,
  asset: { type: "native" },
  useAllAmount: !!c.useAllAmount,
  ...(c.transferId ? { memo: { type: "string", kind: "transferId", value: c.transferId } } : {}),
});

const buildBalances = (c: Case): Balance[] => [
  { value: c.balance, asset: { type: "native" }, locked: c.locked ?? 0n },
];

const buildAccount = (c: Case): CasperAccount =>
  ({
    currency: { name: "Casper" },
    balance: new BigNumber(c.balance.toString()),
    spendableBalance: new BigNumber((c.balance - (c.locked ?? 0n)).toString()),
    freshAddress: c.sender ?? SENDER,
    freshAddressPath: "44'/506'/0'/0/0",
  }) as unknown as CasperAccount;

const buildTransaction = (c: Case): Transaction =>
  ({
    family: "casper",
    recipient: c.recipient,
    amount: new BigNumber(c.amount.toString()),
    useAllAmount: !!c.useAllAmount,
    fees: new BigNumber(FEES.toString()),
    transferId: c.transferId,
  }) as unknown as Transaction;

const validate = (c: Case, customFees: FeeEstimation = { value: FEES }) =>
  validateIntent(buildIntent(c), buildBalances(c), customFees);

const errorClasses = (rec: Record<string, Error>): Array<[string, unknown]> =>
  Object.entries(rec)
    .map(([k, v]): [string, unknown] => [k, v.constructor])
    .sort(([a], [b]) => a.localeCompare(b));

const parityCases: Case[] = [
  sendCase({ name: "empty recipient", recipient: "" }),
  sendCase({ name: "invalid recipient", recipient: TEST_ADDRESSES.INVALID }),
  sendCase({ name: "self-send with differing case", recipient: SENDER.toUpperCase() }),
  sendCase({ name: "invalid sender", sender: TEST_ADDRESSES.INVALID }),
  sendCase({ name: "out-of-range transfer id", transferId: OUT_OF_RANGE_TRANSFER_ID }),
  sendCase({ name: "zero amount", amount: 0n }),
  sendCase({ name: "below-minimum amount", amount: 1_000_000_000n }),
  sendCase({ name: "amount exceeding spendable", amount: LARGE_BALANCE + 1n }),
  sendCase({ name: "useAllAmount with sufficient balance", amount: 0n, useAllAmount: true }),
  sendCase({
    name: "useAllAmount without sufficient balance",
    amount: 0n,
    useAllAmount: true,
    balance: FEES,
  }),
  sendCase({ name: "may-block boundary", amount: MIN_AMOUNT, balance: 5_000_000_000n }),
];

describe("validateIntent", () => {
  describe("rule parity with bridge/getTransactionStatus", () => {
    it.each(parityCases)("produces the same error and warning classes for: $name", async c => {
      const legacyResult = await getTransactionStatus(buildAccount(c), buildTransaction(c));
      const result = validate(c);

      expect(errorClasses(result.errors)).toEqual(errorClasses(legacyResult.errors));
      expect(errorClasses(result.warnings)).toEqual(errorClasses(legacyResult.warnings));
    });

    it.each(parityCases)("produces the same amount and totalSpent for: $name", async c => {
      const legacyResult = await getTransactionStatus(buildAccount(c), buildTransaction(c));
      const result = validate(c);

      expect(result.amount.toString()).toBe(legacyResult.amount.toString());
      expect(result.totalSpent.toString()).toBe(legacyResult.totalSpent.toString());
    });
  });

  it("populates both errors.sender and errors.transaction for an out-of-range transfer id", () => {
    const { errors } = validate(sendCase({ transferId: OUT_OF_RANGE_TRANSFER_ID }));

    expect(errors.sender).toBeInstanceOf(CasperInvalidTransferId);
    expect(errors.transaction).toBeInstanceOf(CasperInvalidTransferId);
  });

  describe("framework memo shape { type: 'transferId' }", () => {
    it("accepts a valid transfer id", () => {
      const intent: TransactionIntent<CasperMemo> = {
        ...buildIntent(sendCase()),
        memo: { type: "transferId", value: "42" },
      };

      const { errors } = validateIntent(intent, buildBalances(sendCase()), { value: FEES });

      expect(errors.sender).toBeUndefined();
      expect(errors.transaction).toBeUndefined();
    });

    it("rejects an out-of-range transfer id", () => {
      const intent: TransactionIntent<CasperMemo> = {
        ...buildIntent(sendCase()),
        memo: { type: "transferId", value: OUT_OF_RANGE_TRANSFER_ID },
      };

      const { errors } = validateIntent(intent, buildBalances(sendCase()), { value: FEES });

      expect(errors.sender).toBeInstanceOf(CasperInvalidTransferId);
      expect(errors.transaction).toBeInstanceOf(CasperInvalidTransferId);
    });
  });

  it("reduces the accepted useAllAmount by the locked funds", () => {
    const locked = 10_000_000_000n;

    const result = validate(sendCase({ amount: 0n, useAllAmount: true, locked }));

    expect(result.amount).toBe(LARGE_BALANCE - locked - FEES);
  });

  it("converts balances above BigNumber's exponential-notation threshold without throwing", () => {
    const balance = 2n * 10n ** 21n;

    const result = validate(sendCase({ amount: 0n, useAllAmount: true, balance }));

    expect(result.amount).toBe(balance - FEES);
    expect(result.errors).toEqual({});
  });

  it.each([0n, -1n, -VALID_AMOUNT])("reports AmountRequired for an amount of %s", amount => {
    const { errors } = validate(sendCase({ amount }));

    expect(errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("reports InvalidMinimumAmount for an amount below the minimum", () => {
    const { errors } = validate(sendCase({ amount: 1_000_000_000n }));

    expect(errors.amount).toBeInstanceOf(InvalidMinimumAmount);
  });

  it("keeps NotEnoughBalance over InvalidMinimumAmount when both would apply", () => {
    const { errors } = validate(sendCase({ amount: 1_000_000_000n, balance: 100_000_000n }));

    expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("warns with MayBlockAccount when the remaining balance falls below the minimum", () => {
    const { warnings } = validate(sendCase({ amount: MIN_AMOUNT, balance: 5_000_000_000n }));

    expect(warnings.amount).toBeInstanceOf(MayBlockAccount);
  });

  it("treats a missing native balance as zero funds", () => {
    const { errors, totalSpent } = validateIntent(buildIntent(sendCase()), [], { value: FEES });

    expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
    expect(totalSpent).toBe(VALID_AMOUNT + FEES);
  });

  it("defaults estimatedFees to 0 when no customFees are provided", () => {
    const c = sendCase();

    const { estimatedFees } = validateIntent(buildIntent(c), buildBalances(c));

    expect(estimatedFees).toBe(0n);
  });

  it.each([
    ["an empty recipient", "", RecipientRequired],
    ["an invalid recipient", TEST_ADDRESSES.INVALID, InvalidAddress],
    ["a self-send", SENDER.toUpperCase(), InvalidAddressBecauseDestinationIsAlsoSource],
  ])("reports %s", (_name, recipient, expected) => {
    const { errors } = validate(sendCase({ recipient }));

    expect(errors.recipient).toBeInstanceOf(expected);
  });

  describe("unsupported intents", () => {
    it("throws for a non-native asset", () => {
      const intent = {
        ...buildIntent(sendCase()),
        asset: { type: "token", assetReference: "cep18-contract" },
      } as unknown as TransactionIntent<CasperMemo>;

      expect(() => validateIntent(intent, buildBalances(sendCase()))).toThrow(/asset type/);
    });

    it("throws for a staking intent", () => {
      const intent = {
        ...buildIntent(sendCase()),
        intentType: "staking",
      } as unknown as TransactionIntent<CasperMemo>;

      expect(() => validateIntent(intent, buildBalances(sendCase()))).toThrow(/staking/);
    });
  });
});
