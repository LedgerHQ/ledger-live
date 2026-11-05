import { sha256 } from "@cosmjs/crypto";
import { http, HttpResponse } from "msw";
import { GET_BLOCK_WITH_TXS_SDK_EXAMPLE } from "../../network/fixtures";
import { makeTestApi, makeTestConfig, server, TEST_COSMOS_ENDPOINT } from "../../test/msw.mock";
import { getBlock } from "./getBlock";

const TX_HASH = "69FA03588DDD5D61DEA9A47CD51EC4E02921174E24C2A81610124BBA7131F51D";
const NODE_INFO_URL = `${TEST_COSMOS_ENDPOINT}/cosmos/base/tendermint/v1beta1/node_info`;
const BLOCK_WITH_TXS_URL = `${TEST_COSMOS_ENDPOINT}/cosmos/tx/v1beta1/txs/block/:height`;
const TXS_URL = `${TEST_COSMOS_ENDPOINT}/cosmos/tx/v1beta1/txs`;

const config = makeTestConfig("cosmos", TEST_COSMOS_ENDPOINT);

const nodeInfo = http.get(NODE_INFO_URL, () =>
  HttpResponse.json({ application_version: { cosmos_sdk_version: "v0.53.4" } }),
);

const txResults = (code: number) =>
  http.get(TXS_URL, () =>
    HttpResponse.json({
      tx_responses: [{ txhash: TX_HASH, code, height: "33721701" }],
      total: "1",
    }),
  );

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getBlock via MSW", () => {
  it("returns the block header and its transactions", async () => {
    const requests: { height: string; query: string | null }[] = [];
    server.use(
      nodeInfo,
      http.get(BLOCK_WITH_TXS_URL, ({ params }) => {
        requests.push({ height: String(params.height), query: null });
        return HttpResponse.json(GET_BLOCK_WITH_TXS_SDK_EXAMPLE);
      }),
      http.get(TXS_URL, ({ request }) => {
        requests.push({ height: "", query: new URL(request.url).searchParams.get("query") });
        return HttpResponse.json({
          tx_responses: [{ txhash: TX_HASH, code: 0, height: "33721701" }],
          total: "1",
        });
      }),
    );

    const block = await getBlock(config, makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), 33721701);

    expect(requests).toEqual(
      expect.arrayContaining([
        { height: "33721701", query: null },
        { height: "", query: "tx.height=33721701" },
      ]),
    );
    expect(block.info).toEqual({
      height: 33721701,
      hash: GET_BLOCK_WITH_TXS_SDK_EXAMPLE.block_id.hash,
      time: new Date("2026-11-04T10:25:03.669957328Z"),
    });
    expect(block.transactions).toEqual([
      expect.objectContaining({
        hash: TX_HASH,
        failed: false,
        fees: 3629n,
        feesPayer: "cosmos16exhyvwyy82fnavqgupf67lku4jvvd82h7p20u",
      }),
    ]);
    expect(block.transactions[0].operations).toHaveLength(2);
  });

  describe("a block of 250 transactions", () => {
    const total = 250;
    const rawTxs = Array.from({ length: total }, (_, index) =>
      Buffer.from(`tx-${index}`).toString("base64"),
    );
    const hashes = rawTxs.map(rawTx =>
      Buffer.from(sha256(Buffer.from(rawTx, "base64")))
        .toString("hex")
        .toUpperCase(),
    );

    const serveBlock = () => {
      const blockRequests: { limit: number; offset: number }[] = [];
      const resultRequests: { limit: number; page: number }[] = [];
      const [template] = GET_BLOCK_WITH_TXS_SDK_EXAMPLE.txs;
      const decodedTxs = rawTxs.map((_, index) => ({
        ...template,
        body: { ...template.body, memo: `tx-${index}` },
      }));
      const { block } = GET_BLOCK_WITH_TXS_SDK_EXAMPLE;
      const blockWithRawTxs = { ...block, data: { txs: rawTxs } };

      server.use(
        nodeInfo,
        http.get(BLOCK_WITH_TXS_URL, ({ request }) => {
          const params = new URL(request.url).searchParams;
          const offset = Number(params.get("pagination.offset"));
          const limit = Number(params.get("pagination.limit"));
          blockRequests.push({ limit, offset });
          return HttpResponse.json({
            ...GET_BLOCK_WITH_TXS_SDK_EXAMPLE,
            block: blockWithRawTxs,
            sdk_block: blockWithRawTxs,
            txs: decodedTxs.slice(offset, offset + limit),
            pagination: { next_key: null, total: String(total) },
          });
        }),
        http.get(TXS_URL, ({ request }) => {
          const params = new URL(request.url).searchParams;
          const page = Number(params.get("page"));
          const limit = Number(params.get("limit"));
          resultRequests.push({ limit, page });
          return HttpResponse.json({
            tx_responses: hashes
              .slice((page - 1) * limit, page * limit)
              .map(txhash => ({ txhash, code: 0, height: "33721701" })),
            total: String(total),
          });
        }),
      );

      return { blockRequests, resultRequests };
    };

    it("returns every transaction over several pages of the default limit", async () => {
      const { blockRequests, resultRequests } = serveBlock();

      const { transactions } = await getBlock(
        config,
        makeTestApi("cosmos", TEST_COSMOS_ENDPOINT),
        33721701,
      );

      expect(transactions.map(tx => tx.hash)).toEqual(hashes);
      expect(transactions.every(tx => !tx.failed && tx.fees === 3629n)).toBe(true);
      expect(blockRequests).toEqual([
        { limit: 100, offset: 0 },
        { limit: 100, offset: 100 },
        { limit: 100, offset: 200 },
      ]);
      expect(resultRequests.map(request => request.limit)).toEqual([100, 100, 100]);
    });

    it("returns every transaction over several pages of the configured limit", async () => {
      const { blockRequests, resultRequests } = serveBlock();

      const { transactions } = await getBlock(
        { ...config, getBlock: { pagination: { limit: 60 } } },
        makeTestApi("cosmos", TEST_COSMOS_ENDPOINT),
        33721701,
      );

      expect(transactions.map(tx => tx.hash)).toEqual(hashes);
      expect(blockRequests.map(request => request.offset)).toEqual([0, 60, 120, 180, 240]);
      expect(blockRequests.every(request => request.limit === 60)).toBe(true);
      expect(resultRequests.map(request => request.page)).toEqual([1, 2, 3, 4, 5]);
      expect(resultRequests.every(request => request.limit === 60)).toBe(true);
    });
  });

  it.each([0, -5, 2.5])("rejects the configured pagination limit %p", async limit => {
    await expect(
      getBlock(
        { ...config, getBlock: { pagination: { limit } } },
        makeTestApi("cosmos", TEST_COSMOS_ENDPOINT),
        33721701,
      ),
    ).rejects.toMatchObject({
      name: "GetBlockError",
      message: `Failed to get block 33721701: Invalid pagination limit: ${limit}`,
      cause: expect.objectContaining({ name: "InvalidParameterError" }),
    });
  });

  it("flags a transaction the chain reports as failed", async () => {
    server.use(
      nodeInfo,
      http.get(BLOCK_WITH_TXS_URL, () => HttpResponse.json(GET_BLOCK_WITH_TXS_SDK_EXAMPLE)),
      txResults(11),
    );

    const { transactions } = await getBlock(
      config,
      makeTestApi("cosmos", TEST_COSMOS_ENDPOINT),
      33721701,
    );

    expect(transactions[0].failed).toBe(true);
  });

  it("rejects with the block error when the height is above the chain length", async () => {
    server.use(
      nodeInfo,
      http.get(BLOCK_WITH_TXS_URL, () =>
        HttpResponse.json(
          { code: 2, message: "codespace sdk code 26: invalid height" },
          { status: 500 },
        ),
      ),
      txResults(0),
    );

    await expect(
      getBlock(config, makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), 999999999),
    ).rejects.toMatchObject({
      name: "GetBlockError",
      message: "Failed to get block 999999999: codespace sdk code 26: invalid height",
      cause: expect.objectContaining({
        name: "LedgerAPI5xx",
        message: "codespace sdk code 26: invalid height",
      }),
    });
  });

  it("rejects with the block error when the transaction results cannot be fetched", async () => {
    server.use(
      nodeInfo,
      http.get(BLOCK_WITH_TXS_URL, () => HttpResponse.json(GET_BLOCK_WITH_TXS_SDK_EXAMPLE)),
      http.get(TXS_URL, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(
      getBlock(config, makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), 33721701),
    ).rejects.toMatchObject({
      name: "GetBlockError",
      message: expect.stringContaining("Failed to get block 33721701: API HTTP 500"),
      cause: expect.objectContaining({
        name: "LedgerAPI5xx",
        message: expect.stringContaining("API HTTP 500"),
      }),
    });
  });

  it("rejects an invalid height with the block error, without querying the network", async () => {
    await expect(
      getBlock(config, makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), -1),
    ).rejects.toMatchObject({
      name: "GetBlockError",
      message: "Failed to get block -1: Invalid block height: -1",
      cause: expect.objectContaining({ name: "InvalidParameterError" }),
    });
  });
});
