import type { BlockOperation } from "@ledgerhq/coin-module-framework/api/index";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { TronCoinConfig } from "../config";
import {
  getBlock as networkGetBlock,
  getBlockWithTransactions,
  getTransactionInfoByBlockNum,
} from "../network";
import { encode58Check } from "../network/format";
import { block82524825, block82524825TxInfos } from "./__fixtures__/block82524825";
import * as trxSwap from "./__fixtures__/trxSwap88336767";
import { getBlock, getBlockInfo } from "./getBlock";

jest.mock("../network", () => ({
  getBlock: jest.fn(),
  getBlockWithTransactions: jest.fn(),
  getTransactionInfoByBlockNum: jest.fn(),
}));

const mockGetTransactionInfoByBlockNum = getTransactionInfoByBlockNum as jest.Mock;

const slot = (hex: string) => hex.padStart(64, "0");
const transferPair = (tokenHex: string, fromHex: string, toHex: string, amount: bigint) => {
  const asset = { type: "trc20", assetReference: encode58Check(tokenHex) };
  return [
    {
      type: "transfer",
      address: encode58Check(fromHex),
      peer: encode58Check(toHex),
      asset,
      amount: -amount,
    },
    {
      type: "transfer",
      address: encode58Check(toHex),
      peer: encode58Check(fromHex),
      asset,
      amount,
    },
  ];
};

const internalTransfersOf = (operations: BlockOperation[]) =>
  operations.filter(op => op.type === "transfer");

const mockLogger: Logger = jest.fn();

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

