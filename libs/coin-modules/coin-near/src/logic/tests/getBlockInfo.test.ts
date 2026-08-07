import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../../test/coinConfig";
import { mockServer, NEAR_BASE_URL_MOCKED } from "../../network/node.mock";
import { getBlockInfo } from "../getBlockInfo";

const HEADER = { height: 140_000_000, hash: "BlockHash1", timestamp: 1_750_000_000_000_000_000 };

describe("getBlockInfo (MSW)", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("maps the node's header into BlockInfo, converting the nanosecond timestamp", async () => {
    mockServer.use(
      http.post(NEAR_BASE_URL_MOCKED, () => HttpResponse.json({ result: { header: HEADER } })),
    );

    const block = await getBlockInfo(140_000_000);

    expect(block).toEqual({
      height: 140_000_000,
      hash: "BlockHash1",
      time: new Date(HEADER.timestamp / 1e6),
    });
  });

  it("propagates the node's error message for an invalid height", async () => {
    mockServer.use(
      http.post(NEAR_BASE_URL_MOCKED, () =>
        HttpResponse.json({ error: { message: "DB Not Found Error" } }),
      ),
    );

    await expect(getBlockInfo(999_999_999)).rejects.toThrow("DB Not Found Error");
  });
});
