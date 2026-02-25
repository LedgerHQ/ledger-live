import coinConfig, { XrpCoinConfig } from "../config";
import { getBlockInfo } from "./getBlockInfo";

let originalGetCoinConfig: () => XrpCoinConfig;

describe("getBlockInfo", () => {
  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(
      () =>
        ({
          node: "https://s.altnet.rippletest.net:51234",
        }) as XrpCoinConfig,
    );
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("should fetch and parse block info for ledger 14263654 correctly", async () => {
    const blockInfo = await getBlockInfo(14263654);

    expect(blockInfo).toMatchObject({
      height: 14263654,
      hash: "10046BD9355CCDAE762C82D5FA59B5DC536E465119FCEFA941C2DD6E6BD155FD",
      time: new Date("2026-01-22T17:46:21.000Z"),
      parent: {
        height: 14263653,
        hash: "DAE7F19542D6F87678681E8E7A65D6EBDC522E4338F38932B0444752E6BBCC25",
      },
    });
  });

  it("should return consistent data with getBlock for the same ledger", async () => {
    const { getBlock } = await import("./getBlock");

    const blockInfo = await getBlockInfo(14263654);
    const block = await getBlock(14263654);

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

  it("should return early for height <= 0", async () => {
    const blockInfoZero = await getBlockInfo(0);
    const blockInfoNegative = await getBlockInfo(-1);

    expect(blockInfoZero).toMatchObject({ height: 0 });
    expect(blockInfoNegative).toMatchObject({ height: -1 });
  });
});
