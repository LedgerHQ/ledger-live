import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

describe("buildOptimisticOperation", () => {
  const account = {
    id: "js:2:internet_computer:pubkey:default",
    freshAddress: "sender-address-hex",
    freshAddressPath: "44'/223'/0'/0/0",
  } as Account;

  const transaction = {
    recipient: "recipient-address-hex",
    amount: new BigNumber(50000),
    fees: new BigNumber(10000),
    memo: "12345",
  } as any;

  it("should build an OUT operation with correct value (amount + fees)", async () => {
    const op = await buildOptimisticOperation(account, transaction, "tx-hash-1");

    expect(op.type).toBe("OUT");
    expect(op.hash).toBe("tx-hash-1");
    expect(op.senders).toEqual(["sender-address-hex"]);
    expect(op.recipients).toEqual(["recipient-address-hex"]);
    expect(op.value).toEqual(new BigNumber(60000));
    expect(op.fee).toEqual(new BigNumber(10000));
    expect(op.extra.memo).toBe("12345");
    expect(op.accountId).toBe(account.id);
    expect(op.blockHash).toBeNull();
    expect(op.blockHeight).toBeNull();
    expect(op.date).toBeInstanceOf(Date);
  });
});
