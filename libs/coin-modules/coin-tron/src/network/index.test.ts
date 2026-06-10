import { InvalidTransactionError } from "@ledgerhq/errors";
import network from "@ledgerhq/live-network";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { TronTransactionExpired } from "../types/errors";
import {
  broadcastHexTron,
  broadcastTron,
  claimRewardTronTransaction,
  craftStandardTransaction,
  craftTrc20Transaction,
  createTronTransaction,
  defaultFetchParams,
  fetchTronAccount,
  fetchTronAccountTxs,
  fetchTronAccountTxsPage,
  fetchTronContract,
  freezeTronTransaction,
  getAccountName,
  getBlock,
  getBlockWithTransactions,
  getChainParameters,
  getContractUserEnergyRatioConsumption,
  getDelegatedResource,
  getLastBlock,
  getNextVotingDate,
  getTransactionInfoByBlockNum,
  getTronAccountNetwork,
  getTronSuperRepresentativeData,
  getTronSuperRepresentatives,
  getUnwithdrawnReward,
  hydrateSuperRepresentatives,
  legacyUnfreezeTronTransaction,
  post,
  triggerConstantContract,
  unDelegateResourceTransaction,
  unfreezeTronTransaction,
  voteTronSuperRepresentatives,
  withdrawExpireUnfreezeTronTransaction,
} from ".";

jest.mock("@ledgerhq/live-network/network");
jest.mock("@ledgerhq/logs");

jest.mock("tronweb", () => {
  const extendExpiration = jest.fn((tx, extension: number) => ({
    ...tx,
    raw_data: { ...tx.raw_data, expiration: tx.raw_data.expiration + extension * 1000 },
  }));
  return {
    TronWeb: jest.fn().mockImplementation(() => ({
      transactionBuilder: { extendExpiration },
    })),
    providers: { HttpProvider: jest.fn() },
    __extendExpiration: extendExpiration,
  };
});

const mockedNetwork = network as jest.MockedFunction<typeof network>;

const TRON_BASE_URL = "https://tron-test.example.com";

const senderBase58 = "TQ7pF3NTDL2Tjz5rdJ6ECjQWjaWHpLZJMH";
const recipientBase58 = "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj";
const senderHex = "4105cc125604448afeb6867eb688efb7e80411d57a";
const recipientHex = "419b3281a60ab7a44f351ef2896c653f134972ad22";

function mockResponse<T>(data: T) {
  return { data, status: 200 } as never;
}

beforeAll(() => {
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    explorer: { url: TRON_BASE_URL },
  }));
});

beforeEach(() => {
  mockedNetwork.mockReset();
});

describe("post / fetch error handling", () => {
  it("throws when the response body contains a key 'Error'", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ Error: { message: "boom" } }));
    await expect(post("/wallet/anything", {})).rejects.toThrow();
  });

  it("throws using error.toString() when stringified Error is empty", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ Error: "raw-string" }));
    await expect(post("/wallet/anything", {})).rejects.toThrow("raw-string");
  });

  it("propagates GET errors from fetch", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ Error: { message: "get-boom" } }));
    await expect(fetchTronAccount(senderBase58)).resolves.toEqual([]);
  });
});

