import { http, HttpResponse } from "msw";
import { getBlock } from "./getBlock";
import { server, useMswServer, testNetworkApi, TEST_API } from "../tests/msw";

const ROUND = 40045794;
const METACHAIN_ROUND_URL = `${TEST_API}/rounds/4294967295/${ROUND}`;
const SENDER = "erd1qxae079av6p2xnklfkc90tl4kwqk47u0hwwz3mp3gzx2q654zy0scphk9s";
const RECEIVER = "erd1axqs2gpka9dzkdwj986z3umgusvnlmfejudj9hk0r89l28spgrjq0uuyf6";

function apiTransaction(index: number) {
  return {
    txHash: `tx-${index}`,
    sender: SENDER,
    receiver: RECEIVER,
    value: "1000",
    fee: "50000000000000",
    status: "success",
    round: ROUND,
    timestamp: 1793796445,
  };
}

describe("getBlock (msw)", () => {
  useMswServer();

  function serveRound(
    transactions: ReturnType<typeof apiTransaction>[],
    queries: URLSearchParams[],
  ) {
    server.use(
      http.get(METACHAIN_ROUND_URL, () =>
        HttpResponse.json({ round: ROUND, timestamp: 1793796445, timestampMs: 1793796445800 }),
      ),
      http.get(`${TEST_API}/transactions`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        queries.push(params);
        if (params.has("from")) {
          return new HttpResponse("Result window is too large", { status: 400 });
        }
        const after = params.get("searchAfter");
        const start = after ? Number(after.replace("cursor-", "")) + 1 : 0;
        const page = transactions.slice(start, start + Number(params.get("size")));
        return HttpResponse.json(
          page.map((tx, i) => ({ ...tx, searchAfter: `cursor-${start + i}` })),
        );
      }),
    );
  }

  it("reads the metachain round and every page of the round transactions with their operations", async () => {
    const transactions = Array.from({ length: 60 }, (_, i) => apiTransaction(i));
    const queries: URLSearchParams[] = [];
    serveRound(transactions, queries);

    const block = await getBlock(testNetworkApi(), ROUND);

    expect(block.info).toEqual({
      height: ROUND,
      hash: String(ROUND),
      time: new Date(1793796445800),
    });
    expect(block.transactions.map(tx => tx.hash)).toEqual(transactions.map(tx => tx.txHash));
    expect(queries.map(params => params.get("round"))).toEqual([String(ROUND), String(ROUND)]);
    expect(queries.every(params => params.get("withOperations") === "true")).toBe(true);
  });

  it("reads a round of more than 10,000 transactions that share one timestamp", async () => {
    const transactions = Array.from({ length: 10_001 }, (_, i) => apiTransaction(i));
    serveRound(transactions, []);

    const block = await getBlock(testNetworkApi(), ROUND);

    expect(block.transactions).toHaveLength(10_001);
    expect(new Set(block.transactions.map(tx => tx.hash)).size).toBe(10_001);
  });

  it("reads an empty round", async () => {
    serveRound([], []);

    const block = await getBlock(testNetworkApi(), ROUND);

    expect(block.transactions).toEqual([]);
  });

  it("fails when the round does not exist yet", async () => {
    server.use(
      http.get(METACHAIN_ROUND_URL, () => new HttpResponse(null, { status: 404 })),
      http.get(`${TEST_API}/transactions`, () => HttpResponse.json([])),
    );

    await expect(getBlock(testNetworkApi(), ROUND)).rejects.toThrow("API HTTP 404");
  });
});
