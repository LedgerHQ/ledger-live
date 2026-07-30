import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../test/coinConfig";
import { getBlockHeaderAtHeight, getLastBlockHeader } from "./getBlock";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./node.mock";

const HEADER = { height: 140_000_000, hash: "BlockHash1", timestamp: 1_750_000_000_000_000_000 };

const mockBlock = (capture?: (params: Record<string, unknown>) => void) =>
  mockServer.use(
    http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
      const body = (await request.json()) as { method: string; params: Record<string, unknown> };
      if (body.method !== "block") {
        return HttpResponse.json({ error: { message: `unexpected method ${body.method}` } });
      }
      capture?.(body.params);
      return HttpResponse.json({ result: { header: HEADER, chunks: [] } });
    }),
  );

describe("getBlock", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("asks for the latest final block", async () => {
    let params: Record<string, unknown> | undefined;
    mockBlock(p => (params = p));

    await expect(getLastBlockHeader()).resolves.toEqual(HEADER);
    expect(params).toEqual({ finality: "final" });
  });

  it("asks for a specific height", async () => {
    let params: Record<string, unknown> | undefined;
    mockBlock(p => (params = p));

    await expect(getBlockHeaderAtHeight(140_000_000)).resolves.toEqual(HEADER);
    expect(params).toEqual({ block_id: 140_000_000 });
  });

  it.each([-1, 1.5, Number.NaN])(
    "rejects the invalid height %p without a request",
    async height => {
      // No handler is registered, so a request would fail the suite on an unhandled call.
      await expect(getBlockHeaderAtHeight(height)).rejects.toThrow(
        `invalid block height ${height}`,
      );
    },
  );

  it("throws when the node returns no header", async () => {
    mockServer.use(
      http.post(NEAR_BASE_URL_MOCKED, () =>
        HttpResponse.json({ error: { message: "DB Not Found Error" } }),
      ),
    );

    await expect(getLastBlockHeader()).rejects.toThrow("DB Not Found Error");
  });
});
