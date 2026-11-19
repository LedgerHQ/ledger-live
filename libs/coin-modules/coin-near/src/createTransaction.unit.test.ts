import BigNumber from "bignumber.js";
import { createTransaction } from "./createTransaction";
import type { NearAccount } from "./types";

describe("createTransaction", () => {
  it("returns a zero-valued send draft with a zero nonce", () => {
    const transaction = createTransaction({} as NearAccount);

    expect(transaction).toEqual({
      family: "near",
      mode: "send",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: new BigNumber(0),
      nonce: new BigNumber(0),
    });
  });
});
