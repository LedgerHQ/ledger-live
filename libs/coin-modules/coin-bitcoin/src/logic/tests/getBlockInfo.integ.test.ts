import { bitcoinDefaults, type BitcoinContext } from "../../config";
import { getBlockInfo } from "../getBlockInfo";
import { KNOWN_BLOCK } from "./helpers/fixtures";

const liveContext: BitcoinContext = {
  config: async () => bitcoinDefaults.bitcoin,
  logger: () => {},
};

describe("getBlockInfo (live explorer)", () => {
  it("returns the known block 10000", async () => {
    const info = await getBlockInfo(liveContext, "bitcoin", KNOWN_BLOCK.height);
    expect(info.height).toBe(KNOWN_BLOCK.height);
    expect(info.hash).toBe(KNOWN_BLOCK.hash);
    expect(info.time).toBeInstanceOf(Date);
    expect(Number.isNaN(info.time.getTime())).toBe(false);
  });
});
