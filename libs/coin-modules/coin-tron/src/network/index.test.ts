import { assert } from "console";
import { HttpResponse, http } from "msw";
import { setupServer, SetupServerApi } from "msw/node";
import coinConfig from "../config";
import { TRANSACTION_DETAIL_FIXTURE, TRANSACTION_FIXTURE, TRC20_FIXTURE } from "./types.fixture";
import { defaultFetchParams, fetchTronAccountTxs } from ".";

const TRON_BASE_URL_TEST = "https://httpbin.org";

const defaultGetTransactionsH = http.get(
  `${TRON_BASE_URL_TEST}/v1/accounts/:addr/transactions`,
  () => HttpResponse.json(TRANSACTION_FIXTURE),
);

const defaultGetTrc20TransactionsH = http.get(
  `${TRON_BASE_URL_TEST}/v1/accounts/:addr/transactions/trc20`,
  () => HttpResponse.json(TRC20_FIXTURE),
);

const defaultGetTxInfo = http.get(
  `${TRON_BASE_URL_TEST}/wallet/gettransactioninfobyid`,
  ({ request }) => {
    const url = new URL(request.url);
    const value = url.searchParams.get("value") ?? "UNKNOWN";
    return HttpResponse.json(TRANSACTION_DETAIL_FIXTURE(value));
  },
);

function doBeforeAll(server: SetupServerApi): () => void {
  return () => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: TRON_BASE_URL_TEST,
      },
    }));

    server.listen();
  };
}

function doBeforeEach(server: SetupServerApi): () => void {
  return () => server.resetHandlers();
}

function doAfterAll(server: SetupServerApi): () => void {
  return () => server.close();
}

function buildTriggerSmartContractFixture(txId: string, contractRet: "REVERT" | "SUCCESS") {
  return {
    ret: [{ contractRet, fee: 0 }],
    signature: ["sig"],
    txID: txId,
    net_usage: 0,
    raw_data_hex: "",
    net_fee: 0,
    energy_usage: 0,
    block_timestamp: 1717419792000,
    blockNumber: 80285488,
    energy_fee: 0,
    energy_usage_total: 0,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              owner_address: "4105cc125604448afeb6867eb688efb7e80411d57a",
              contract_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
              data: "",
            },
            type_url: "type.googleapis.com/protocol.TriggerSmartContract",
          },
          type: "TriggerSmartContract",
        },
      ],
      ref_block_bytes: "00",
      ref_block_hash: "00",
      expiration: 1717419846000,
      timestamp: 1717419788444,
    },
    internal_transactions: [],
  };
}

function buildTrc20TransferFixture(txId: string) {
  return {
    transaction_id: txId,
    token_info: {
      symbol: "USDT",
      address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      decimals: 6,
      name: "Tether USD",
    },
    block_timestamp: 1717419792000,
    from: "TQ7pF3NTDL2Tjz5rdJ6ECjQWjaWHpLZJMH",
    to: "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj",
    detail: {
      ret: [{ contractRet: "SUCCESS", fee: 0 }],
      signature: ["sig"],
      txID: txId,
      net_usage: 345,
      raw_data_hex: "",
      net_fee: 0,
      energy_usage: 0,
      blockNumber: 80285488,
      block_timestamp: 1717419792000,
      energy_fee: 0,
      energy_usage_total: 0,
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                owner_address: "4105cc125604448afeb6867eb688efb7e80411d57a",
                contract_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
                data: "",
              },
              type_url: "type.googleapis.com/protocol.TriggerSmartContract",
            },
            type: "TriggerSmartContract",
          },
        ],
        ref_block_bytes: "00",
        ref_block_hash: "00",
        expiration: 1717419846000,
        timestamp: 1717419788444,
      },
      internal_transactions: [],
    },
    type: "Transfer",
    value: "1000000",
  };
}

describe("fetchTronAccountTxs", () => {
  const handlers = [defaultGetTransactionsH, defaultGetTrc20TransactionsH, defaultGetTxInfo];

  const mockServer = setupServer(...handlers);

  beforeAll(doBeforeAll(mockServer));
  beforeEach(doBeforeEach(mockServer));
  afterAll(doAfterAll(mockServer));

  it("convert correctly operations from the blockchain", async () => {
    // WHEN
    const results = await fetchTronAccountTxs(
      "ADDRESS",
      txs => txs.length < 100,
      {},
      defaultFetchParams,
    );

    // THEN
    expect(results).toContainEqual(
      expect.objectContaining({
        blockHeight: 62258698,
        from: "TQ7pF3NTDL2Tjz5rdJ6ECjQWjaWHpLZJMH",
        to: "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj",
      }),
    );
  }, 10_000);
});

