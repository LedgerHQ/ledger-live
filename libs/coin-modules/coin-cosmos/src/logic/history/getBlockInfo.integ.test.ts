import { makeTestApi, TEST_COSMOS_ENDPOINT } from "../../test/msw.mock";
import { getBlockInfo } from "./getBlockInfo";

const HEIGHT = 33721701;
const HASH = "Ze5/0SKKqzMwkTViLiFXoYfkjfXMGw9RXF8/Ajxt+pc=";

describe("getBlockInfo (integ, Cosmos Hub)", () => {
  const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);

  it("returns the height, hash and time of a historical block", async () => {
    await expect(getBlockInfo(api, HEIGHT)).resolves.toEqual({
      height: HEIGHT,
      hash: HASH,
      time: new Date("2026-11-04T10:25:03.669957328Z"),
    });
  });

  it("rejects a height above the chain length", async () => {
    await expect(getBlockInfo(api, 999999999)).rejects.toMatchObject({
      name: "GetBlockInfoError",
      message:
        "Failed to get block info 999999999: requested block height is bigger then the chain length",
      cause: expect.objectContaining({
        message: "requested block height is bigger then the chain length",
      }),
    });
  });

  it("rejects an invalid height", async () => {
    await expect(getBlockInfo(api, 0)).rejects.toMatchObject({
      name: "GetBlockInfoError",
      message: "Failed to get block info 0: Invalid block height: 0",
      cause: expect.objectContaining({ name: "InvalidParameterError" }),
    });
  });
});
