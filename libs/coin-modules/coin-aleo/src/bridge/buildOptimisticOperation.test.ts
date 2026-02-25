import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
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
      type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
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
      extra: {
        functionId: "",
        transactionType: "public",
      },
    });
  });
});
