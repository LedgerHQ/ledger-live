import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { LedgerAPI4xx } from "@ledgerhq/live-network/errors";
import { GetBlockInfoError } from "../../errors";
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
    "rejects the invalid height %p with the block info error, without calling the api",
    async height => {
      const { api, getBlockInfoMock } = makeApi(async () => BLOCK_INFO);
      const cause = `Invalid block height: ${height}`;

      const error = await getBlockInfo(api, height).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(GetBlockInfoError);
      expect(error).toMatchObject({
        name: "GetBlockInfoError",
        message: `Failed to get block info ${height}: ${cause}`,
        cause: expect.objectContaining({ name: "InvalidParameterError", message: cause }),
      });
      expect((error as GetBlockInfoError).cause).toBeInstanceOf(InvalidParameterError);
      expect(getBlockInfoMock).not.toHaveBeenCalled();
    },
  );

  it("rejects with the block info error, keeping the api failure as cause", async () => {
    const failure = new LedgerAPI4xx("requested block height is bigger then the chain length");
    const { api } = makeApi(async () => {
      throw failure;
    });

    const error = await getBlockInfo(api, 999999999).catch((e: unknown) => e);

    expect(error).toMatchObject({
      name: "GetBlockInfoError",
      message:
        "Failed to get block info 999999999: requested block height is bigger then the chain length",
    });
    expect((error as GetBlockInfoError).cause).toBe(failure);
  });
});
