import BigNumber from "bignumber.js";
import { decode58Check, encode58Check, formatTrongridTrc20TxResponse } from "./format";
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
      token_info: { address: "addr" },
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
      tokenType: "trc20",
      tokenAddress: "addr",
      feesPayer: "from",
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
      tokenType: "trc20",
      tokenAddress: "tokenId",
      feesPayer: "from",
    });
  });

  it("should set feesPayer from owner_address when it differs from from (transferFrom case)", () => {
    // owner_address is the Tron tx initiator (hex); `from` is the ERC20 token source (base58)
    const tx = {
      from: "TTokenSourceAddress",
      to: "to",
      block_timestamp: 1,
      detail: {
        ret: [{ fee: 1 }],
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  // hex for TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh
                  owner_address: "41f1fe9d73ffb3b6ab532858b266c02f63410fbd70",
                },
              },
            },
          ],
        },
      },
      value: 100,
      transaction_id: "txId",
      token_info: { address: "tokenAddr" },
      type: "Transfer",
    };
    const result = formatTrongridTrc20TxResponse(tx as unknown as Trc20API);
    expect(result).toEqual({
      txID: "txId",
      date: new Date(1),
      type: "TriggerSmartContract",
      tokenId: "tokenAddr",
      from: "TTokenSourceAddress",
      to: "to",
      blockHeight: undefined,
      value: new BigNumber(100),
      fee: new BigNumber(1),
      hasFailed: false,
      tokenType: "trc20",
      tokenAddress: "tokenAddr",
      feesPayer: "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh",
    });
  });
});

describe("decode58Check", () => {
  it("decodes correctly Tron address", () => {
    expect(decode58Check("TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh")).toEqual(
      "41f1fe9d73ffb3b6ab532858b266c02f63410fbd70",
    );
  });
});

describe("encode58Check", () => {
  it("encodes correctly Tron address", () => {
    expect(encode58Check("41f1fe9d73ffb3b6ab532858b266c02f63410fbd70")).toEqual(
      "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh",
    );
  });
});
