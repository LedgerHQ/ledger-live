import type { Logger } from "@ledgerhq/coin-module-framework/config";
import network from "@ledgerhq/live-network";
import coinConfig, { type TronCoinConfig } from "../config";
import { getBlock } from "./getBlock";
import { listOperations } from "./listOperations";

jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = network as jest.MockedFunction<typeof network>;
const mockLogger: Logger = jest.fn();

const TRON_BASE_URL = "https://tron-test.example.com";
const config = {
  status: { type: "active" },
  explorer: { url: TRON_BASE_URL },
} as TronCoinConfig;

// The spam airdrop of the original report: a TRC20 deployed and minted in one transaction.
// https://tronscan.org/#/transaction/4d8f740330ec0c2158cd29db807c98b2c8ba11f7217e645d5c4421106138a399
const txID = "4d8f740330ec0c2158cd29db807c98b2c8ba11f7217e645d5c4421106138a399";
const blockHeight = 85277401;
const blockTimestamp = 1786503237000;
const deployerHex = "41679c8dd7488038252f935ca3465fbc94d29a940f";
const deployer = "TKR49PGYukacpKXwLYSWdup63napXQeXCE";
const zeroAddress = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";
const mintedTrc20 = "TCsam7uH3NbYLpKMCAayquN4Qwm3q717qu";
const amount = BigInt("100000000000000000000000000000000");

const mintLog = {
  address: "1fd80baee7c53e92e69447ff8c48d6b3a008572f",
  topics: [
    "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0".repeat(64),
    "000000000000000000000000679c8dd7488038252f935ca3465fbc94d29a940f",
  ],
  data: "00000000000000000000000000000000000004ee2d6d415b85acef8100000000",
};

// A second token moved by the same deployment, in the other direction.
const otherTokenLog = {
  ...mintLog,
  address: "a614f803b6fd780986a42c78ec9c7f77e6ded13c",
  topics: [mintLog.topics[0], mintLog.topics[2], mintLog.topics[1]],
};

const creationContract = {
  parameter: {
    value: { owner_address: deployerHex, new_contract: { name: "Token" } },
    type_url: "type.googleapis.com/protocol.CreateSmartContract",
  },
  type: "CreateSmartContract",
};

// TronGrid has no `token_info` for a contract created in this very transaction.
const trc20ListEntry = {
  transaction_id: txID,
  token_info: {},
  block_timestamp: blockTimestamp,
  from: zeroAddress,
  to: deployer,
  detail: {
    ret: [{ contractRet: "SUCCESS", fee: 57131600 }],
    txID,
    blockNumber: blockHeight,
    raw_data: { contract: [creationContract] },
  },
  type: "Transfer",
  value: amount.toString(),
};

function mockTronGrid(log: object[]) {
  const receipt = {
    id: txID,
    fee: 57131600,
    contract_address: "411fd80baee7c53e92e69447ff8c48d6b3a008572f",
    log,
  };
  const blockHeader = {
    blockID: "blockhash",
    block_header: { raw_data: { number: blockHeight, timestamp: blockTimestamp } },
  };

  mockedNetwork.mockImplementation((({
    url,
    data,
  }: {
    url: string;
    data?: { detail?: boolean };
  }) => {
    if (url.includes("/transactions/trc20")) return { data: { data: [trc20ListEntry], meta: {} } };
    if (url.includes("/v1/accounts/")) return { data: { data: [], meta: {} } };
    if (url.includes("gettransactioninfobyid")) return { data: receipt };
    if (url.includes("gettransactioninfobyblocknum")) return { data: [receipt] };
    if (url.includes("getblock")) {
      return {
        data: data?.detail
          ? {
              ...blockHeader,
              transactions: [
                {
                  txID,
                  raw_data: { contract: [creationContract] },
                  ret: [{ contractRet: "SUCCESS", fee: 57131600 }],
                },
              ],
            }
          : blockHeader,
      };
    }
    throw new Error(`unexpected request to ${url}`);
  }) as never);
}

/**
 * `/operations` and `/block` read a constructor mint from different inputs — TronGrid's TRC20
 * index on one side, raw block data plus receipts on the other — and must not disagree about it.
 * The rule both follow: a token transfer is reported only when the transaction's own event logs
 * name its token, and every transfer `/operations` returns is also in `/block`, same token, same
 * amount.
 */
describe("token asset consistency between listOperations and getBlock", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => config);
  });

  beforeEach(() => {
    mockedNetwork.mockReset();
  });

  async function bothEndpoints() {
    const page = await listOperations(mockLogger, config, deployer, {
      limit: 100,
      minTimestamp: 0,
      order: "asc",
    });
    const block = await getBlock(mockLogger, config, blockHeight);
    return { operations: page.items, blockOperations: block.transactions[0].operations };
  }

  it("reports the mint on both endpoints when the logs name the token", async () => {
    mockTronGrid([mintLog]);

    const { operations, blockOperations } = await bothEndpoints();

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      type: "IN",
      value: amount,
      asset: { type: "trc20", assetReference: mintedTrc20, assetOwner: deployer },
    });
    expect(blockOperations).toEqual([
      {
        type: "transfer",
        address: zeroAddress,
        peer: deployer,
        asset: { type: "trc20", assetReference: mintedTrc20 },
        amount: -amount,
      },
      {
        type: "transfer",
        address: deployer,
        peer: zeroAddress,
        asset: { type: "trc20", assetReference: mintedTrc20 },
        amount,
      },
    ]);
  });

  it("keeps the transfer of /operations within /block when the deployment moves several tokens", async () => {
    mockTronGrid([mintLog, otherTokenLog]);

    const { operations, blockOperations } = await bothEndpoints();

    // TronGrid indexes the one transfer that concerns the account; the block reports every one.
    expect(operations).toHaveLength(1);
    expect(operations[0].asset).toMatchObject({ assetReference: mintedTrc20 });
    expect(blockOperations).toContainEqual({
      type: "transfer",
      address: deployer,
      peer: zeroAddress,
      asset: { type: "trc20", assetReference: mintedTrc20 },
      amount,
    });
    expect(blockOperations).toHaveLength(4);
  });

  it("reports no token transfer on either endpoint when the logs name no token", async () => {
    mockTronGrid([]);

    const { operations, blockOperations } = await bothEndpoints();

    expect(operations).toEqual([]);
    expect(blockOperations).toEqual([
      { type: "other", operationType: "NONE", contractType: "CreateSmartContract" },
    ]);
  });
});
