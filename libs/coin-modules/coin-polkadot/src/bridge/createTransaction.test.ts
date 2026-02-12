/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import createTransaction from "./createTransaction";

describe("createTransaction", () => {
  it("should return a default transaction", () => {
    expect(createTransaction({} as AccountLike)).toEqual({
      family: "polkadot",
      mode: "send",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
      validators: [],
      era: null,
      rewardDestination: null,
      numSlashingSpans: Number(0),
    });
  });
});
