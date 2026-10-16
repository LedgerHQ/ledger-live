import type { AccountLike, Operation } from "@ledgerhq/types-live";
import { isTransactionConfirmed } from "./isTransactionConfirmed";

const txid = "test-tx-id";

const operation = (hash: string, blockHeight: number | null | undefined): Operation =>
  ({ id: `op-${hash}`, hash, blockHeight }) as Operation;

const accountWith = (operations: Operation[]): AccountLike =>
  ({ type: "Account", operations }) as unknown as AccountLike;

describe("isTransactionConfirmed", () => {
  it("returns true when the synced operation of the transaction has a block height", async () => {
    const account = accountWith([operation("other", 10), operation(txid, 123456)]);

    await expect(isTransactionConfirmed({ account, hash: txid })).resolves.toBe(true);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["zero", 0],
  ])("returns false when the operation block height is %s", async (_, blockHeight) => {
    const account = accountWith([operation(txid, blockHeight)]);

    await expect(isTransactionConfirmed({ account, hash: txid })).resolves.toBe(false);
  });

  it("returns false when the transaction is not found locally", async () => {
    const account = accountWith([operation("other", 123456)]);

    await expect(isTransactionConfirmed({ account, hash: txid })).resolves.toBe(false);
  });

  it("returns false for an account without operations", async () => {
    await expect(isTransactionConfirmed({ account: accountWith([]), hash: txid })).resolves.toBe(
      false,
    );
  });
});