describe("freeze / unfreeze / withdraw / unDelegate / legacyUnfreeze", () => {
  it("freezeTronTransaction posts to freezebalancev2", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ raw_data: {} }));
    await freezeTronTransaction(
      { freshAddress: senderBase58 } as Account,
      { amount: new BigNumber(1000), resource: "BANDWIDTH" } as never,
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: expect.stringContaining("/wallet/freezebalancev2"),
        data: expect.objectContaining({ frozen_balance: 1000, resource: "BANDWIDTH" }),
      }),
    );
  });

  it("unfreezeTronTransaction posts to unfreezebalancev2", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ raw_data: {} }));
    await unfreezeTronTransaction(
      { freshAddress: senderBase58 } as Account,
      { amount: new BigNumber(500), resource: "ENERGY" } as never,
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining("/wallet/unfreezebalancev2"),
        data: expect.objectContaining({ unfreeze_balance: 500, resource: "ENERGY" }),
      }),
    );
  });

  it("withdrawExpireUnfreezeTronTransaction posts to withdrawexpireunfreeze", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ raw_data: {} }));
    await withdrawExpireUnfreezeTronTransaction(
      { freshAddress: senderBase58 } as Account,
      {} as never,
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining("/wallet/withdrawexpireunfreeze") }),
    );
  });

  it("unDelegateResourceTransaction posts to undelegateresource", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ raw_data: {} }));
    await unDelegateResourceTransaction(
      { freshAddress: senderBase58 } as Account,
      { amount: new BigNumber(1000), resource: "BANDWIDTH", recipient: recipientBase58 } as never,
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining("/wallet/undelegateresource") }),
    );
  });

  it("legacyUnfreezeTronTransaction with recipient", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ raw_data: {} }));
    await legacyUnfreezeTronTransaction(
      { freshAddress: senderBase58 } as Account,
      { resource: "ENERGY", recipient: recipientBase58 } as never,
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ receiver_address: expect.any(String) }),
      }),
    );
  });

  it("legacyUnfreezeTronTransaction without recipient", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ raw_data: {} }));
    await legacyUnfreezeTronTransaction(
      { freshAddress: senderBase58 } as Account,
      { resource: "ENERGY", recipient: "" } as never,
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ receiver_address: undefined }),
      }),
    );
  });
});

describe("getDelegatedResource", () => {
  it("returns BANDWIDTH amount when resource=BANDWIDTH", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({
        delegatedResource: [
          { frozen_balance_for_bandwidth: 100, frozen_balance_for_energy: 0 },
          { frozen_balance_for_bandwidth: 50, frozen_balance_for_energy: 200 },
        ],
      }),
    );
    const result = await getDelegatedResource(
      { freshAddress: senderBase58 } as Account,
      { recipient: recipientBase58 } as never,
      "BANDWIDTH",
    );
    expect(result.toNumber()).toBe(150);
  });

  it("returns ENERGY amount when resource=ENERGY", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({
        delegatedResource: [
          { frozen_balance_for_bandwidth: 100, frozen_balance_for_energy: 50 },
          { frozen_balance_for_bandwidth: 0, frozen_balance_for_energy: 75 },
        ],
      }),
    );
    const result = await getDelegatedResource(
      { freshAddress: senderBase58 } as Account,
      { recipient: recipientBase58 } as never,
      "ENERGY",
    );
    expect(result.toNumber()).toBe(125);
  });

  it("returns 0 when no delegatedResource is present", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({}));
    const result = await getDelegatedResource(
      { freshAddress: senderBase58 } as Account,
      { recipient: recipientBase58 } as never,
      "BANDWIDTH",
    );
    expect(result.toNumber()).toBe(0);
  });
});

describe("craftTrc20Transaction", () => {
  it("uses custom fees when provided", async () => {
    const expirationInFuture = Date.now() + 10 * 60 * 1000;
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({ transaction: { raw_data: { expiration: expirationInFuture } } }),
    );
    await craftTrc20Transaction(
      "TF5Bn4cJCT6GVeUgyCN4rBhDg42KBrpAjg",
      recipientHex,
      senderHex,
      new BigNumber(100),
      99_999,
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fee_limit: 99_999 }),
      }),
    );
  });

  it("uses zero fee_limit when custom fees are 0", async () => {
    const expirationInFuture = Date.now() + 10 * 60 * 1000;
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({ transaction: { raw_data: { expiration: expirationInFuture } } }),
    );
    await craftTrc20Transaction(
      "TF5Bn4cJCT6GVeUgyCN4rBhDg42KBrpAjg",
      recipientHex,
      senderHex,
      new BigNumber(100),
      0,
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fee_limit: 0 }),
      }),
    );
  });

  it("uses DEFAULT_TRC20_FEES_LIMIT when no custom fees are provided", async () => {
    const expirationInFuture = Date.now() + 10 * 60 * 1000;
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({ transaction: { raw_data: { expiration: expirationInFuture } } }),
    );
    await craftTrc20Transaction(
      "TF5Bn4cJCT6GVeUgyCN4rBhDg42KBrpAjg",
      recipientHex,
      senderHex,
      new BigNumber(100),
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fee_limit: 50_000_000 }),
      }),
    );
  });
});

