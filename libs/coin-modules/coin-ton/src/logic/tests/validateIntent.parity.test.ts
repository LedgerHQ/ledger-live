import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { BigNumber } from "bignumber.js";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  account,
  accountInfo,
  transaction as baseTransaction,
  fees as sourceFees,
  jettonTransaction,
  tokenAccount,
} from "../../__tests__/fixtures/common.fixtures";
import { setCoinConfig } from "../../config";
import { getTransactionStatus } from "../../getTransactionStatus";
import prepareTransaction from "../../prepareTransaction";
import { TON_API_MOCKED, createMockTonContext, mockTonConfig } from "../../test/context";
import { NOT_MASTER } from "../../test/history.fixtures";
import type { TonAccount, TonMemo, Transaction } from "../../types";
import { validateIntent } from "../validateIntent";

type Status = {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  amount: BigNumber | bigint;
  totalSpent: BigNumber | bigint;
  estimatedFees: BigNumber | bigint;
};

const names = (issues: Record<string, Error>) =>
  Object.fromEntries(Object.entries(issues).map(([field, error]) => [field, error.name]));

const view = ({ errors, warnings, amount, totalSpent, estimatedFees }: Status) => ({
  errors: names(errors),
  warnings: names(warnings),
  amount: BigInt(amount.toString()),
  totalSpent: BigInt(totalSpent.toString()),
  estimatedFees: BigInt(estimatedFees.toString()),
});

const jettonAsset = {
  type: "jetton",
  assetReference: NOT_MASTER,
  assetOwner: account.freshAddress,
};

const toIntent = (from: TonAccount, transaction: Transaction): TransactionIntent<TonMemo> =>
  ({
    intentType: "transaction",
    type: "send",
    sender: from.freshAddress,
    recipient: transaction.recipient,
    amount: BigInt(transaction.amount.toFixed()),
    asset: transaction.subAccountId ? jettonAsset : { type: "native" },
    useAllAmount: transaction.useAllAmount,
    memo:
      transaction.comment.text === ""
        ? { type: "none" }
        : { type: "string", kind: "comment", value: transaction.comment.text },
  }) as TransactionIntent<TonMemo>;

const toBalances = (from: TonAccount): Balance[] => [
  { value: BigInt(from.balance.toFixed()), asset: { type: "native" } },
  { value: BigInt(tokenAccount.spendableBalance.toFixed()), asset: jettonAsset },
];

const withBalance = (balance: string): TonAccount => ({
  ...account,
  balance: new BigNumber(balance),
  spendableBalance: new BigNumber(balance),
});
const comment = (text: string) => ({ isEncrypted: false, text });

