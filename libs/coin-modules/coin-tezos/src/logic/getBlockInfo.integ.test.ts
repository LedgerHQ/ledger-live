import coinConfig, { type TezosCoinConfig } from "../config";
import { getBlockInfo } from "./getBlockInfo";

/**
 * Integration tests for getBlockInfo against Ghostnet (Tezos testnet).
 * https://ghostnet.tzkt.io
 *
 * Uses the same block 7000018 as getBlock.integ.test.ts so both files
 * cover consistent, independently verifiable data.
 */

let originalGetCoinConfig: () => TezosCoinConfig;

const ghostnetConfig = (): TezosCoinConfig =>
  ({
    status: { type: "active" },
    baker: { url: "https://tezos-bakers.api.live.ledger.com" },
    explorer: { url: "https://api.ghostnet.tzkt.io", maxTxQuery: 100 },
    node: { url: "https://rpc.ghostnet.teztnets.com" },
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
    coinConfig.setCoinConfig(ghostnetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("should fetch and parse block info for block 7000018 correctly", async () => {
    const blockInfo = await getBlockInfo(7000018);

    expect(blockInfo).toMatchObject({
      height: 7000018,
      hash: "BMFAFwCfNXmnMhjawY2BDbUp9LP4dNvrPS8pG5hkidf3NaCQuYu",
      time: new Date("2024-07-09T06:00:05.000Z"),
      parent: {
        height: 7000017,
        hash: "BLEATbXULXDWCpdzCbYVuRALsxHMvDta2rhYQQmrpqX9JWc5mJh",
      },
    });
  });

  it("should return consistent data with getBlock for the same block", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getBlock } = require("./getBlock");

    const blockInfo = await getBlockInfo(7000018);
    const block = await getBlock(7000018);

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

  it("should throw for height <= 0", async () => {
    await expect(getBlockInfo(0)).rejects.toThrow(
      "getBlockInfo: height must be a positive integer, got 0",
    );
    await expect(getBlockInfo(-1)).rejects.toThrow(
      "getBlockInfo: height must be a positive integer, got -1",
    );
  });
});
