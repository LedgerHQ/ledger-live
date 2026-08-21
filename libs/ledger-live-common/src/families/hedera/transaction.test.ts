import BigNumber from "bignumber.js";
import type { GenericTransaction } from "../../bridge/generic-coin-framework/types";
import { fromTransactionRaw, toTransactionRaw } from "./transaction";

describe("hedera transaction serialization", () => {
  it("survives a toTransactionRaw -> fromTransactionRaw round trip for a staking transaction carrying valId", () => {
    const transaction: GenericTransaction = {
      family: "hedera",
      mode: "delegate",
      amount: new BigNumber(0),
      recipient: "0.0.7654321",
      fees: new BigNumber("100000000"),
      valId: "3",
    };

    const raw = toTransactionRaw(transaction);
    expect(raw).toMatchObject({
      family: "hedera",
      mode: "delegate",
      fees: "100000000",
      valId: "3",
    });

    const revived = fromTransactionRaw(raw);
    expect(revived.family).toBe("hedera");
    expect(revived.mode).toBe("delegate");
    expect(revived.valId).toBe("3");
    expect(revived.fees).toBeInstanceOf(BigNumber);
    expect(revived.fees?.toString()).toBe("100000000");
    expect(revived.amount.toString()).toBe("0");
    expect(revived.recipient).toBe("0.0.7654321");
  });

  it("survives a round trip for a token transfer carrying assetReference/assetOwner", () => {
    const transaction: GenericTransaction = {
      family: "hedera",
      mode: "send",
      amount: new BigNumber(500),
      recipient: "0.0.7654321",
      fees: null,
      assetReference: "0.0.1234567",
      assetOwner: "0.0.1111111",
    };

    const revived = fromTransactionRaw(toTransactionRaw(transaction));

    expect(revived.assetReference).toBe("0.0.1234567");
    expect(revived.assetOwner).toBe("0.0.1111111");
    expect(revived.fees).toBeNull();
  });

  it("round-trips a transaction with no fees/valId/asset fields set (plain send)", () => {
    const transaction: GenericTransaction = {
      family: "hedera",
      mode: "send",
      amount: new BigNumber(1),
      recipient: "0.0.7654321",
    };

    const revived = fromTransactionRaw(toTransactionRaw(transaction));

    expect(revived.valId).toBeUndefined();
    expect(revived.assetReference).toBeUndefined();
    expect(revived.assetOwner).toBeUndefined();
    expect(revived.fees).toBeNull();
  });

  it("survives a round trip for a send with a memo — dropped before this round", () => {
    const transaction: GenericTransaction = {
      family: "hedera",
      mode: "send",
      amount: new BigNumber(1),
      recipient: "0.0.7654321",
      memoType: "string",
      memoValue: "ref-42",
    };

    const raw = toTransactionRaw(transaction);
    expect(raw).toMatchObject({ memoType: "string", memoValue: "ref-42" });

    const revived = fromTransactionRaw(raw);
    expect(revived.memoType).toBe("string");
    expect(revived.memoValue).toBe("ref-42");
  });

  it("round-trips a transaction with no memo set (memoType/memoValue stay unset, not coerced)", () => {
    const transaction: GenericTransaction = {
      family: "hedera",
      mode: "send",
      amount: new BigNumber(1),
      recipient: "0.0.7654321",
    };

    const revived = fromTransactionRaw(toTransactionRaw(transaction));

    expect(revived.memoType).toBeUndefined();
    expect(revived.memoValue).toBeUndefined();
  });
});
