import BigNumber from "bignumber.js";
import createTransaction from "../../bridge/createTransaction";
import { accountFixture } from "../../bridge/fixtures";

describe("createTransaction", () => {
  it("returns a dummy transaction", () => {
    expect(createTransaction(accountFixture)).toMatchObject({
      family: "celo",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
      mode: "send",
      index: null,
    });
  });
});
