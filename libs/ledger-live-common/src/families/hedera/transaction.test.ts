import BigNumber from "bignumber.js";
import { fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { HederaGenericTransaction } from "./types";

describe("hedera transaction serialization", () => {
  it("round-trips a staking transaction", () => {
    const transaction: HederaGenericTransaction = {
      family: "hedera",
      mode: "delegate",
      amount: new BigNumber(0),
      recipient: "0.0.7654321",
      fees: new BigNumber("100000000"),
      valId: "3",
    };

    const raw = toTransactionRaw(transaction);

    expect(raw).toMatchObject({ mode: "delegate", fees: "100000000", valId: "3" });
    expect(fromTransactionRaw(raw)).toEqual(transaction);
  });

  it("round-trips a token transfer", () => {
    const transaction: HederaGenericTransaction = {
      family: "hedera",
      mode: "send",
      amount: new BigNumber(500),
      recipient: "0.0.7654321",
      fees: null,
      assetReference: "0.0.1234567",
      assetOwner: "0.0.1111111",
    };

    expect(fromTransactionRaw(toTransactionRaw(transaction))).toEqual(transaction);
  });

  it("revives missing fees as null", () => {
    const revived = fromTransactionRaw(
      toTransactionRaw({
        family: "hedera",
        mode: "send",
        amount: new BigNumber(1),
        recipient: "0.0.7654321",
      }),
    );

    expect(revived.fees).toBeNull();
    expect(revived.valId).toBeUndefined();
  });
});
