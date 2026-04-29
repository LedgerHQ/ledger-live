import coinConfig, { type TezosCoinConfig } from "../config";
import { getBlock } from "./getBlock";

/**
 * Integration tests for getBlock against Shadownet (current Tezos testnet of record;
 * Ghostnet was deprecated in early 2026).
 * https://shadownet.tzkt.io
 *
 * Block 3113219 was chosen because it contains exactly one simple XTZ transfer
 * (1 mutez from a tz2 to a tz1), making the assertions deterministic.
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

describe("getBlock", () => {
  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(shadownetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("should fetch and parse block 3113219 correctly", async () => {
    const block = await getBlock(3113219);

    expect(block.info).toMatchObject({
      hash: "BLAf8kVQvpsgXNA914eLo3gJKauywozjuravm7cmdvZ9VEM4QyK",
      height: 3113219,
      time: new Date("2026-04-29T08:27:12Z"),
      parent: {
        height: 3113218,
        hash: "BLtMGf5iBPGq2c98iXWVX6Z5xK4V227Sm7cCTjyiQ9ufRJRgBmf",
      },
    });

    expect(block.transactions).toHaveLength(1);

    const tx0 = block.transactions[0];
    expect(tx0.hash).toBe("onktfPphnYKAm7yJ2DLWPn3ZHKmx9U6sAiSYSwrpUUimL6ivbr5");
    expect(tx0.failed).toBe(false);
    expect(tx0.fees).toBe(1500n);
    expect(tx0.feesPayer).toBe("tz29GPjgeRQTRX6mcPQXkiuHnq7jbya1Abnq");

    expect(tx0.operations).toEqual(
      expect.arrayContaining([
        {
          type: "transfer",
          address: "tz29GPjgeRQTRX6mcPQXkiuHnq7jbya1Abnq",
          peer: "tz1dKrT1h6d7wP8fEzMPptG6er7mLLeQjBBY",
          asset: { type: "native", name: "XTZ" },
          amount: -1n,
        },
        {
          type: "transfer",
          address: "tz1dKrT1h6d7wP8fEzMPptG6er7mLLeQjBBY",
          peer: "tz29GPjgeRQTRX6mcPQXkiuHnq7jbya1Abnq",
          asset: { type: "native", name: "XTZ" },
          amount: 1n,
        },
      ]),
    );
  });
});
