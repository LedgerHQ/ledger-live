import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { lastBlock } from "./lastBlock";

const LATEST_BLOCK = `${TEST_COSMOS_ENDPOINT}/cosmos/base/tendermint/v1beta1/blocks/latest`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("lastBlock via MSW", () => {
  it("returns height/hash/time parsed from sdk_block (cosmos-sdk >= 0.47)", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(LATEST_BLOCK, () =>
        HttpResponse.json({
          block_id: { hash: "ABCDEF0123456789", part_set_header: { total: 1, hash: "aa" } },
          // Deprecated field still present alongside sdk_block on modern chains — getLatestBlockInfo
          // must prefer sdk_block.
          block: { header: { height: "111", time: "2024-01-01T00:00:00Z" } },
          sdk_block: { header: { height: "123456", time: "2024-06-01T12:00:00Z" } },
        }),
      ),
    );

    const block = await lastBlock(api);

    expect(block.height).toBe(123456);
    expect(block.hash).toBe("ABCDEF0123456789");
    expect(block.time).toEqual(new Date("2024-06-01T12:00:00Z"));
  });

  it("falls back to the deprecated block field when sdk_block is absent (pre-0.47 chain)", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(LATEST_BLOCK, () =>
        HttpResponse.json({
          block_id: { hash: "FEDCBA9876543210", part_set_header: { total: 1, hash: "bb" } },
          block: { header: { height: "222", time: "2023-01-01T00:00:00Z" } },
        }),
      ),
    );

    const block = await lastBlock(api);

    expect(block.height).toBe(222);
    expect(block.hash).toBe("FEDCBA9876543210");
    expect(block.time).toEqual(new Date("2023-01-01T00:00:00Z"));
  });

  it("throws when the blocks/latest endpoint errors", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(http.get(LATEST_BLOCK, () => new HttpResponse(null, { status: 500 })));

    await expect(lastBlock(api)).rejects.toThrow();
  });
});
