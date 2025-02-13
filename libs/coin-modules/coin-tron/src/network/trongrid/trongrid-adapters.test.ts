import BigNumber from "bignumber.js";
import { TrongridTxInfo } from "../../types";
import { fromTrongridTxInfoToOperation } from "./trongrid-adapters";

describe("fromTrongridTxToOperation", () => {
  it("should convert TrongridTxInfo to Operation", () => {
    // GIVEN
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

    // WHEN
    const result = fromTrongridTxInfoToOperation(trongridTx);

    // THEN
    expect(result).toEqual({
      hash: "txID",
      address: "from",
      type: trongridTx.type,
      value: "value",
      fee: "fee",
      block: 1,
      senders: ["from"],
      recipients: ["to"],
      date: trongridTx.date,
      transactionSequenceNumber: null,
      details: {
        tokenId: "tokenId",
      },
    });
  });
});
