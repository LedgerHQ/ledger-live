import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../../test/coinConfig";
import { mockServer, NEAR_BASE_URL_MOCKED } from "../../network/node.mock";
import { lastBlock } from "../lastBlock";

const HEADER = { height: 140_000_001, hash: "BlockHash2", timestamp: 1_750_000_100_000_000_000 };

describe("lastBlock (MSW)", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("asks the node for the latest final block and maps its header", async () => {
    let requestedParams: unknown;
    mockServer.use(
      http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
        const body = (await request.json()) as { params: unknown };
        requestedParams = body.params;
        return HttpResponse.json({ result: { header: HEADER } });
      }),
    );

    const block = await lastBlock();

    expect(requestedParams).toEqual({ finality: "final" });
    expect(block).toEqual({
      height: 140_000_001,
      hash: "BlockHash2",
      time: new Date(HEADER.timestamp / 1e6),
    });
  });
});