const pair = (from: string, to: string, asset: unknown, amount: bigint) => [
  { type: "transfer", address: from, peer: to, asset, amount: -amount },
  { type: "transfer", address: to, peer: from, asset, amount },
];
const transfersOf = async () => {
  const { transactions } = await getBlock(mockLogger, mockConfig, 100);
  return internalTransfersOf(transactions[0].operations);
};

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw for invalid height", async () => {
    await expect(getBlockInfo(mockLogger, mockConfig, 0)).rejects.toThrow(
      "Invalid block height: 0",
    );
    await expect(getBlockInfo(mockLogger, mockConfig, -1)).rejects.toThrow(
      "Invalid block height: -1",
    );
    await expect(getBlockInfo(mockLogger, mockConfig, 1.5)).rejects.toThrow(
      "Invalid block height: 1.5",
    );
    await expect(getBlockInfo(mockLogger, mockConfig, NaN)).rejects.toThrow(
      "Invalid block height: NaN",
    );
    await expect(getBlockInfo(mockLogger, mockConfig, Infinity)).rejects.toThrow(
      "Invalid block height: Infinity",
    );
    expect(networkGetBlock).not.toHaveBeenCalled();
  });

  it("should return block info from network", async () => {
    (networkGetBlock as jest.Mock).mockResolvedValue({
      height: 100,
      hash: "blockhash",
      time: new Date(1700000000000),
    });

    const result = await getBlockInfo(mockLogger, mockConfig, 100);

    expect(result).toEqual({
      height: 100,
      hash: "blockhash",
      time: new Date(1700000000000),
    });
    expect(networkGetBlock).toHaveBeenCalledWith(mockLogger, mockConfig, 100);
  });
});

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactionInfoByBlockNum.mockResolvedValue([]);
  });

  it("should throw for invalid height", async () => {
    await expect(getBlock(mockLogger, mockConfig, 0)).rejects.toThrow("Invalid block height: 0");
    await expect(getBlock(mockLogger, mockConfig, -1)).rejects.toThrow("Invalid block height: -1");
    await expect(getBlock(mockLogger, mockConfig, 1.5)).rejects.toThrow(
      "Invalid block height: 1.5",
    );
    await expect(getBlock(mockLogger, mockConfig, NaN)).rejects.toThrow(
      "Invalid block height: NaN",
    );
    await expect(getBlock(mockLogger, mockConfig, Infinity)).rejects.toThrow(
      "Invalid block height: Infinity",
    );
    expect(getBlockWithTransactions).not.toHaveBeenCalled();
  });

  it("should map TRX transfer to transfer operations", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000, parentHash: "parent" } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS", fee: 1000 }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].hash).toBe("tx1");
    expect(result.transactions[0].failed).toBe(false);
    expect(result.transactions[0].operations).toHaveLength(2);
    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      asset: { type: "native" },
      amount: BigInt(-1000000),
    });
    expect(result.transactions[0].operations[1]).toMatchObject({
      type: "transfer",
      asset: { type: "native" },
      amount: BigInt(1000000),
    });
    expect(getBlockWithTransactions).toHaveBeenCalledWith(mockLogger, mockConfig, 100);
  });

  it("should map TRC10 transfer to transfer operations", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferAssetContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 500000,
                    asset_name: "31303030303031",
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      asset: { type: "trc10", assetReference: "1000001" },
    });
  });

  it("should map TRC20 transfer to transfer operations", async () => {
    const contractAddress = "41aabbccdd11223344556677889900aabbccdd1122";
    const recipientHex = "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5";
    const amountHex = "00000000000000000000000000000000000000000000000000000000000f4240";
    const transferData = "a9059cbb" + recipientHex.padStart(64, "0") + amountHex;

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TriggerSmartContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    contract_address: contractAddress,
                    data: transferData,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);
    const expectedAssetReference = encode58Check(contractAddress);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].operations).toHaveLength(2);
    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      asset: { type: "trc20", assetReference: expectedAssetReference },
      amount: BigInt(-1000000),
    });
    expect(result.transactions[0].operations[1]).toMatchObject({
      type: "transfer",
      asset: { type: "trc20", assetReference: expectedAssetReference },
      amount: BigInt(1000000),
    });
  });

  // Same transaction as the /operations regression: block 85277401 holds a TRC20 deployed and
  // minted in one go, whose transfer exists only as an event log.
  it("should map a TRC20 minted by a contract creation to transfer operations", async () => {
    const deployerHex = "41679c8dd7488038252f935ca3465fbc94d29a940f";

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 85277401, timestamp: 1786503237000 } },
      transactions: [
        {
          txID: "4d8f740330ec0c2158cd29db807c98b2c8ba11f7217e645d5c4421106138a399",
          raw_data: {
            contract: [
              {
                type: "CreateSmartContract",
                parameter: {
                  value: {
                    owner_address: deployerHex,
                    new_contract: { name: "Token", origin_address: deployerHex },
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS", fee: 57131600 }],
        },
      ],
    });
    mockGetTransactionInfoByBlockNum.mockResolvedValue([
      {
        id: "4d8f740330ec0c2158cd29db807c98b2c8ba11f7217e645d5c4421106138a399",
        fee: 57131600,
        contract_address: "411fd80baee7c53e92e69447ff8c48d6b3a008572f",
        log: [
          {
            address: "1fd80baee7c53e92e69447ff8c48d6b3a008572f",
            topics: [
              "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0000000000000000000000000000000000000000000000000000000000000000",
              "000000000000000000000000679c8dd7488038252f935ca3465fbc94d29a940f",
            ],
            data: "00000000000000000000000000000000000004ee2d6d415b85acef8100000000",
          },
        ],
      },
    ]);

    const result = await getBlock(mockLogger, mockConfig, 85277401);
    const amount = BigInt("100000000000000000000000000000000");

    expect(result.transactions).toHaveLength(1);
    // The deployer paid for the deployment; the mint itself comes from the zero address.
    expect(result.transactions[0].feesPayer).toBe(encode58Check(deployerHex));
    expect(result.transactions[0].operations).toEqual([
      {
        type: "transfer",
        address: encode58Check("41" + "0".repeat(40)),
        peer: encode58Check(deployerHex),
        asset: { type: "trc20", assetReference: "TCsam7uH3NbYLpKMCAayquN4Qwm3q717qu" },
        amount: -amount,
      },
      {
        type: "transfer",
        address: encode58Check(deployerHex),
        peer: encode58Check("41" + "0".repeat(40)),
        asset: { type: "trc20", assetReference: "TCsam7uH3NbYLpKMCAayquN4Qwm3q717qu" },
        amount,
      },
    ]);
  });

  it("should map every constructor mint of a contract creation, not just the first", async () => {
    const deployerHex = "41679c8dd7488038252f935ca3465fbc94d29a940f";
    const transferTopic = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const mintedTo = "000000000000000000000000679c8dd7488038252f935ca3465fbc94d29a940f";
    const amountData = "0000000000000000000000000000000000000000000000000000000000000064";

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "CreateSmartContract",
                parameter: {
                  value: { owner_address: deployerHex, new_contract: { name: "Token" } },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });
    mockGetTransactionInfoByBlockNum.mockResolvedValue([
      {
        id: "tx1",
        fee: 0,
        log: [
          {
            address: "1fd80baee7c53e92e69447ff8c48d6b3a008572f",
            topics: [transferTopic, "0".repeat(64), mintedTo],
            data: amountData,
          },
          {
            address: "a614f803b6fd780986a42c78ec9c7f77e6ded13c",
            topics: [transferTopic, "0".repeat(64), mintedTo],
            data: amountData,
          },
        ],
      },
    ]);

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions[0].operations).toHaveLength(4);
    expect(
      result.transactions[0].operations.map(
        op => (op as { asset: { assetReference: string } }).asset.assetReference,
      ),
    ).toEqual([
      "TCsam7uH3NbYLpKMCAayquN4Qwm3q717qu",
      "TCsam7uH3NbYLpKMCAayquN4Qwm3q717qu",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    ]);
  });

  it("should map a contract creation with no token event to a plain operation", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "CreateSmartContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    new_contract: { name: "Whatever" },
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions[0].operations).toEqual([
      { type: "other", operationType: "NONE", contractType: "CreateSmartContract" },
    ]);
  });

  it("should map TriggerSmartContract without transfer data to other operations", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TriggerSmartContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    contract_address: "41aabbccdd11223344556677889900aabbccdd1122",
                    data: "12345678",
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "other",
      operationType: "NONE",
      contractType: "TriggerSmartContract",
    });
  });

  describe("TRC20 transfers of smart contract calls", () => {
    const transferTopic = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const callerHex = "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
    const recipientHex = "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5";
    const routerHex = "41aabbccdd11223344556677889900aabbccdd1122";
    const tokenAHex = "411fd80baee7c53e92e69447ff8c48d6b3a008572f";
    const tokenBHex = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const addressTopic = (tronHex: string) => slot(tronHex.slice(2));
    const transferLog = (tokenHex: string, fromHex: string, toHex: string, amount: number) => ({
      address: tokenHex.slice(2),
      topics: [transferTopic, addressTopic(fromHex), addressTopic(toHex)],
      data: slot(amount.toString(16)),
    });
    const triggerSmartContractBlock = (
      contractAddress: string,
      data: string,
      contractRet: string = "SUCCESS",
    ) => ({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TriggerSmartContract",
                parameter: {
                  value: { owner_address: callerHex, contract_address: contractAddress, data },
                },
              },
            ],
          },
          ret: [{ contractRet }],
        },
      ],
    });
    it("should read a direct transfer() from its Transfer event only, without double counting", async () => {
      const transferData = "a9059cbb" + slot(recipientHex.slice(2)) + slot((1000000).toString(16));
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        triggerSmartContractBlock(tokenAHex, transferData),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        { id: "tx1", fee: 0, log: [transferLog(tokenAHex, callerHex, recipientHex, 1000000)] },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].operations).toEqual(
        transferPair(tokenAHex, callerHex, recipientHex, 1000000n),
      );
    });

    it("should map every Transfer event of a swap or transferFrom, whatever the call data", async () => {
      // A router swap: the caller pays token A into the pool, the pool pays token B to a recipient.
      // Neither party is in the call data, and the called contract is not the token.
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        triggerSmartContractBlock(routerHex, "38ed1739" + slot("01")),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        {
          id: "tx1",
          fee: 0,
          log: [
            transferLog(tokenAHex, callerHex, routerHex, 500),
            { address: routerHex.slice(2), topics: ["1c411e9a" + "0".repeat(56)], data: "" },
            transferLog(tokenBHex, routerHex, recipientHex, 700),
          ],
        },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].operations).toEqual([
        ...transferPair(tokenAHex, callerHex, routerHex, 500n),
        ...transferPair(tokenBHex, routerHex, recipientHex, 700n),
      ]);
    });

    it("should skip zero-amount Transfer events", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        triggerSmartContractBlock(routerHex, "12345678"),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        { id: "tx1", fee: 0, log: [transferLog(tokenAHex, callerHex, recipientHex, 0)] },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].operations).toEqual([
        { type: "other", operationType: "NONE", contractType: "TriggerSmartContract" },
      ]);
    });

    it("should map a successful call whose receipt has no Transfer event to a plain operation", async () => {
      const transferData = "a9059cbb" + slot(recipientHex.slice(2)) + slot((1000000).toString(16));
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        triggerSmartContractBlock(tokenAHex, transferData),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([{ id: "tx1", fee: 0, log: [] }]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].operations).toEqual([
        { type: "other", operationType: "NONE", contractType: "TriggerSmartContract" },
      ]);
    });

    it("should keep the call data transfer of a failed transfer() call", async () => {
      const transferData = "a9059cbb" + slot(recipientHex.slice(2)) + slot((1000000).toString(16));
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        triggerSmartContractBlock(tokenAHex, transferData, "REVERT"),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([{ id: "tx1", fee: 300, log: [] }]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].failed).toBe(true);
      expect(result.transactions[0].operations).toEqual(
        transferPair(tokenAHex, callerHex, recipientHex, 1000000n),
      );
    });

    it("should map an approve() call to an APPROVE operation on the token", async () => {
      const approveData = "095ea7b3" + slot(routerHex.slice(2)) + "f".repeat(64);
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        triggerSmartContractBlock(tokenAHex, approveData),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        {
          id: "tx1",
          fee: 0,
          log: [
            {
              address: tokenAHex.slice(2),
              topics: [
                "8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
                addressTopic(callerHex),
                addressTopic(routerHex),
              ],
              data: "f".repeat(64),
            },
          ],
        },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].feesPayer).toBe(encode58Check(callerHex));
      expect(result.transactions[0].operations).toEqual([
        {
          type: "other",
          operationType: "APPROVE",
          contractType: "TriggerSmartContract",
          asset: { type: "trc20", assetReference: encode58Check(tokenAHex) },
          spender: encode58Check(routerHex),
        },
      ]);
    });

    it("should map a failed approve() call to an APPROVE operation too", async () => {
      const approveData = "095ea7b3" + slot(routerHex.slice(2)) + slot("00");
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        triggerSmartContractBlock(tokenAHex, approveData, "OUT_OF_ENERGY"),
      );

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].failed).toBe(true);
      expect(result.transactions[0].operations).toEqual([
        expect.objectContaining({ type: "other", operationType: "APPROVE" }),
      ]);
    });

    // TRC721 `approve(address,uint256)` has the same selector as the TRC20 one: only the receipt
    // tells them apart, since an NFT `Approval` indexes the token id as a fourth topic.
    it("should not map an NFT approve() call to an APPROVE operation", async () => {
      const approveData = "095ea7b3" + slot(routerHex.slice(2)) + slot("07");
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        triggerSmartContractBlock(tokenAHex, approveData),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        {
          id: "tx1",
          fee: 0,
          log: [
            {
              address: tokenAHex.slice(2),
              topics: [
                "8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
                addressTopic(callerHex),
                addressTopic(routerHex),
                slot("07"),
              ],
              data: "",
            },
          ],
        },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].operations).toEqual([
        { type: "other", operationType: "NONE", contractType: "TriggerSmartContract" },
      ]);
    });

    it("should map an approve() call with no receipt from its call data", async () => {
      const approveData = "095ea7b3" + slot(routerHex.slice(2)) + "f".repeat(64);
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        triggerSmartContractBlock(tokenAHex, approveData),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].operations).toEqual([
        expect.objectContaining({ type: "other", operationType: "APPROVE" }),
      ]);
    });
  });

  it("should map non-transfer contracts to other operations", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "VoteWitnessContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    votes: [{ vote_address: "41abc", vote_count: 10 }],
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "other",
      operationType: "VOTE",
      contractType: "VoteWitnessContract",
    });
  });

  it("should include operations for failed transactions so downstream can see transfer details", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([{ id: "tx1", fee: 5000 }]);

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "FAILED" }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions[0].failed).toBe(true);
    expect(result.transactions[0].fees).toBe(BigInt(5000));
    expect(result.transactions[0].operations).toHaveLength(2);
    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      asset: { type: "native" },
      amount: BigInt(-1000000),
    });
    expect(result.transactions[0].operations[1]).toMatchObject({
      type: "transfer",
      asset: { type: "native" },
      amount: BigInt(1000000),
    });
  });

  it("should handle blocks with no transactions", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions).toHaveLength(0);
  });

  it("should treat missing ret as success (not failed)", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions[0].failed).toBe(false);
  });

  it("should get fees from getTransactionInfoByBlockNum when missing in ret", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([{ id: "tx1", fee: 2500 }]);

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(mockGetTransactionInfoByBlockNum).toHaveBeenCalledWith(mockLogger, mockConfig, 100);
    expect(result.transactions[0].fees).toBe(BigInt(2500));
  });

  it("should always use fees from getTransactionInfoByBlockNum", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([{ id: "tx1", fee: 9999 }]);

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions[0].fees).toBe(BigInt(9999));
  });

  it("should fallback to ret fee when tx info not found", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([]);

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS", fee: 7500 }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].fees).toBe(BigInt(7500));
  });

  it("should fallback to zero fees when neither tx info nor ret has fee", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([]);

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].fees).toBe(BigInt(0));
  });

  it("should still succeed when getTransactionInfoByBlockNum fails", async () => {
    mockGetTransactionInfoByBlockNum.mockRejectedValue(new Error("Network error"));

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS", fee: 4000 }],
        },
      ],
    });

    const result = await getBlock(mockLogger, mockConfig, 100);

    expect(result.info.height).toBe(100);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].fees).toBe(BigInt(4000));
  });

  describe("internal transactions", () => {
    const callerHex = "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
    const contractHex = "41aabbccdd11223344556677889900aabbccdd1122";
    const recipientHex = "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5";
    const contractCallBlock = (contractRet: string = "SUCCESS") => ({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TriggerSmartContract",
                parameter: {
                  value: {
                    owner_address: callerHex,
                    contract_address: contractHex,
                    data: "3ccfd60b",
                  },
                },
              },
            ],
          },
          ret: [{ contractRet }],
        },
      ],
    });
    const internalTx = (
      callValueInfo: { callValue?: number; tokenId?: string }[],
      extra: { rejected?: boolean } = {},
    ) => ({
      hash: "internal1",
      caller_address: contractHex,
      transferTo_address: recipientHex,
      callValueInfo,
      note: "63616c6c",
      ...extra,
    });

    describe("on a recorded mainnet USDT -> TRX swap", () => {
      const swapTxId = block82524825.transactions[0].txID;
      const wtrx = "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR";
      const hop1 = "TCFNp179Lg46D16zKoumd4Poa2WFFdtqYj";
      const hop2 = "TJKb72SKzSmYKC4jNievJwTLx9XDmcip7n";
      const recipient = "TQXc5qXqnk6jLqb2svERcj2ZnvoKFjUwA5";
      const amount = 47_814_575_212n;
      const native = { type: "native" };

      beforeEach(() => {
        (getBlockWithTransactions as jest.Mock).mockResolvedValue(block82524825);
      });

      it("credits the TRX the swap pays out to its recipient", async () => {
        mockGetTransactionInfoByBlockNum.mockResolvedValue(block82524825TxInfos);

        const { transactions } = await getBlock(mockLogger, mockConfig, 82524825);

        expect(transactions).toHaveLength(1);
        const [swap] = transactions;
        expect(swap.hash).toBe(swapTxId);
        expect(swap.operations).toContainEqual({
          type: "transfer",
          address: recipient,
          peer: hop2,
          asset: native,
          amount,
        });
      });

      it("reports each value-moving internal call once, as a debit/credit pair", async () => {
        mockGetTransactionInfoByBlockNum.mockResolvedValue(block82524825TxInfos);

        const { transactions } = await getBlock(mockLogger, mockConfig, 82524825);

        const nativeOps = transactions[0].operations.filter(
          op => op.type === "transfer" && op.asset.type === "native",
        );
        // 29 internal transactions, of which only 3 move TRX: the 26 zero-value calls give nothing.
        expect(nativeOps).toEqual([
          { type: "transfer", address: wtrx, peer: hop1, asset: native, amount: -amount },
          { type: "transfer", address: hop1, peer: wtrx, asset: native, amount },
          { type: "transfer", address: hop1, peer: hop2, asset: native, amount: -amount },
          { type: "transfer", address: hop2, peer: hop1, asset: native, amount },
          { type: "transfer", address: hop2, peer: recipient, asset: native, amount: -amount },
          { type: "transfer", address: recipient, peer: hop2, asset: native, amount },
        ]);
      });

      it("keeps the operations read from the event logs and the fee unchanged", async () => {
        const [txInfo] = block82524825TxInfos;
        const { internal_transactions: _, ...txInfoWithoutInternals } = txInfo;
        mockGetTransactionInfoByBlockNum.mockResolvedValue([txInfoWithoutInternals]);
        const withoutInternals = await getBlock(mockLogger, mockConfig, 82524825);
        mockGetTransactionInfoByBlockNum.mockResolvedValue(block82524825TxInfos);

        const withInternals = await getBlock(mockLogger, mockConfig, 82524825);

        const before = withoutInternals.transactions[0];
        const after = withInternals.transactions[0];
        expect(after.operations.slice(0, before.operations.length)).toEqual(before.operations);
        expect(after.operations).toHaveLength(before.operations.length + 6);
        expect(after.fees).toBe(BigInt(txInfo.fee));
        expect(after.fees).toBe(before.fees);
        expect(after.feesPayer).toBe("TNoZuAuL83PSh8TG4W92AvLqkA4E2dKSNm");
      });
    });

    it("maps an internal TRX transfer to a native debit/credit pair", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(contractCallBlock());
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        { id: "tx1", fee: 100, internal_transactions: [internalTx([{ callValue: 4104742878 }])] },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(internalTransfersOf(result.transactions[0].operations)).toEqual([
        {
          type: "transfer",
          address: encode58Check(contractHex),
          peer: encode58Check(recipientHex),
          asset: { type: "native" },
          amount: -4104742878n,
        },
        {
          type: "transfer",
          address: encode58Check(recipientHex),
          peer: encode58Check(contractHex),
          asset: { type: "native" },
          amount: 4104742878n,
        },
      ]);
      expect(result.transactions[0].fees).toBe(100n);
    });

    it("maps an internal TRC10 transfer to the TRC10 asset", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(contractCallBlock());
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        {
          id: "tx1",
          internal_transactions: [internalTx([{ callValue: 500, tokenId: "1002000" }])],
        },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(internalTransfersOf(result.transactions[0].operations)).toEqual([
        expect.objectContaining({
          address: encode58Check(contractHex),
          asset: { type: "trc10", assetReference: "1002000" },
          amount: -500n,
        }),
        expect.objectContaining({
          address: encode58Check(recipientHex),
          asset: { type: "trc10", assetReference: "1002000" },
          amount: 500n,
        }),
      ]);
    });

    it("ignores a rejected internal transfer", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(contractCallBlock());
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        {
          id: "tx1",
          internal_transactions: [internalTx([{ callValue: 1000 }], { rejected: true })],
        },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(internalTransfersOf(result.transactions[0].operations)).toEqual([]);
    });

    it("ignores internal calls that move no value", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(contractCallBlock());
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        {
          id: "tx1",
          internal_transactions: [
            internalTx([{}]),
            internalTx([{ callValue: 0 }]),
            internalTx([]),
            { hash: "internal2", caller_address: contractHex, transferTo_address: recipientHex },
          ],
        },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(internalTransfersOf(result.transactions[0].operations)).toEqual([]);
    });

    it("ignores the internal transfers of a failed transaction", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(contractCallBlock("REVERT"));
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        { id: "tx1", fee: 300, internal_transactions: [internalTx([{ callValue: 1000 }])] },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(result.transactions[0].failed).toBe(true);
      expect(result.transactions[0].fees).toBe(300n);
      expect(internalTransfersOf(result.transactions[0].operations)).toEqual([]);
    });

    it("skips and logs an internal transfer whose amount is not a safe integer", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(contractCallBlock());
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        { id: "tx1", internal_transactions: [internalTx([{ callValue: 2 ** 60 }])] },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(internalTransfersOf(result.transactions[0].operations)).toEqual([]);
      expect(mockLogger).toHaveBeenCalledWith(
        "tron/internalTransfers",
        "skipping internal transfer with an unreadable amount",
        expect.objectContaining({ txID: "tx1", internalTxHash: "internal1" }),
      );
    });

    it("adds internal transfers after the operations of a plain transfer", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue({
        blockID: "blockhash",
        block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
        transactions: [
          {
            txID: "tx1",
            raw_data: {
              contract: [
                {
                  type: "TransferContract",
                  parameter: {
                    value: { owner_address: callerHex, to_address: contractHex, amount: 7 },
                  },
                },
              ],
            },
            ret: [{ contractRet: "SUCCESS" }],
          },
        ],
      });
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        { id: "tx1", internal_transactions: [internalTx([{ callValue: 7 }])] },
      ]);

      const result = await getBlock(mockLogger, mockConfig, 100);

      expect(
        result.transactions[0].operations.map(op => op.type === "transfer" && op.amount),
      ).toEqual([-7n, 7n, -7n, 7n]);
    });
  });

  describe("value attached to a smart contract call", () => {
    const callerHex = "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
    const contractHex = "41aabbccdd11223344556677889900aabbccdd1122";
    const caller = encode58Check(callerHex);
    const contract = encode58Check(contractHex);
    const blockOf = (
      type: string,
      value: Record<string, unknown>,
      contractRet: string = "SUCCESS",
    ) => ({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [{ type, parameter: { value: { owner_address: callerHex, ...value } } }],
          },
          ret: [{ contractRet }],
        },
      ],
    });
    describe("on a recorded mainnet TRX -> USDT swap", () => {
      const wtrx = "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR";

      beforeEach(() => {
        (getBlockWithTransactions as jest.Mock).mockResolvedValue(trxSwap.block);
        mockGetTransactionInfoByBlockNum.mockResolvedValue(trxSwap.txInfos);
      });

      it("debits the TRX the account attached and credits the router with it", async () => {
        const { transactions } = await getBlock(mockLogger, mockConfig, 88336767);

        expect(transactions[0].operations.slice(0, 2)).toEqual(
          pair(trxSwap.account, trxSwap.router, { type: "native" }, 9_500_000_000n),
        );
      });

      it("balances the router's TRX: what it receives with the call, it wraps as WTRX", async () => {
        const { transactions } = await getBlock(mockLogger, mockConfig, 88336767);

        const trxDeltaOf = (address: string) =>
          transactions[0].operations
            .filter(op => op.type === "transfer" && op.asset.type === "native")
            .reduce(
              (sum, op) =>
                op.type === "transfer" && op.address === address ? sum + op.amount : sum,
              0n,
            );
        expect(trxDeltaOf(trxSwap.router)).toBe(0n);
        expect(trxDeltaOf(trxSwap.account)).toBe(-9_500_000_000n);
        expect(trxDeltaOf(wtrx)).toBe(9_500_000_000n);
      });
    });

    it("reports the TRC10 a call attaches with its token", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        blockOf("TriggerSmartContract", {
          contract_address: contractHex,
          call_value: 5,
          call_token_value: 7,
          token_id: 1002000,
        }),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([]);

      expect(await transfersOf()).toEqual([
        ...pair(caller, contract, { type: "native" }, 5n),
        ...pair(caller, contract, { type: "trc10", assetReference: "1002000" }, 7n),
      ]);
    });

    it("reports nothing a failed call attached, which is refunded", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        blockOf("TriggerSmartContract", { contract_address: contractHex, call_value: 5 }, "REVERT"),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([]);

      expect(await transfersOf()).toEqual([]);
    });

    it("credits a created contract with its endowment, read from the receipt's address", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        blockOf("CreateSmartContract", { new_contract: { call_value: 9 } }),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([
        { id: "tx1", fee: 0, contract_address: contractHex },
      ]);

      expect(await transfersOf()).toEqual(pair(caller, contract, { type: "native" }, 9n));
    });

    it("reports no endowment when no receipt names the created contract", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        blockOf("CreateSmartContract", { new_contract: { call_value: 9 } }),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([]);

      expect(await transfersOf()).toEqual([]);
    });

    it("skips an unreadable call value", async () => {
      (getBlockWithTransactions as jest.Mock).mockResolvedValue(
        blockOf("TriggerSmartContract", { contract_address: contractHex, call_value: 2 ** 60 }),
      );
      mockGetTransactionInfoByBlockNum.mockResolvedValue([]);

      expect(await transfersOf()).toEqual([]);
      expect(mockLogger).toHaveBeenCalledWith(
        "tron/callValue",
        "skipping a call value that cannot be read",
        expect.objectContaining({ txID: "tx1" }),
      );
    });
  });
});
