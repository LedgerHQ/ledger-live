import BigNumber from "bignumber.js";
import {
  decode58Check,
  encode58Check,
  formatTrongridTrc20TxResponse,
  formatTrongridTxResponse,
} from "./format";
import { Trc20API, TransactionTronAPI } from "./types";
import type { TronTransactionInfo } from "../types";

const ownerHex = "41fd49eda0f23ff7ec1d03b52c3a45991c24cd440e";
const toHex = "4198927ffb9f554dc4a453c64b2e553a02d6df514b";
const trc20ContractHex = "4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0";

function baseTransactionTronApi(
  contract: TransactionTronAPI["raw_data"]["contract"][0],
  overrides: Partial<TransactionTronAPI & { detail?: TronTransactionInfo }> = {},
): TransactionTronAPI & { detail?: TronTransactionInfo } {
  return {
    ret: [{ contractRet: "SUCCESS", fee: 1000 }],
    signature: [],
    txID: "txId",
    net_usage: 0,
    raw_data_hex: "",
    net_fee: 0,
    energy_usage: 0,
    block_timestamp: 1,
    blockNumber: 42,
    energy_fee: 0,
    energy_usage_total: 0,
    raw_data: {
      contract: [contract],
      ref_block_bytes: "",
      ref_block_hash: "",
      expiration: 0,
    },
    internal_transactions: [],
    ...overrides,
  };
}

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
    // owner_address is the Tron tx initiator (hex); `from` is the TRC20 token source (base58)
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

describe("formatTrongridTxResponse", () => {
  it("should return correct TrongridTxInfo for TransferContract", async () => {
    const tx = baseTransactionTronApi({
      type: "TransferContract",
      parameter: {
        type_url: "",
        value: {
          owner_address: ownerHex,
          to_address: toHex,
          amount: 1_000_000,
        },
      },
    });
    const result = await formatTrongridTxResponse(tx, () => Promise.resolve(null));
    expect(result).toEqual({
      txID: "txId",
      date: new Date(1),
      type: "TransferContract",
      tokenId: undefined,
      tokenType: undefined,
      tokenAddress: undefined,
      from: encode58Check(ownerHex),
      to: encode58Check(toHex),
      value: new BigNumber(1_000_000),
      fee: new BigNumber(1000),
      blockHeight: 42,
      hasFailed: false,
      feesPayer: encode58Check(ownerHex),
    });
  });

  it("should set hasFailed when contract execution did not succeed", async () => {
    const tx = baseTransactionTronApi(
      {
        type: "TransferContract",
        parameter: {
          type_url: "",
          value: {
            owner_address: ownerHex,
            to_address: toHex,
            amount: 100,
          },
        },
      },
      { ret: [{ contractRet: "REVERT", fee: 0 }] },
    );
    const result = await formatTrongridTxResponse(tx, () => Promise.resolve(null));
    expect(result?.hasFailed).toBe(true);
  });

  it("should return correct TrongridTxInfo for TransferAssetContract", async () => {
    const assetName = "10013004";
    const tx = baseTransactionTronApi({
      type: "TransferAssetContract",
      parameter: {
        type_url: "",
        value: {
          owner_address: ownerHex,
          to_address: toHex,
          amount: 100,
          asset_name: assetName,
        },
      },
    });
    const result = await formatTrongridTxResponse(tx, () => Promise.resolve(null));
    expect(result).toEqual({
      txID: "txId",
      date: new Date(1),
      type: "TransferAssetContract",
      tokenId: assetName,
      tokenType: "trc10",
      tokenAddress: undefined,
      from: encode58Check(ownerHex),
      to: encode58Check(toHex),
      value: new BigNumber(100),
      fee: new BigNumber(1000),
      blockHeight: 42,
      hasFailed: false,
      feesPayer: encode58Check(ownerHex),
    });
  });

  it("should return correct TrongridTxInfo for TriggerSmartContract", async () => {
    const tx = baseTransactionTronApi({
      type: "TriggerSmartContract",
      parameter: {
        type_url: "",
        value: {
          owner_address: ownerHex,
          to_address: toHex,
          contract_address: trc20ContractHex,
          amount: 0,
        },
      },
    });
    const result = await formatTrongridTxResponse(tx, () => Promise.resolve(null));
    expect(result).toEqual({
      txID: "txId",
      date: new Date(1),
      type: "TriggerSmartContract",
      tokenId: encode58Check(trc20ContractHex),
      tokenType: "trc20",
      tokenAddress: encode58Check(trc20ContractHex),
      from: encode58Check(ownerHex),
      to: encode58Check(toHex),
      value: new BigNumber(0),
      fee: new BigNumber(1000),
      blockHeight: 42,
      hasFailed: false,
      feesPayer: encode58Check(ownerHex),
    });
  });

  it("should map withdraw amount for WithdrawBalanceContract", async () => {
    const tx = baseTransactionTronApi(
      {
        type: "WithdrawBalanceContract",
        parameter: {
          type_url: "",
          value: {
            owner_address: ownerHex,
          },
        },
      },
      { withdraw_amount: 5_000_000 },
    );
    const result = await formatTrongridTxResponse(tx, () => Promise.resolve(null));
    expect(result?.value).toEqual(new BigNumber(5_000_000));
  });

  it("should map quant for ExchangeTransactionContract", async () => {
    const tx = baseTransactionTronApi({
      type: "ExchangeTransactionContract",
      parameter: {
        type_url: "",
        value: {
          owner_address: ownerHex,
          quant: 777,
        },
      },
    });
    const result = await formatTrongridTxResponse(tx, () => Promise.resolve(null));
    expect(result?.value).toEqual(new BigNumber(777));
  });

  it("should attach vote extra info using getValidatorName", async () => {
    const voteAddressHex = "41b183301d6301fae224c6ab9b28b19b6d1625bf23";
    const getValidatorName = jest
      .fn()
      .mockImplementation(async (address: string) =>
        address === encode58Check(voteAddressHex) ? "SR-Name" : null,
      );
    const tx = baseTransactionTronApi({
      type: "VoteWitnessContract",
      parameter: {
        type_url: "",
        value: {
          owner_address: ownerHex,
          votes: [{ vote_address: voteAddressHex, vote_count: 3 }],
        },
      },
    });
    const result = await formatTrongridTxResponse(tx, getValidatorName);
    expect(getValidatorName).toHaveBeenCalledWith(encode58Check(voteAddressHex));
    expect(result?.extra).toEqual({
      votes: [
        {
          name: "SR-Name",
          address: encode58Check(voteAddressHex),
          voteCount: 3,
        },
      ],
    });
  });

  it("should return undefined when the transaction payload cannot be parsed", async () => {
    const tx = { txID: "broken", block_timestamp: 1 } as TransactionTronAPI;
    const result = await formatTrongridTxResponse(tx, () => Promise.resolve(null));
    expect(result).toBeUndefined();
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
