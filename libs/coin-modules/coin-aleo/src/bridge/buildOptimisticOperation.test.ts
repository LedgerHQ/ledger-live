import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { TRANSACTION_TYPE } from "../constants";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedTransaction } from "../__tests__/fixtures/transaction.fixture";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

describe("buildOptimisticOperation", () => {
  const account = getMockedAccount();

  it("should build an OUT operation with correct base fields", () => {
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
    [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE, "transfer_token_private", "private"],
    [
      TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
      "transfer_token_private_to_public",
      "private",
    ],
  ])(
    "should build an optimistic operation for token-private mode %s",
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

      expect(operation.extra).toEqual({
        functionId,
        transactionType,
      });
    },
  );
});
