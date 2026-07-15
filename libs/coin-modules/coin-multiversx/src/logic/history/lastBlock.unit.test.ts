import { lastBlock } from "./lastBlock";
import type { MultiversXNetworkApi } from "../../network/api";

function makeApi(blockHeight = 12345678): MultiversXNetworkApi {
  return {
    getBlockchainBlockHeight: jest.fn().mockResolvedValue(blockHeight),
  } as unknown as MultiversXNetworkApi;
}

describe("lastBlock", () => {
  it("returns block height as number", async () => {
    const api = makeApi(9999999);
    const block = await lastBlock(api);

    expect(block.height).toBe(9999999);
  });

  it("returns hash derived from height", async () => {
    const api = makeApi(42);
    const block = await lastBlock(api);

    expect(block.hash).toBe("42");
  });

  it("returns a time close to now", async () => {
    const before = Date.now();
    const api = makeApi(1);
    const block = await lastBlock(api);
    const after = Date.now();

    expect(block.time.getTime()).toBeGreaterThanOrEqual(before);
    expect(block.time.getTime()).toBeLessThanOrEqual(after + 5);
  });
});
