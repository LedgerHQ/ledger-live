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

  it("rejects when the height is above the chain length", async () => {
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
    ).rejects.toThrow("codespace sdk code 26: invalid height");
  });

  it("rejects when the transaction results cannot be fetched", async () => {
    server.use(
      nodeInfo,
      http.get(BLOCK_WITH_TXS_URL, () => HttpResponse.json(GET_BLOCK_WITH_TXS_SDK_EXAMPLE)),
      http.get(TXS_URL, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(
      getBlock(config, makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), 33721701),
    ).rejects.toThrow("API HTTP 500");
  });

  it("rejects an invalid height without querying the network", async () => {
    await expect(getBlock(config, makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), -1)).rejects.toThrow(
      "Invalid block height: -1",
    );
  });
});
