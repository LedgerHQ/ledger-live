import { CosmosAPI } from "../../network/Cosmos";
import { getBlockInfo } from "./getBlockInfo";

const BLOCK_INFO = { height: 33721700, hash: "HASH", time: new Date("2026-11-04T10:24:57.711Z") };

function makeApi(impl: (height: number) => Promise<unknown>) {
  const getBlockInfoMock = jest.fn(impl);
  return {
    api: { getBlockInfo: getBlockInfoMock } as unknown as CosmosAPI,
    getBlockInfoMock,
  };
}

describe("getBlockInfo", () => {
  it("returns the block info the api resolves for the height", async () => {
    const { api, getBlockInfoMock } = makeApi(async () => BLOCK_INFO);

    await expect(getBlockInfo(api, 33721700)).resolves.toBe(BLOCK_INFO);
    expect(getBlockInfoMock).toHaveBeenCalledWith(33721700);
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects the invalid height %p without calling the api",
    async height => {
      const { api, getBlockInfoMock } = makeApi(async () => BLOCK_INFO);

      await expect(getBlockInfo(api, height)).rejects.toThrow(`Invalid block height: ${height}`);
      expect(getBlockInfoMock).not.toHaveBeenCalled();
    },
  );

  it("rejects when the api rejects", async () => {
    const { api } = makeApi(async () => {
      throw new Error("requested block height is bigger then the chain length");
    });

    await expect(getBlockInfo(api, 999999999)).rejects.toThrow(
      "requested block height is bigger then the chain length",
    );
  });
});
