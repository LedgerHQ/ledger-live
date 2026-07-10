import { http, HttpResponse } from "msw";
import { lastBlock } from "./lastBlock";
import { server, useMswServer, testNetworkApi, TEST_API } from "../tests/msw";

describe("lastBlock (msw)", () => {
  useMswServer();

  it("returns the finalized block height from the metachain blocks endpoint", async () => {
    server.use(http.get(`${TEST_API}/blocks`, () => HttpResponse.json([{ round: 12345678 }])));

    const block = await lastBlock(testNetworkApi());

    expect(block.height).toBe(12345678);
    expect(block.hash).toBe("12345678");
    expect(block.time).toBeInstanceOf(Date);
  });
});
