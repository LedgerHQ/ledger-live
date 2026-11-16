import { http, HttpResponse } from "msw";
import { TEST_KASPA_ENDPOINT, server } from "../../test/msw.mock";
import { lastBlock } from "./lastBlock";

const BLUE_SCORE_URL = `${TEST_KASPA_ENDPOINT}/info/virtual-chain-blue-score`;
const BLOCKDAG_URL = `${TEST_KASPA_ENDPOINT}/info/blockdag`;
const SINK_HASH = "c76dbabb6ec21f73ee6604c0269f4e8aa71a240f993081c606592de3eb60dae6";
const PRUNING_HASH = "3914b495474186cbf116561e935a11a1991e42b26e7fbbc4658a0c50cb5d2fa6";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("lastBlock via MSW", () => {
  it("maps the sink's blue score to height and the sink (chain tip) to hash", async () => {
    server.use(
      http.get(BLUE_SCORE_URL, () => HttpResponse.json({ blueScore: 480818084 })),
      http.get(BLOCKDAG_URL, () =>
        HttpResponse.json({ sink: SINK_HASH, pruningPointHash: PRUNING_HASH }),
      ),
    );

    const info = await lastBlock();

    expect(info.height).toBe(480818084);
    expect(info.hash).toBe(SINK_HASH);
    expect(info.time).toBeInstanceOf(Date);
  });

  it("throws when the sink is absent", async () => {
    server.use(
      http.get(BLUE_SCORE_URL, () => HttpResponse.json({ blueScore: 1 })),
      http.get(BLOCKDAG_URL, () => HttpResponse.json({})),
    );

    await expect(lastBlock()).rejects.toThrow("missing sink hash");
  });

  it("throws when the blue score is not a positive integer", async () => {
    server.use(
      http.get(BLUE_SCORE_URL, () => HttpResponse.json({ blueScore: 0 })),
      http.get(BLOCKDAG_URL, () => HttpResponse.json({ sink: SINK_HASH })),
    );

    await expect(lastBlock()).rejects.toThrow("invalid blue score");
  });
});
