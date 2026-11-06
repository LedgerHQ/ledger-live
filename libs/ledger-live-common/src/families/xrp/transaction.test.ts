import BigNumber from "bignumber.js";
import { fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { Transaction } from "./types";

const ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";

function makeTransaction(fields: Partial<Transaction>) {
  return {
    family: "xrp",
    amount: new BigNumber("2.5").shiftedBy(38),
    recipient: "rRecipient",
    fees: new BigNumber(12),
    networkInfo: null,
    tag: null,
    ...fields,
  } as Transaction;
}

describe("xrp transaction raw conversion", () => {
  it("keeps the mode and the token of an opt-in", () => {
    const transaction = makeTransaction({
      mode: "changeTrust",
      assetReference: "USD",
      assetOwner: ISSUER,
    });

    const revived = fromTransactionRaw(JSON.parse(JSON.stringify(toTransactionRaw(transaction))));

    expect(revived).toMatchObject({
      mode: "changeTrust",
      assetReference: "USD",
      assetOwner: ISSUER,
    });
  });

  it("adds no token field to a native send", () => {
    const raw = toTransactionRaw(makeTransaction({}));

    expect(raw).not.toHaveProperty("mode");
    expect(raw).not.toHaveProperty("assetReference");
    expect(raw).not.toHaveProperty("assetOwner");
  });
});
