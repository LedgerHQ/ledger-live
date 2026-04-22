import coinConfig, { type StellarCoinConfig } from "../config";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";

const FIXED_LEDGER_SEQUENCE = 20_000_000;

let originalGetCoinConfig: () => StellarCoinConfig;

const mainnetConfig = (): StellarCoinConfig =>
  ({
    status: { type: "active" },
    explorer: {
      url: "https://stellar.coin.ledger.com",
      fetchLimit: 200,
    },
    useStaticFees: true,
    enableNetworkLogs: false,
  }) as StellarCoinConfig;

describe("getBlock (integration)", () => {
  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(mainnetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("fetches ledger metadata and a known payment transaction", async () => {
    const block = await getBlock(FIXED_LEDGER_SEQUENCE);

    expect(block.info).toMatchObject({
      height: FIXED_LEDGER_SEQUENCE,
      hash: "40b150c63d127e52264369090402565489350c7c62aaf59c6daa86be20b1bc90",
      time: new Date("2018-09-15T15:40:05.000Z"),
      parent: {
        height: FIXED_LEDGER_SEQUENCE - 1,
        hash: "6b94d006f60d2b927a7e13c8b127ca45f4357914f52ece5343ff362a1be91fb1",
      },
    });

    const knownPayment = block.transactions.find(
      tx => tx.hash === "efcffb9877c73e74a8c816f57fdeab578fb88646bfa7149399604b59f9ae9ff6",
    );
    expect(knownPayment).not.toBeUndefined();
    expect(knownPayment?.failed).toBe(false);
    expect(knownPayment?.operations.length).toBeGreaterThanOrEqual(2);
    expect(knownPayment?.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "transfer",
          address: "GDL5OWCFRU6TJFZC6TRR5EJBWWFVGYAD3P2UKMF3P2JDKCDKHFM4AWES",
          amount: -10000200n,
        }),
        expect.objectContaining({
          type: "transfer",
          address: "GBFLCCEXVXIONEMYTWCYJJFZN333CTFXGWJ23LACWLLQDFZSXBZRLHU5",
          amount: 10000200n,
        }),
      ]),
    );
  });

  it("returns consistent metadata between getBlockInfo and getBlock", async () => {
    const info = await getBlockInfo(FIXED_LEDGER_SEQUENCE);
    const block = await getBlock(FIXED_LEDGER_SEQUENCE);
    expect(info).toEqual(block.info);
  });
});
