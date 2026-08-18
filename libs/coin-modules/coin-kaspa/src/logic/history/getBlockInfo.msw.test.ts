import { http, HttpResponse } from "msw";
import { CHAIN_HASH, TEST_KASPA_ENDPOINT, makeApiBlock, server } from "../../test/msw.mock";
import { getBlockInfo } from "./getBlockInfo";

const BLOCKS_URL = `${TEST_KASPA_ENDPOINT}/blocks-from-bluescore`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getBlockInfo via MSW", () => {
  it("requests the blue score (metadata only) and maps the selected-chain block", async () => {
    server.use(
      http.get(BLOCKS_URL, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("blueScore")).toBe("480818084");
        expect(url.searchParams.get("includeTransactions")).toBe("false");
        return HttpResponse.json([
          makeApiBlock({ hash: "b".repeat(64), isChainBlock: false }),
          makeApiBlock({ hash: CHAIN_HASH, isChainBlock: true, timestamp: "1783691947227" }),
        ]);
      }),
    );

    const info = await getBlockInfo(480818084);

    expect(info.height).toBe(480818084);
    expect(info.hash).toBe(CHAIN_HASH);
    expect(info.time.getTime()).toBe(1783691947227);
  });

  it("throws when the endpoint returns a non-ok status", async () => {
    server.use(http.get(BLOCKS_URL, () => new HttpResponse(null, { status: 500 })));

    await expect(getBlockInfo(1)).rejects.toThrow("kaspa: getBlocksFromBlueScore: status 500");
  });

  it("throws when no block exists at the blue score", async () => {
    server.use(http.get(BLOCKS_URL, () => HttpResponse.json([])));

    await expect(getBlockInfo(42)).rejects.toThrow("kaspa: no block at blueScore 42");
  });
});