describe("craftStandardTransaction", () => {
  it("uses /wallet/transferasset when isTransferAsset is true (and includes hex memo)", async () => {
    const expirationInFuture = Date.now() + 10 * 60 * 1000;
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({ raw_data: { expiration: expirationInFuture } }),
    );
    await craftStandardTransaction(
      "1002000",
      recipientHex,
      senderHex,
      new BigNumber(100),
      true,
      "memo",
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining("/wallet/transferasset"),
        data: expect.objectContaining({
          asset_name: Buffer.from("1002000").toString("hex"),
          extra_data: Buffer.from("memo").toString("hex"),
        }),
      }),
    );
  });

  it("uses /wallet/createtransaction when isTransferAsset is false", async () => {
    const expirationInFuture = Date.now() + 10 * 60 * 1000;
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({ raw_data: { expiration: expirationInFuture } }),
    );
    await craftStandardTransaction(undefined, recipientHex, senderHex, new BigNumber(50), false);
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining("/wallet/createtransaction") }),
    );
  });
});

describe("createTronTransaction", () => {
  it.each([
    {
      name: "native",
      subAccount: null,
      expectedUrl: "/wallet/createtransaction",
    },
    {
      name: "trc10",
      subAccount: { type: "TokenAccount", token: { id: "tron/trc10/1000001" } } as TokenAccount,
      expectedUrl: "/wallet/transferasset",
    },
    {
      name: "trc20",
      subAccount: {
        type: "TokenAccount",
        token: {
          id: "tron/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
          contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        },
      } as unknown as TokenAccount,
      expectedUrl: "/wallet/triggersmartcontract",
    },
  ])(
    "dispatches a $name transaction to the right endpoint",
    async ({ subAccount, expectedUrl }) => {
      const expirationInFuture = Date.now() + 10 * 60 * 1000;
      mockedNetwork.mockResolvedValueOnce(
        mockResponse(
          expectedUrl.includes("triggersmartcontract")
            ? { transaction: { raw_data: { expiration: expirationInFuture } } }
            : { raw_data: { expiration: expirationInFuture } },
        ),
      );
      await createTronTransaction(
        { freshAddress: senderBase58 } as Account,
        { recipient: recipientBase58, amount: new BigNumber(1) } as never,
        subAccount,
      );
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining(expectedUrl) }),
      );
    },
  );

  it("throws InvalidTransactionError if the node returns an expired transaction", async () => {
    const pastExpiration = Date.now() - 60 * 60 * 1000;
    mockedNetwork.mockResolvedValueOnce(mockResponse({ raw_data: { expiration: pastExpiration } }));
    await expect(
      createTronTransaction(
        { freshAddress: senderBase58 } as Account,
        { recipient: recipientBase58, amount: new BigNumber(1) } as never,
        null,
      ),
    ).rejects.toThrow(InvalidTransactionError);
  });
});

describe("broadcastTron", () => {
  it("returns the txid on success", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ result: true, txid: "abc" }));
    await expect(broadcastTron({ signature: ["sig"] } as never)).resolves.toBe("abc");
  });

  it("throws TronTransactionExpired when code is TRANSACTION_EXPIRATION_ERROR", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({
        result: false,
        txid: "abc",
        code: "TRANSACTION_EXPIRATION_ERROR",
        message: "expired",
      }),
    );
    await expect(broadcastTron({ signature: ["sig"] } as never)).rejects.toBeInstanceOf(
      TronTransactionExpired,
    );
  });

  it("throws a generic error when result is not true and code is something else", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({ result: false, txid: "abc", code: "OTHER", message: "msg" }),
    );
    await expect(broadcastTron({ signature: ["sig"] } as never)).rejects.toThrow("OTHER: msg");
  });
});

