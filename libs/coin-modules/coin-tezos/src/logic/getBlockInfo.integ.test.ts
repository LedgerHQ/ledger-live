import coinConfig, { type TezosCoinConfig } from "../config";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";

/**
 * Integration tests for getBlockInfo against Shadownet (current Tezos testnet
 * of record; Ghostnet was deprecated in early 2026).
 * https://shadownet.tzkt.io
 *
 * Uses the same block 3113219 as getBlock.integ.test.ts so both files cover
 * consistent, independently verifiable data.
 */

let originalGetCoinConfig: () => TezosCoinConfig;

const shadownetConfig = (): TezosCoinConfig =>
  ({
    status: { type: "active" },
    baker: { url: "https://tezos-bakers.api.live.ledger.com" },
    explorer: { url: "https://api.shadownet.tzkt.io", maxTxQuery: 100 },
    node: { url: "https://rpc.shadownet.teztnets.com" },
    fees: {
      minGasLimit: 0,
      minRevealGasLimit: 0,
      minStorageLimit: 0,
      minFees: 0,
      minEstimatedFees: 0,
    },
  }) as TezosCoinConfig;

describe("getBlockInfo", () => {
  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(shadownetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("should fetch and parse block info for block 3113219 correctly", async () => {
    const blockInfo = await getBlockInfo(3113219);

    expect(blockInfo).toMatchObject({
      height: 3113219,
      hash: "BLAf8kVQvpsgXNA914eLo3gJKauywozjuravm7cmdvZ9VEM4QyK",
      time: new Date("2026-04-29T08:27:12Z"),
      parent: {
        height: 3113218,
        hash: "BLtMGf5iBPGq2c98iXWVX6Z5xK4V227Sm7cCTjyiQ9ufRJRgBmf",
      },
    });
  });

  it("should return consistent data with getBlock for the same block", async () => {
    const blockInfo = await getBlockInfo(3113219);
    const block = await getBlock(3113219);

    expect(blockInfo).toMatchObject({
      height: block.info.height,
      hash: block.info.hash,
      time: block.info.time,
      parent: {
        height: block.info.parent?.height,
        hash: block.info.parent?.hash,
      },
    });
  });
});
