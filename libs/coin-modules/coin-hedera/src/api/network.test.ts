import BigNumber from "bignumber.js";
import { TransferTransaction } from "@hashgraph/sdk";
import type { Account } from "@ledgerhq/types-live";
import { buildUnsignedTransaction } from "./network";
import { Transaction } from "../types";

describe("buildUnsignedTransaction", () => {
  const mockAccount = {
    freshAddress: "0.0.123",
    id: "hedera:0:0.0.123",
    balance: new BigNumber(1000),
  } as Account;

  test("builds basic transaction without maxFee", async () => {
    const transaction: Transaction = {
      family: "hedera",
      amount: new BigNumber(100),
      recipient: "0.0.456",
      memo: "test memo",
    };

    const result = await buildUnsignedTransaction({ account: mockAccount, transaction });

    expect(result).toBeInstanceOf(TransferTransaction);
    expect(result.transactionMemo).toBe("test memo");
    expect(result.isFrozen()).toBe(true);
    expect(result.hbarTransfers.size).toBe(2);

    const senderTransfer = result.hbarTransfers.get("0.0.123");
    const recipientTransfer = result.hbarTransfers.get("0.0.456");

    expect(senderTransfer?.toTinybars().toNumber()).toBe(-100);
    expect(recipientTransfer?.toTinybars().toNumber()).toBe(100);
  });

  test("sets max transaction fee when provided", async () => {
    const transaction: Transaction = {
      family: "hedera",
      amount: new BigNumber(100),
      recipient: "0.0.456",
      maxFee: new BigNumber(50),
    };

    const result = await buildUnsignedTransaction({ account: mockAccount, transaction });
    expect(result.maxTransactionFee?.toTinybars().toNumber()).toBe(50);
  });
});