describe("broadcastHexTron", () => {
  it("returns the txid on success", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ result: true, txid: "hex-tx" }));
    await expect(broadcastHexTron("raw")).resolves.toBe("hex-tx");
  });

  it("throws when broadcast fails", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({ result: false, txid: "hex-tx", code: "BAD" }),
    );
    await expect(broadcastHexTron("raw")).rejects.toThrow(/BAD/);
  });
});

describe("fetchTronAccount", () => {
  it("returns parsed data on success", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ data: [{ address: senderHex }] }));
    const result = await fetchTronAccount(senderBase58);
    expect(result).toEqual([{ address: senderHex }]);
  });

  it("returns [] on network error", async () => {
    mockedNetwork.mockRejectedValueOnce(new Error("network"));
    await expect(fetchTronAccount(senderBase58)).resolves.toEqual([]);
  });
});

describe("getLastBlock / getBlock / getBlockWithTransactions / getTransactionInfoByBlockNum", () => {
  it("getLastBlock returns a block including its time", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({
        blockID: "hash",
        block_header: { raw_data: { number: 10, timestamp: 1739540559000 } },
      }),
    );
    const block = await getLastBlock();
    expect(block).toEqual({ height: 10, hash: "hash", time: new Date(1739540559000) });
  });

  it("getLastBlock returns a block without time when timestamp is missing", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({ blockID: "h2", block_header: { raw_data: { number: 11 } } }),
    );
    const block = await getLastBlock();
    expect(block.time).toBeUndefined();
  });

  it("getBlock sends POST with detail:false", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({
        blockID: "h",
        block_header: { raw_data: { number: 42, timestamp: 1000 } },
      }),
    );
    const block = await getBlock(42);
    expect(block).toEqual({ height: 42, hash: "h", time: new Date(1000) });
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: expect.stringContaining("/wallet/getblock"),
        data: { id_or_num: "42", detail: false },
      }),
    );
  });

  it("getBlockWithTransactions sends POST with detail:true", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({
        blockID: "h",
        block_header: { raw_data: { number: 42, timestamp: 1000 } },
        transactions: [],
      }),
    );
    await getBlockWithTransactions(42);
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ data: { id_or_num: "42", detail: true } }),
    );
  });

  it("getTransactionInfoByBlockNum forwards num in body", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse([{ id: "tx1" }]));
    const result = await getTransactionInfoByBlockNum(5);
    expect(result).toEqual([{ id: "tx1" }]);
    expect(mockedNetwork).toHaveBeenCalledWith(expect.objectContaining({ data: { num: 5 } }));
  });
});

