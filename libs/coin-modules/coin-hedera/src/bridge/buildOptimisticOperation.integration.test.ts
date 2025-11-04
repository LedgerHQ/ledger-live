import BigNumber from "bignumber.js";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedTokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";

describe("buildOptimisticOperation", () => {
  let estimatedFees: Record<"crypto" | "associate", BigNumber>;

  beforeAll(async () => {
    const mockedAccount = getMockedAccount();
    const [crypto, associate] = await Promise.all([
      estimateFees(mockedAccount.currency, HEDERA_OPERATION_TYPES.CryptoTransfer),
      estimateFees(mockedAccount.currency, HEDERA_OPERATION_TYPES.TokenAssociate),
    ]);

    estimatedFees = { crypto, associate };
  });

  test("builds optimistic operation for token association", async () => {
    const mockedAccount = getMockedAccount();
    const mockedToken = getMockedTokenCurrency();
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      amount: new BigNumber(0),
      recipient: "0.0.1234",
      properties: {
        token: mockedToken,
      },
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("ASSOCIATE_TOKEN");
    expect(op.extra).toEqual({ associatedTokenId: mockedToken.contractAddress });
    expect(op.fee).toEqual(estimatedFees.associate);
    expect(op.senders).toContain(mockedAccount.freshAddress);
    expect(op.recipients).toContain("0.0.1234");
  });

  test("builds optimistic operation for coin", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      amount: new BigNumber(123),
      recipient: "0.0.5678",
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("OUT");
    expect(op.fee).toEqual(estimatedFees.crypto);
    expect(op.value).toEqual(new BigNumber(123));
    expect(op.senders).toContain(mockedAccount.freshAddress);
    expect(op.recipients).toContain("0.0.5678");
  });

  test("builds optimistic operation for token", async () => {
    const mockedTokenCurrency = getMockedTokenCurrency();
    const tokenAccount = getMockedTokenAccount(mockedTokenCurrency);
    const parentAccount = getMockedAccount({ subAccounts: [tokenAccount] });
    const mockedTransaction = getMockedTransaction({
      subAccountId: tokenAccount.id,
      amount: new BigNumber(123),
      recipient: "0.0.9999",
    });

    const op = await buildOptimisticOperation({
      account: parentAccount,
      transaction: mockedTransaction,
    });
    const subOp = op.subOperations![0];

    expect(op.type).toBe("FEES");
    expect(op.subOperations).toHaveLength(1);
    expect(subOp.type).toBe("OUT");
    expect(subOp.value).toEqual(new BigNumber(123));
    expect(subOp.accountId).toBe(tokenAccount.id);
    expect(subOp.recipients).toContain("0.0.9999");
  });
});
