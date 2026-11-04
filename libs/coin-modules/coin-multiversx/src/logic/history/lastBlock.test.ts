import { http, HttpResponse } from "msw";
import { lastBlock } from "./lastBlock";
import { server, useMswServer, testNetworkApi, TEST_API } from "../tests/msw";

describe("lastBlock (msw)", () => {
  useMswServer();

  it("returns the latest round from the metachain blocks endpoint", async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(`${TEST_API}/blocks`, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json([
          { round: 12345678, timestamp: 1793796475, timestampMs: 1793796475800 },
        ]);
      }),
    );

    const block = await lastBlock(testNetworkApi());

    expect(query?.get("shard")).toBe("4294967295");
    expect(block).toEqual({ height: 12345678, hash: "12345678", time: new Date(1793796475800) });
  });

  it("fails when the metachain has no block", async () => {
    server.use(http.get(`${TEST_API}/blocks`, () => HttpResponse.json([])));

    await expect(lastBlock(testNetworkApi())).rejects.toThrow(
      "MultiversX API returned no metachain block",
    );
  });
});