describe("fetchTronAccountTxs / fetchTronAccountTxsPage", () => {
  const validNativeTx = {
    ret: [{ contractRet: "SUCCESS", fee: 0 }],
    signature: ["sig"],
    txID: "tx-native",
    net_usage: 0,
    raw_data_hex: "",
    net_fee: 0,
    energy_usage: 0,
    block_timestamp: 1717419792000,
    blockNumber: 100,
    energy_fee: 0,
    energy_usage_total: 0,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              owner_address: senderHex,
              to_address: recipientHex,
              amount: 1000,
            },
            type_url: "type.googleapis.com/protocol.TransferContract",
          },
          type: "TransferContract",
        },
      ],
      ref_block_bytes: "00",
      ref_block_hash: "00",
      expiration: 0,
      timestamp: 0,
    },
    internal_transactions: [],
  };

  const successfulSmartContract = {
    ...validNativeTx,
    txID: "tx-smart-success",
    ret: [{ contractRet: "SUCCESS", fee: 0 }],
    raw_data: {
      ...validNativeTx.raw_data,
      contract: [
        {
          parameter: {
            value: { owner_address: senderHex, contract_address: recipientHex, data: "" },
            type_url: "type.googleapis.com/protocol.TriggerSmartContract",
          },
          type: "TriggerSmartContract",
        },
      ],
    },
  };

  const malformedTx = { ...validNativeTx, txID: "malformed", tx_id: "malformed" };

  const validTrc20Tx = {
    transaction_id: "tx-trc20",
    token_info: {
      symbol: "USDT",
      address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      decimals: 6,
      name: "Tether USD",
    },
    block_timestamp: 1717419792000,
    from: senderBase58,
    to: recipientBase58,
    detail: {
      ret: [{ contractRet: "SUCCESS", fee: 0 }],
      blockNumber: 200,
      raw_data: {
        contract: [
          {
            parameter: {
              value: { owner_address: senderHex, contract_address: recipientHex },
              type_url: "type.googleapis.com/protocol.TriggerSmartContract",
            },
            type: "TriggerSmartContract",
          },
        ],
      },
    },
    type: "Transfer",
    value: "1000",
  };

  it("fetchTronAccountTxsPage keeps a failed TriggerSmartContract native tx when not in TRC20 set", async () => {
    const failedSmart = {
      ...successfulSmartContract,
      txID: "tx-smart-failed",
      ret: [{ contractRet: "REVERT", fee: 0 }],
    };
    mockedNetwork
      .mockResolvedValueOnce(mockResponse({ data: [failedSmart], meta: {} }))
      .mockResolvedValueOnce(mockResponse({ data: [], meta: {} }));

    const result = await fetchTronAccountTxsPage(senderBase58, {
      limit: 100,
      minTimestamp: 0,
      order: "desc",
    });

    expect(result.nativeTxs.txs.map(t => t.txID)).toEqual(["tx-smart-failed"]);
  });

  it("fetchTronAccountTxsPage falls back to [] when data field is missing on native page", async () => {
    mockedNetwork
      .mockResolvedValueOnce(mockResponse({ meta: {} }))
      .mockResolvedValueOnce(mockResponse({ data: [], meta: {} }));
    const result = await fetchTronAccountTxsPage(senderBase58, {
      limit: 100,
      minTimestamp: 0,
      order: "desc",
    });
    expect(result.nativeTxs.txs).toEqual([]);
  });

  it("fetchTronAccountTxsPage returns native + trc20 results, dedupes successful smart contract", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        mockResponse({ data: [validNativeTx, malformedTx, successfulSmartContract], meta: {} }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          data: [{ ...validTrc20Tx, transaction_id: "tx-smart-success" }],
          meta: { links: { next: "https://api.trongrid.io/next" } },
        }),
      );

    const result = await fetchTronAccountTxsPage(senderBase58, {
      limit: 100,
      minTimestamp: 0,
      order: "desc",
    });

    expect(result.nativeTxs.txs.map(t => t.txID)).toEqual(["tx-native"]);
    expect(result.trc20Txs.txs.map(t => t.txID)).toEqual(["tx-smart-success"]);
    expect(result.trc20Txs.hasNextPage).toBe(true);
  });

  it("fetchTronAccountTxsPage forwards maxTimestamp param when provided", async () => {
    mockedNetwork
      .mockResolvedValueOnce(mockResponse({ data: [], meta: {} }))
      .mockResolvedValueOnce(mockResponse({ data: [], meta: {} }));
    await fetchTronAccountTxsPage(senderBase58, {
      limit: 10,
      minTimestamp: 0,
      order: "asc",
      maxTimestamp: 999,
    });
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringMatching(/max_timestamp=999/),
      }),
    );
  });

  it("fetchTronAccountTxs follows native pagination via meta.links.next", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        mockResponse({
          data: [validNativeTx],
          meta: { links: { next: `${TRON_BASE_URL}/v1/accounts/x/transactions?page=2` } },
        }),
      )
      .mockResolvedValueOnce(mockResponse({ data: [validNativeTx], meta: {} }))
      .mockResolvedValueOnce(mockResponse({ data: [], meta: {} }));

    const results = await fetchTronAccountTxs(senderBase58, () => true, defaultFetchParams);
    expect(results).toHaveLength(2);
  });

  it("fetchTronAccountTxs respects hintGlobalLimit to limit page size", async () => {
    mockedNetwork
      .mockResolvedValueOnce(mockResponse({ data: [], meta: {} }))
      .mockResolvedValueOnce(mockResponse({ data: [], meta: {} }));

    await fetchTronAccountTxs(senderBase58, () => true, {
      ...defaultFetchParams,
      hintGlobalLimit: 7,
    });

    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringMatching(/limit=7/) }),
    );
  });

  it("fetchTronAccountTxs retries when TRC20 results are invalid and merges them", async () => {
    const trc20WithoutRet = JSON.parse(JSON.stringify(validTrc20Tx));
    trc20WithoutRet.detail.ret = undefined;

    mockedNetwork
      .mockResolvedValueOnce(mockResponse({ data: [], meta: {} }))
      .mockResolvedValueOnce(mockResponse({ data: [trc20WithoutRet], meta: {} }))
      .mockResolvedValueOnce(mockResponse({ data: [validTrc20Tx], meta: {} }));

    const results = await fetchTronAccountTxs(senderBase58, () => true, defaultFetchParams);
    expect(results.map(r => r.txID)).toContain("tx-trc20");
  });

  it("fetchTronAccountTxs gives up after several invalid TRC20 retries", async () => {
    const trc20WithoutRet = JSON.parse(JSON.stringify(validTrc20Tx));
    trc20WithoutRet.detail.ret = undefined;

    mockedNetwork
      .mockResolvedValueOnce(mockResponse({ data: [], meta: {} }))
      .mockResolvedValue(mockResponse({ data: [trc20WithoutRet], meta: {} }));

    await expect(fetchTronAccountTxs(senderBase58, () => true, defaultFetchParams)).rejects.toThrow(
      /couldn't fetch trc20/,
    );
  });
});

