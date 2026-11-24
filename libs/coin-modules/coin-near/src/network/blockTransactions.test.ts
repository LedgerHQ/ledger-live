import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../test/coinConfig";
import { mockNearConfig } from "../test/context";
import {
  fetchBlockTransactions,
  fetchIndexedBlock,
  fetchTransactionReceipts,
} from "./blockTransactions";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./node.mock";

const answer = (path: string, body: Record<string, unknown>) =>
  mockServer.use(http.get(`${NEAR_BASE_URL_MOCKED}${path}`, () => HttpResponse.json(body)));

describe("blockTransactions", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  describe("fetchBlockTransactions", () => {
    it("follows the cursor until the last page", async () => {
      const requests: URL[] = [];
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/txns`, ({ request }) => {
          const url = new URL(request.url);
          requests.push(url);
          return url.searchParams.has("next")
            ? HttpResponse.json({ data: [{ transaction_hash: "B" }] })
            : HttpResponse.json({ data: [{ transaction_hash: "A" }], meta: { next_page: "c1" } });
        }),
      );

      const transactions = await fetchBlockTransactions(mockNearConfig, "BlockHash1");

      expect(transactions.map(transaction => transaction.transaction_hash)).toMatchObject([
        "A",
        "B",
      ]);
      expect(requests.map(url => url.searchParams.get("block"))).toMatchObject([
        "BlockHash1",
        "BlockHash1",
      ]);
      expect(requests.map(url => url.searchParams.get("next"))).toMatchObject([null, "c1"]);
    });

    it.each([
      ["repeats a cursor", { data: [{ transaction_hash: "A" }], meta: { next_page: "same" } }],
      ["advertises a cursor after an empty page", { data: [], meta: { next_page: "c1" } }],
    ])("rejects an indexer that %s", async (_name, page) => {
      answer("/v3/txns", page);

      await expect(fetchBlockTransactions(mockNearConfig, "BlockHash1")).rejects.toThrow(
        "cursor does not advance",
      );
    });
  });

  it("reads the block at the given height", async () => {
    const block = { block_hash: "BlockHash1", block_height: "7", block_timestamp: "1" };
    answer("/v3/blocks/7", { data: block });

    await expect(fetchIndexedBlock(mockNearConfig, 7)).resolves.toMatchObject(block);
  });

  it("reads the receipt tree of a transaction", async () => {
    const tree = { predecessor_account_id: "user.near", actions: [], outcome: { status: true } };
    answer("/v3/txns/TxHash1/receipts", { data: tree });

    await expect(fetchTransactionReceipts(mockNearConfig, "TxHash1")).resolves.toMatchObject(tree);
  });

  it.each([
    ["block", "/v3/blocks/7", () => fetchIndexedBlock(mockNearConfig, 7), "block 7 is not indexed"],
    [
      "receipts",
      "/v3/txns/TxHash1/receipts",
      () => fetchTransactionReceipts(mockNearConfig, "TxHash1"),
      "no receipts indexed for transaction TxHash1",
    ],
  ])("rejects %s the indexer does not know", async (_name, path, fetch, message) => {
    answer(path, { data: null });

    await expect(fetch()).rejects.toThrow(message);
  });
});
