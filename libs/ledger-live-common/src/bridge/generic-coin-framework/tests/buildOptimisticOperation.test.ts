import BigNumber from "bignumber.js";
import { buildOptimisticOperation } from "../utils";
import { Account } from "@ledgerhq/types-live";

const account = {
  id: "account_id",
  type: "Account",
  freshAddress: "addr",
  balance: new BigNumber(1_000_000),
  spendableBalance: new BigNumber(1_000_000),
  currency: {
    id: "test",
    family: "test",
    units: [{ name: "test", code: "TST", magnitude: 6 }],
  },
  subAccounts: [],
  pendingOperations: [],
} as unknown as Account;

const baseTransaction = {
  family: "test",
  amount: new BigNumber(10_000),
  fees: new BigNumber(100),
  recipient: "rRecipient",
} as any;

describe("buildOptimisticOperation — memo extra field", () => {
  it("writes the coin-declared extra key when memoType matches it", () => {
    const op = buildOptimisticOperation(account, {
      ...baseTransaction,
      memoType: "transferId",
      memoValue: "99",
    });

    expect(op.extra).toMatchObject({ transferId: "99" });
    expect(op.extra).not.toHaveProperty("memo");
    expect(op.extra).not.toHaveProperty("memoType");
  });

  it("writes extra.memo when memoType is a passthrough value", () => {
    const op = buildOptimisticOperation(account, {
      ...baseTransaction,
      memoType: "MEMO_TEXT",
      memoValue: "hello",
    });

    expect(op.extra).toMatchObject({ memo: "hello" });
    expect(op.extra).not.toHaveProperty("transferId");
    expect(op.extra).not.toHaveProperty("MEMO_TEXT");
  });

  it("writes no memo key when memoType or memoValue is absent", () => {
    const op = buildOptimisticOperation(account, { ...baseTransaction });

    expect(op.extra).not.toHaveProperty("transferId");
    expect(op.extra).not.toHaveProperty("memo");
  });

  it("locks the gross amount of a token transfer that levies a transfer fee", () => {
    const tokenAccount = {
      id: "sub1",
      type: "TokenAccount",
      balance: new BigNumber(1000),
      token: { contractAddress: "mint1" },
    };

    const op = buildOptimisticOperation({ ...account, subAccounts: [tokenAccount] } as never, {
      ...baseTransaction,
      subAccountId: "sub1",
      amount: new BigNumber(99),
      transferFee: { transferAmountIncludingFee: 110 },
    });

    // 99 reaches the recipient, 110 leaves the account.
    expect(op.subOperations?.[0].value).toEqual(new BigNumber(110));
  });
});