describe("fetchTronContract / getContractUserEnergyRatioConsumption", () => {
  it("returns undefined when contract response is empty", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({}));
    await expect(fetchTronContract(senderBase58)).resolves.toBeUndefined();
  });

  it("returns the contract data when non-empty", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ consume_user_resource_percent: 30 }));
    await expect(fetchTronContract(senderBase58)).resolves.toEqual({
      consume_user_resource_percent: 30,
    });
  });

  it("returns undefined on error", async () => {
    mockedNetwork.mockRejectedValueOnce(new Error("nope"));
    await expect(fetchTronContract(senderBase58)).resolves.toBeUndefined();
  });

  it("getContractUserEnergyRatioConsumption returns the percent when present", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ consume_user_resource_percent: 30 }));
    await expect(getContractUserEnergyRatioConsumption(senderBase58)).resolves.toBe(30);
  });

  it("getContractUserEnergyRatioConsumption returns 0 when contract is empty", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({}));
    await expect(getContractUserEnergyRatioConsumption(senderBase58)).resolves.toBe(0);
  });
});

describe("getTronAccountNetwork", () => {
  it("returns parsed network info from a fully populated response", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({
        freeNetUsed: 1,
        freeNetLimit: 2,
        NetUsed: 3,
        NetLimit: 4,
        EnergyUsed: 5,
        EnergyLimit: 6,
      }),
    );
    const ni = await getTronAccountNetwork(senderBase58);
    expect(ni.freeNetUsed.toNumber()).toBe(1);
    expect(ni.freeNetLimit.toNumber()).toBe(2);
    expect(ni.netUsed.toNumber()).toBe(3);
    expect(ni.netLimit.toNumber()).toBe(4);
    expect(ni.energyUsed.toNumber()).toBe(5);
    expect(ni.energyLimit.toNumber()).toBe(6);
  });

  it("defaults every missing field to 0", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({}));
    const ni = await getTronAccountNetwork(senderBase58);
    expect(ni.freeNetUsed.toNumber()).toBe(0);
    expect(ni.freeNetLimit.toNumber()).toBe(0);
    expect(ni.netUsed.toNumber()).toBe(0);
    expect(ni.netLimit.toNumber()).toBe(0);
    expect(ni.energyUsed.toNumber()).toBe(0);
    expect(ni.energyLimit.toNumber()).toBe(0);
  });
});

