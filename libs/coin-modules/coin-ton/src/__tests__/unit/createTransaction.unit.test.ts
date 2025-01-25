import BigNumber from "bignumber.js";
import createTransaction from "../../createTransaction";
import { account } from "../fixtures/common.fixtures";

describe("createTransaction", () => {
  it("should create a valid transaction", async () => {
    const res = createTransaction(account);
    expect(res).toEqual({
      family: "ton",
      amount: new BigNumber(0),
      fees: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      comment: {
        isEncrypted: false,
        text: "",
      },
    });
  });
});
