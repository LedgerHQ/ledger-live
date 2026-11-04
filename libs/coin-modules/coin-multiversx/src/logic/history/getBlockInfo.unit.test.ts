import type { MultiversXNetworkApi } from "../../network/api";
import { getBlockInfo } from "./getBlockInfo";

function makeApi(round: Record<string, number>) {
  return { getRound: jest.fn().mockResolvedValue(round) };
}

describe("getBlockInfo", () => {
  it("returns the metachain round as height and hash, timed to the millisecond", async () => {
    const api = makeApi({ round: 42, timestamp: 1793796445, timestampMs: 1793796445800 });

    const info = await getBlockInfo(api as unknown as MultiversXNetworkApi, 42);

    expect(api.getRound).toHaveBeenCalledWith(42);
    expect(info).toEqual({ height: 42, hash: "42", time: new Date(1793796445800) });
  });

  it("falls back to the timestamp in seconds when the round has no millisecond timestamp", async () => {
    const api = makeApi({ round: 42, timestamp: 1793796445 });

    const info = await getBlockInfo(api as unknown as MultiversXNetworkApi, 42);

    expect(info.time).toEqual(new Date(1793796445000));
  });

  it("rejects a negative height without calling the API", async () => {
    const api = makeApi({ round: 0, timestamp: 0 });

    await expect(getBlockInfo(api as unknown as MultiversXNetworkApi, -1)).rejects.toThrow(
      "MultiversX block height must be a non-negative integer, got -1",
    );
    expect(api.getRound).not.toHaveBeenCalled();
  });
});
