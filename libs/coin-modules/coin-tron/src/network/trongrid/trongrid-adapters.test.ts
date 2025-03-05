import BigNumber from "bignumber.js";
import { TrongridTxInfo } from "../../types";
import { fromTrongridTxInfoToOperation } from "./trongrid-adapters";

describe("fromTrongridTxInfoToOperation", () => {
  it("should convert TrongridTxInfo to Operation", () => {
    const trongridTx: TrongridTxInfo = {
      txID: "txID",
      from: "from",
      tokenId: "tokenId",
      type: "TransferContract",
      hasFailed: false,
      value: new BigNumber(1),
      fee: new BigNumber(2),
      blockHeight: 1,
      to: "to",
      date: new Date(),
    };

    const result = fromTrongridTxInfoToOperation(trongridTx);

    expect(result).toEqual({
      hash: "txID",
      address: "from",
      type: trongridTx.type,
      value: BigInt(1),
      fee: BigInt(2),
      block: { height: 1 },
      senders: ["from"],
      recipients: ["to"],
      date: trongridTx.date,
      details: {
        tokenId: "tokenId",
      },
    });
  });
});