describe("getAccountName", () => {
  it("returns the ascii name when present", async () => {
    const accountName = Buffer.from("MyAccount").toString("hex");
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({ data: [{ address: senderHex, account_name: accountName }] }),
    );
    await expect(getAccountName(senderBase58)).resolves.toBe("MyAccount");
  });

  it("returns undefined when no account is returned", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ data: [] }));
    await expect(getAccountName(senderBase58)).resolves.toBeUndefined();
  });

  it("returns undefined when account has no name", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ data: [{ address: senderHex }] }));
    await expect(getAccountName(senderBase58)).resolves.toBeUndefined();
  });
});

describe("super representatives", () => {
  it("fetches super representatives from /wallet/listwitnesses on cache miss", async () => {
    await jest.isolateModulesAsync(async () => {
      const coinConfigLocal = require("../config").default as typeof coinConfig;
      coinConfigLocal.setCoinConfig(() => ({
        status: { type: "active" },
        explorer: { url: TRON_BASE_URL },
      }));
      const mod = require(".") as typeof import(".");
      mockedNetwork.mockResolvedValueOnce(
        mockResponse({
          witnesses: [
            { address: senderHex, voteCount: 50, isJobs: true },
            { address: recipientHex, voteCount: 100 },
            { address: senderHex },
          ],
        }),
      );
      const list = await mod.getTronSuperRepresentatives();
      expect(list.map(w => w.voteCount)).toEqual([100, 50, 0]);
      expect(list[2].isJobs).toBe(false);
      expect(list[1].isJobs).toBe(true);
    });
  });

  it("accountNamesCache resolves through getAccountName on miss", async () => {
    await jest.isolateModulesAsync(async () => {
      const coinConfigLocal = require("../config").default as typeof coinConfig;
      coinConfigLocal.setCoinConfig(() => ({
        status: { type: "active" },
        explorer: { url: TRON_BASE_URL },
      }));
      const mod = require(".") as typeof import(".");
      const accountName = Buffer.from("CacheName").toString("hex");
      mockedNetwork.mockResolvedValueOnce(
        mockResponse({ data: [{ address: senderHex, account_name: accountName }] }),
      );
      const name = await mod.accountNamesCache(senderBase58);
      expect(name).toBe("CacheName");
    });
  });

  it("hydrate + getTronSuperRepresentatives returns the cached list", async () => {
    hydrateSuperRepresentatives([
      { address: senderBase58, voteCount: 100, isJobs: false } as never,
    ]);
    const list = await getTronSuperRepresentatives();
    expect(list.length).toBeGreaterThan(0);
  });

  it("getNextVotingDate returns a Date built from the API's num", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ num: 1739540559000 }));
    await expect(getNextVotingDate()).resolves.toEqual(new Date(1739540559000));
  });

  it("getTronSuperRepresentativeData applies max and computes totalVotes", async () => {
    hydrateSuperRepresentatives([
      { address: senderBase58, voteCount: 100, isJobs: false } as never,
      { address: recipientBase58, voteCount: 50, isJobs: false } as never,
    ]);
    mockedNetwork.mockResolvedValueOnce(mockResponse({ num: 1 }));
    const data = await getTronSuperRepresentativeData(1);
    expect(data.list).toHaveLength(1);
    expect(data.totalVotes).toBe(150);
  });

  it("getTronSuperRepresentativeData returns the full list when max is null", async () => {
    hydrateSuperRepresentatives([
      { address: senderBase58, voteCount: 100, isJobs: false } as never,
      { address: recipientBase58, voteCount: 50, isJobs: false } as never,
    ]);
    mockedNetwork.mockResolvedValueOnce(mockResponse({ num: 1 }));
    const data = await getTronSuperRepresentativeData(null);
    expect(data.list).toHaveLength(2);
  });
});

describe("voteTronSuperRepresentatives", () => {
  it("forwards encoded addresses and vote counts", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ raw_data: {} }));
    await voteTronSuperRepresentatives(
      { freshAddress: senderBase58 } as Account,
      { votes: [{ address: recipientBase58, voteCount: 7 }] } as never,
    );
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining("/wallet/votewitnessaccount"),
        data: expect.objectContaining({
          votes: [expect.objectContaining({ vote_count: 7 })],
        }),
      }),
    );
  });
});

