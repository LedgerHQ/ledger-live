import { lastBlock } from "./lastBlock";
import type { MultiversXNetworkApi } from "../../network/api";

function makeApi(round: Record<string, number>): MultiversXNetworkApi {
  return {
    getLatestRound: jest.fn().mockResolvedValue(round),
  } as unknown as MultiversXNetworkApi;
}

describe("lastBlock", () => {
  it("returns the latest metachain round as height and hash, timed like getBlockInfo", async () => {
    const api = makeApi({ round: 9999999, timestamp: 1793796475, timestampMs: 1793796475800 });

    const block = await lastBlock(api);

    expect(block).toEqual({ height: 9999999, hash: "9999999", time: new Date(1793796475800) });
  });
});
