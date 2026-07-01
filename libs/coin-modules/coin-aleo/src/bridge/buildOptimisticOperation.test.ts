import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { TRANSACTION_TYPE } from "../constants";
import { getMockedAccount, getMockedTokenAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedTransaction } from "../__tests__/fixtures/transaction.fixture";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

describe("buildOptimisticOperation", () => {
  const account = getMockedAccount();
  const tokenSubAccount = getMockedTokenAccount();
  const accountWithToken = getMockedAccount({ subAccounts: [tokenSubAccount] });

  it("should build an OUT operation with correct base fields for native transfer", () => {
    const transaction = getMockedTransaction({
      amount: new BigNumber(5_000_000),
      fees: new BigNumber(34_060),
      recipient: "aleo1recipient123",
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    });

    const operation = buildOptimisticOperation({ account, transaction });

    expect(operation).toEqual({
      id: encodeOperationId(account.id, "", "OUT"),
      hash: "",
      type: "OUT",
      value: transaction.amount,
      fee: transaction.fees,
      blockHash: null,
      blockHeight: null,
      senders: [account.freshAddress],
      recipients: [transaction.recipient],
      accountId: account.id,
      date: expect.any(Date),
      transactionSequenceNumber: expect.any(BigNumber),
      extra: {
        functionId: "transfer_public",
        transactionType: "public",
      },
    });
  });

  it.each([
    [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC, "transfer_token_public", "public"],
    [
      TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE,
      "transfer_token_public_to_private",
      "public",
    ],
  ])(
    "should build a FEES + OUT sub-operation for public token mode %s",
    (mode, functionId, transactionType) => {
      const transaction = getMockedTransaction({
        amount: new BigNumber(1_000_000),
        fees: new BigNumber(34_060),
        recipient: "aleo1recipient123",
        mode,
        subAccountId: tokenSubAccount.id,
      });

      const operation = buildOptimisticOperation({ account: accountWithToken, transaction });

      expect(operation).toMatchObject({
        type: "FEES",
        value: transaction.fees,
        accountId: accountWithToken.id,
        transactionSequenceNumber: expect.any(BigNumber),
        extra: { functionId, transactionType },
      });
      expect(operation.subOperations).toHaveLength(1);
      expect(operation.subOperations?.[0]).toMatchObject({
        type: "OUT",
        value: transaction.amount,
        accountId: tokenSubAccount.id,
        transactionSequenceNumber: operation.transactionSequenceNumber,
        extra: { functionId, transactionType },
      });
    },
  );

  it.each([
    [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE, "transfer_token_private", "private"],
    [
      TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
      "transfer_token_private_to_public",
      "private",
    ],
  ])(
    "should build a FEES operation without sub-operations for token-private mode %s",
    (mode, functionId, transactionType) => {
      const transaction = getMockedTransaction({
        amount: new BigNumber(1_000_000),
        fees: new BigNumber(2_308),
        recipient: "aleo1recipient123",
        mode,
        properties: {
          amountRecordCommitments: ["commitment1"],
          feeRecordCommitment: "feeCommitment1",
        },
      });

      const operation = buildOptimisticOperation({ account, transaction });

      expect(operation.type).toBe("FEES");
      expect(operation.value).toEqual(transaction.fees);
      expect(operation.subOperations).toBeUndefined();
      expect(operation.extra).toEqual({
        functionId,
        transactionType,
      });
    },
  );

  it("should build a FEES + OUT sub-operation for private token transfer with sub-account", () => {
    const transaction = getMockedTransaction({
      amount: new BigNumber(1_000_000),
      fees: new BigNumber(2_308),
      recipient: "aleo1recipient123",
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
      subAccountId: tokenSubAccount.id,
      properties: {
        amountRecordCommitments: ["commitment1"],
        feeRecordCommitment: "feeCommitment1",
      },
    });

    const operation = buildOptimisticOperation({ account: accountWithToken, transaction });

    expect(operation.type).toBe("FEES");
    expect(operation.value).toEqual(transaction.fees);
    expect(operation.subOperations).toHaveLength(1);
    expect(operation.subOperations?.[0]).toMatchObject({
      type: "OUT",
      value: transaction.amount,
      accountId: tokenSubAccount.id,
      transactionSequenceNumber: operation.transactionSequenceNumber,
      extra: {
        functionId: "transfer_token_private",
        transactionType: "private",
      },
    });
  });

  it("should build a FEES operation without sub-operations when the token sub-account is missing", () => {
    const transaction = getMockedTransaction({
      amount: new BigNumber(1_000_000),
      fees: new BigNumber(34_060),
      recipient: "aleo1recipient123",
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
      subAccountId: "missing-sub-account-id",
    });

    const operation = buildOptimisticOperation({ account, transaction });

    expect(operation).toEqual({
      id: encodeOperationId(account.id, "", "FEES"),
      hash: "",
      type: "FEES",
      value: transaction.fees,
      fee: transaction.fees,
      blockHash: null,
      blockHeight: null,
      senders: [account.freshAddress],
      recipients: [transaction.recipient],
      accountId: account.id,
      date: expect.any(Date),
      transactionSequenceNumber: expect.any(BigNumber),
      extra: {
        functionId: "transfer_token_public",
        transactionType: "public",
      },
    });
  });

  it.each([
    [TRANSACTION_TYPE.BOND_PUBLIC, "bond_public", "BOND"],
    [TRANSACTION_TYPE.UNBOND_PUBLIC, "unbond_public", "UNBOND"],
    [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC, "claim_unbond_public", "WITHDRAW_UNBONDED"],
  ])(
    "should build a %s operation with type '%s' for staking mode %s",
    (mode, functionId, expectedType) => {
      const transaction = getMockedTransaction({
        amount: new BigNumber(5_000_000),
        fees: new BigNumber(34_060),
        recipient: "aleo1recipient123",
        mode,
      });

      const operation = buildOptimisticOperation({ account, transaction });

      expect(operation).toEqual({
        id: encodeOperationId(account.id, "", expectedType),
        hash: "",
        type: expectedType,
        value: transaction.amount,
        fee: transaction.fees,
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        accountId: account.id,
        date: expect.any(Date),
        transactionSequenceNumber: expect.any(BigNumber),
        extra: {
          functionId,
          transactionType: "public",
        },
      });
    },
  );
});