describe("getUnwithdrawnReward", () => {
  it("returns the BigNumber of reward when present", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ reward: 12345 }));
    const reward = await getUnwithdrawnReward(senderBase58);
    expect(reward.toNumber()).toBe(12345);
  });

  it("returns 0 when reward is missing", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({}));
    const reward = await getUnwithdrawnReward(senderBase58);
    expect(reward.toNumber()).toBe(0);
  });

  it("returns 0 on network error", async () => {
    mockedNetwork.mockRejectedValueOnce(new Error("network"));
    const reward = await getUnwithdrawnReward(senderBase58);
    expect(reward.toNumber()).toBe(0);
  });
});

describe("claimRewardTronTransaction", () => {
  it("POSTs to /wallet/withdrawbalance", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse({ raw_data: {} }));
    await claimRewardTronTransaction({ freshAddress: senderBase58 } as Account);
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining("/wallet/withdrawbalance") }),
    );
  });
});

describe("getChainParameters", () => {
  beforeEach(() => {
    getChainParameters.reset();
  });

  const fullParams = {
    chainParameter: [
      { key: "getEnergyFee", value: 100 },
      { key: "getTransactionFee", value: 1000 },
      { key: "getCreateAccountFee", value: 100_000 },
      { key: "getCreateNewAccountFeeInSystemContract", value: 1_000_000 },
      { key: "getMaintenanceTimeInterval", value: 21_600_000 },
    ],
  };

  it("parses the four governance-voted parameters used for fee estimation", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse(fullParams));

    const params = await getChainParameters();

    expect(params).toEqual({
      energyFee: 100,
      transactionFee: 1000,
      createAccountFee: 100_000,
      createNewAccountFeeInSystemContract: 1_000_000,
    });
  });

  it("falls back to hardcoded values for missing keys", async () => {
    mockedNetwork.mockResolvedValueOnce(
      mockResponse({
        chainParameter: [
          { key: "getTransactionFee", value: 1000 },
          { key: "getCreateAccountFee" }, // value omitted
        ],
      }),
    );

    const params = await getChainParameters();

    expect(params.transactionFee).toBe(1000);
    expect(params.energyFee).toBe(100); // fallback
    expect(params.createAccountFee).toBe(100_000); // fallback
    expect(params.createNewAccountFeeInSystemContract).toBe(1_000_000); // fallback
  });

  it("caches the result across calls (no second HTTP request)", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse(fullParams));

    await getChainParameters();
    await getChainParameters();
    await getChainParameters();

    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });
});

describe("triggerConstantContract", () => {
  const okResponse = {
    result: { result: true },
    energy_used: 14_170,
    constant_result: ["0".repeat(64)],
  };
  const revertResponse = {
    result: { result: false, code: "REVERT", message: "transfer amount exceeds balance" },
    energy_used: 0,
  };

  it("forwards parameters and returns the parsed response on success", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse(okResponse));

    const response = await triggerConstantContract({
      ownerAddress: senderHex,
      contractAddress: recipientHex,
      functionSelector: "transfer(address,uint256)",
      parameter: "deadbeef",
    });

    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: expect.stringContaining("/wallet/triggerconstantcontract"),
        data: {
          owner_address: senderHex,
          contract_address: recipientHex,
          function_selector: "transfer(address,uint256)",
          parameter: "deadbeef",
        },
      }),
    );
    expect(response.energy_used).toBe(14_170);
    expect(response.result?.result).toBe(true);
  });

  it("returns the revert payload without throwing (caller decides what to do)", async () => {
    mockedNetwork.mockResolvedValueOnce(mockResponse(revertResponse));

    const response = await triggerConstantContract({
      ownerAddress: senderHex,
      contractAddress: recipientHex,
      functionSelector: "transfer(address,uint256)",
      parameter: "deadbeef",
    });

    expect(response.result?.result).toBe(false);
    expect(response.result?.code).toBe("REVERT");
  });
});
