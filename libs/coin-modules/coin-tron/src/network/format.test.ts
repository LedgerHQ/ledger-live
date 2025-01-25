import BigNumber from "bignumber.js";
import { formatTrongridTrc20TxResponse } from "./format";
import { Trc20API } from "./types";

describe("formatTrongridTrc20TxResponse", () => {
  it("should return correct TrongridTxInfo for Approval tx type", () => {
    const tx = {
      from: "from",
      to: "to",
      block_timestamp: 1,
      detail: {
        ret: [{ fee: 1 }],
      },
      value: 1,
      transaction_id: "txId",
      token_info: {},
      type: "Approval",
    };
    const result = formatTrongridTrc20TxResponse(tx as unknown as Trc20API);
    expect(result).toEqual({
      txID: "txId",
      date: new Date(1),
      type: "ContractApproval",
      tokenId: undefined,
      from: "from",
      to: "to",
      blockHeight: undefined,
      value: new BigNumber(1),
      fee: new BigNumber(1),
      hasFailed: false,
    });
  });

  it("should return correct TrongridTxInfo for Transfer tx type", () => {
    const tx = {
      from: "from",
      to: "to",
      block_timestamp: 1,
      detail: {
        ret: [{ fee: 1 }],
      },
      value: 1,
      transaction_id: "txId",
      token_info: { address: "tokenId" },
      type: "Transfer",
    };
    const result = formatTrongridTrc20TxResponse(tx as unknown as Trc20API);
    expect(result).toEqual({
      txID: "txId",
      date: new Date(1),
      type: "TriggerSmartContract",
      tokenId: "tokenId",
      from: "from",
      to: "to",
      blockHeight: undefined,
      value: new BigNumber(1),
      fee: new BigNumber(1),
      hasFailed: false,
    });
  });
});
