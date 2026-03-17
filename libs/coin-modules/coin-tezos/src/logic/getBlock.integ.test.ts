import coinConfig, { type TezosCoinConfig } from "../config";
import { getBlock } from "./getBlock";

/**
 * Integration tests for getBlock against Ghostnet (Tezos testnet).
 * https://ghostnet.tzkt.io
 *
 * Block 7000018 was chosen because it contains exactly one simple XTZ
 * transfer with no token transfers, making assertions deterministic.
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

describe("getBlock", () => {
  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(ghostnetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("should fetch and parse block 7000018 correctly", async () => {
    const block = await getBlock(7000018);

    expect(block.info).toMatchObject({
      hash: "BMFAFwCfNXmnMhjawY2BDbUp9LP4dNvrPS8pG5hkidf3NaCQuYu",
      height: 7000018,
      time: new Date("2024-07-09T06:00:05.000Z"),
      parent: {
        height: 7000017,
        hash: "BLEATbXULXDWCpdzCbYVuRALsxHMvDta2rhYQQmrpqX9JWc5mJh",
      },
    });

    expect(block.transactions).toHaveLength(1);

    const tx0 = block.transactions[0];
    expect(tx0.hash).toBe("op4Ftafc4kmPXgTooA4DqaA9jdTWwSUZ39s5UkfqS13h6oM7gzh");
    expect(tx0.failed).toBe(false);
    expect(tx0.fees).toBe(1420n);
    expect(tx0.feesPayer).toBe("tz1N4KaEsfMqSaKW8r1YdAvT5AdenZdPagDR");

    expect(tx0.operations).toEqual(
      expect.arrayContaining([
        {
          type: "transfer",
          address: "tz1N4KaEsfMqSaKW8r1YdAvT5AdenZdPagDR",
          peer: "tz1irUSoD75PVSkWzxMHjEzxwEVm8FaMLczu",
          asset: { type: "native", name: "XTZ" },
          amount: -1n,
        },
        {
          type: "transfer",
          address: "tz1irUSoD75PVSkWzxMHjEzxwEVm8FaMLczu",
          peer: "tz1N4KaEsfMqSaKW8r1YdAvT5AdenZdPagDR",
          asset: { type: "native", name: "XTZ" },
          amount: 1n,
        },
      ]),
    );
  });

  it("should throw for height <= 0", async () => {
    await expect(getBlock(0)).rejects.toThrow("getBlock: height must be a positive integer, got 0");
    await expect(getBlock(-1)).rejects.toThrow(
      "getBlock: height must be a positive integer, got -1",
    );
  });
});