describe("fetchTronAccountTxs with invalid TRC20 (see LIVE-18992)", () => {
  const tx1Hash = "1237889e91c0ebbe389436c341865df09921f8f0c029d9286102372cbaadc585";
  const tx2Hash = "154164dd04482ae78f930033d0ad95730b8b19fde171a33c3920d18c228426ab";
  let counterGetTrc20 = 0;
  const invalidTrc20Handler = http.get(
    `${TRON_BASE_URL_TEST}/v1/accounts/:addr/transactions/trc20`,
    () => {
      const ret: any = JSON.parse(JSON.stringify(TRC20_FIXTURE));
      switch (counterGetTrc20) {
        case 0: {
          const tx1 = ret.data[0];
          assert(tx1.transaction_id === tx1Hash);
          ret.data[0].detail.ret = undefined;
          break;
        }
        case 1: {
          const tx2 = ret.data[1];
          assert(tx2.transaction_id === tx2Hash);
          ret.data[1].detail.ret = undefined;
          break;
        }
        default:
          // the 3rd call should not happen
          // because merging the 1st and 2nd results is enough to have a full set, perfectly well formed
          throw "results should be merged after 2 calls";
      }
      counterGetTrc20++;
      return HttpResponse.json(ret);
    },
  );
  const handlers = [defaultGetTransactionsH, invalidTrc20Handler, defaultGetTxInfo];
  const mockServer = setupServer(...handlers);

  beforeAll(doBeforeAll(mockServer));
  beforeEach(doBeforeEach(mockServer));
  afterAll(doAfterAll(mockServer));

  it("retry several times until result is correct", async () => {
    // WHEN
    const results = await fetchTronAccountTxs("ADDRESS", () => true, {}, defaultFetchParams);

    // THEN
    expect(results).toContainEqual(expect.objectContaining({ txID: tx1Hash }));
    expect(results).toContainEqual(expect.objectContaining({ txID: tx2Hash }));
  }, 10_000);
});

describe("Failed TRC20 txs", () => {
  const txId = "f8a52daf9a247f73432afa292b8063d5c5429c8fdb0f8c66f5e8b15b3767e14b";
  const mockServer = setupServer(defaultGetTxInfo);

  const getTrc20 = (trc20Txs: any[]) =>
    http.get(`${TRON_BASE_URL_TEST}/v1/accounts/:addr/transactions/trc20`, () =>
      HttpResponse.json({
        data: trc20Txs,
        success: true,
        meta: { at: 0, page_size: 0 },
      }),
    );

  const getEmptyTrc20 = getTrc20([]);

  const getNativeTx = (nativeTxs: any[]) =>
    http.get(`${TRON_BASE_URL_TEST}/v1/accounts/:addr/transactions`, () =>
      HttpResponse.json({
        data: nativeTxs,
        success: true,
        meta: { at: 1717419792000, page_size: 1 },
      }),
    );

  const fetchTxs = (address: string) =>
    fetchTronAccountTxs(address, () => true, {}, defaultFetchParams);

  beforeAll(doBeforeAll(mockServer));
  beforeEach(doBeforeEach(mockServer));
  afterAll(doAfterAll(mockServer));

  // this scenario is to make sure that failed TRC20 tx are returned
  it("returns the failed TriggerSmartContract tx when tx not in TRC20 set", async () => {
    const failedTriggerSmartContractFixture = buildTriggerSmartContractFixture(txId, "REVERT");
    mockServer.use(getNativeTx([failedTriggerSmartContractFixture]), getEmptyTrc20);

    const results = await fetchTxs("ADDRESS");

    expect(results).toEqual([
      expect.objectContaining({
        txID: txId,
        hasFailed: true,
        type: "TriggerSmartContract",
      }),
    ]);
  }, 10_000);

  it("excludes successful TriggerSmartContract tx when tx not in TRC20 set", async () => {
    const successfulTriggerSmartContractFixture = buildTriggerSmartContractFixture(txId, "SUCCESS");
    mockServer.use(getNativeTx([successfulTriggerSmartContractFixture]), getEmptyTrc20);

    const results = await fetchTxs("ADDRESS");

    expect(results).not.toContainEqual(expect.objectContaining({ txID: txId }));
  }, 10_000);

  it("returns a single successful TriggerSmartContract from TRC20 (deduped with native) when tx is in TRC20 set", async () => {
    const successfulTriggerSmartContractFixture = buildTriggerSmartContractFixture(txId, "SUCCESS");
    mockServer.use(
      getNativeTx([successfulTriggerSmartContractFixture]),
      getTrc20([buildTrc20TransferFixture(txId)]),
    );

    const results = await fetchTxs("ADDRESS");
    expect(results).toEqual([
      expect.objectContaining({
        txID: txId,
        hasFailed: false,
        type: "TriggerSmartContract",
        tokenType: "trc20",
      }),
    ]);
  }, 10_000);
});

describe("fetchTronAccountTxs with invalid TRC20 (see LIVE-18992): after 3 tries it throws an exception", () => {
  const tx1Hash = "1237889e91c0ebbe389436c341865df09921f8f0c029d9286102372cbaadc585";
  const alwaysInvalidTrc20Handler = http.get(
    `${TRON_BASE_URL_TEST}/v1/accounts/:addr/transactions/trc20`,
    () => {
      const ret: any = JSON.parse(JSON.stringify(TRC20_FIXTURE));
      const tx1 = ret.data[0];
      assert(tx1.transaction_id === tx1Hash);
      ret.data[0].detail.ret = undefined;
      return HttpResponse.json(ret);
    },
  );

  const handlers = [defaultGetTransactionsH, alwaysInvalidTrc20Handler, defaultGetTxInfo];
  const mockServer = setupServer(...handlers);

  beforeAll(doBeforeAll(mockServer));
  beforeEach(doBeforeEach(mockServer));
  afterAll(doAfterAll(mockServer));

  it("after several retry, it gives up on retry", async () => {
    await expect(
      fetchTronAccountTxs("ADDRESS", () => true, {}, defaultFetchParams),
    ).rejects.toThrow(
      "getTrc20TxsWithRetry: couldn't fetch trc20 transactions after several attempts",
    );
  }, 10_000);
});