describe("validateIntent parity with the legacy bridge", () => {
  const server = setupServer(
    http.get(`${TON_API_MOCKED}/account`, () => HttpResponse.json(accountInfo)),
    http.get(`${TON_API_MOCKED}/wallet`, () => HttpResponse.json(accountInfo)),
    http.post(`${TON_API_MOCKED}/estimateFee`, () =>
      HttpResponse.json({ source_fees: sourceFees, destination_fees: [] }),
    ),
  );
  const context = createMockTonContext();

  beforeAll(() => {
    setCoinConfig(() => mockTonConfig);
    server.listen({ onUnhandledRequest: "error" });
  });
  afterAll(() => server.close());

  const both = async (from: TonAccount, transaction: Transaction) => {
    const legacy = await getTransactionStatus(from, transaction);
    const ours = await validateIntent(context, toIntent(from, transaction), toBalances(from), {
      value: BigInt(transaction.fees.toFixed()),
    });
    return { legacy, ours };
  };

  it.each<[string, TonAccount, Transaction]>([
    ["a missing recipient", account, { ...baseTransaction, recipient: "" }],
    ["an invalid recipient", account, { ...baseTransaction, recipient: "isInvalid" }],
    [
      "a recipient that is the sender",
      account,
      { ...baseTransaction, recipient: account.freshAddress },
    ],
    ["an invalid sender", { ...account, freshAddress: "isInvalid" }, baseTransaction],
    ["a zero amount", account, { ...baseTransaction, amount: new BigNumber(0) }],
    [
      "an amount above the balance",
      account,
      { ...baseTransaction, amount: new BigNumber(1000000002), fees: new BigNumber(20) },
    ],
    [
      "an amount above a balance under 0.02 TON",
      withBalance("10000000"),
      { ...baseTransaction, amount: new BigNumber(200000000), fees: new BigNumber(1000) },
    ],
    [
      "an affordable amount on a balance under 0.02 TON",
      withBalance("15000000"),
      { ...baseTransaction, amount: new BigNumber(1000000), fees: new BigNumber(1000) },
    ],
    [
      "a zero amount on a balance under 0.02 TON",
      withBalance("10000000"),
      { ...baseTransaction, amount: new BigNumber(0) },
    ],
    [
      "a balance of exactly 0.02 TON",
      withBalance("20000000"),
      { ...baseTransaction, amount: new BigNumber(1000000), fees: new BigNumber(1000) },
    ],
    [
      "a jetton amount above the jetton balance",
      account,
      { ...jettonTransaction, amount: new BigNumber(1000000002), fees: new BigNumber(20) },
    ],
    ["an affordable jetton amount", account, jettonTransaction],
    ["a jetton transfer from a parent under 0.1 TON", withBalance("50000000"), jettonTransaction],
    [
      "a comment with a line break",
      account,
      { ...baseTransaction, amount: new BigNumber(1), comment: comment("comment\nInvalid") },
    ],
    [
      "a comment over 120 characters",
      account,
      { ...baseTransaction, comment: comment("a".repeat(121)) },
    ],
    [
      "a comment without text",
      account,
      { ...baseTransaction, comment: comment(undefined as unknown as string) },
    ],
    ["a valid comment", account, { ...baseTransaction, comment: comment("Hi, there") }],
    ["a valid transfer", account, baseTransaction],
  ])("judges %s as the legacy bridge does", async (_, from, transaction) => {
    const { legacy, ours } = await both(from, transaction);

    expect(view(ours)).toEqual(view(legacy));
  });

  it("names the currency in an invalid-address error, as the legacy bridge does", async () => {
    const { legacy, ours } = await both(account, { ...baseTransaction, recipient: "isInvalid" });

    expect(ours.errors.recipient).toEqual(legacy.errors.recipient);
    expect(ours.errors.recipient).toEqual(expect.objectContaining({ currencyName: "TON" }));
  });

  describe("send-max", () => {
    const sendMax = async (from: TonAccount, transaction: Transaction) => {
      const prepared = await prepareTransaction(from, { ...transaction, useAllAmount: true });
      const legacy = await getTransactionStatus(from, prepared);
      const ours = await validateIntent(
        context,
        toIntent(from, { ...transaction, useAllAmount: true, amount: new BigNumber(0) }),
        toBalances(from),
        { value: BigInt(prepared.fees.toFixed()) },
      );
      return { legacy, ours };
    };

    it("sends the balance less the fees", async () => {
      const { legacy, ours } = await sendMax(account, baseTransaction);

      expect(view(ours)).toEqual(view(legacy));
      expect(ours.amount).toBe(1000000000n - 40000n);
    });

    it("sends the whole jetton balance", async () => {
      const { legacy, ours } = await sendMax(account, jettonTransaction);

      expect(view(ours)).toEqual(view(legacy));
      expect(ours.amount).toBe(5000000n);
    });

    it("reports the 0.02 TON floor when the fees exceed the balance, with no negative amount", async () => {
      const { legacy, ours } = await sendMax(withBalance("30000"), baseTransaction);

      expect(names(ours.errors)).toEqual(names(legacy.errors));
      expect(names(ours.errors)).toEqual({ amount: "TonMinimumRequired" });
      expect(legacy.amount.isNegative()).toBe(true);
      expect(ours.amount).toBe(0n);
    });
  });
});
