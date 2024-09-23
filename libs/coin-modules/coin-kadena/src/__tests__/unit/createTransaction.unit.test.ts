import BigNumber from "bignumber.js";
import { KDA_FEES, KDA_GAS_LIMIT_TRANSFER } from "../../constants";
import { createTransaction } from "../../prepareTransaction";

describe("createTransaction", () => {
  it("should create a valid transaction", async () => {
    const res = createTransaction();
    expect(res).toEqual({
      family: "kadena",
      amount: new BigNumber(0),
      gasLimit: KDA_GAS_LIMIT_TRANSFER,
      gasPrice: KDA_FEES,
      recipient: "",
      useAllAmount: false,
      receiverChainId: 0,
      senderChainId: 0,
    });
  });
});
