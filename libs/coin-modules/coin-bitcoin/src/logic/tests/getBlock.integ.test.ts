import type { TransferBlockOperation } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../../config";
import { getBlock } from "../getBlock";
import { getBlockInfo } from "../getBlockInfo";

const liveContext: BitcoinContext = {
  config: async () => ({
    status: { type: "active" },
    name: "Bitcoin",
    unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
    explorer: { url: "https://explorers.api.live.ledger.com" },
    explorerId: "btc",
  }),
  logger: () => {},
};

// Every non-coinbase transaction of block 400000 pays fees. Older blocks (10000 is coinbase-only,
// 100000 to 300000) contain zero-fee transactions, which cannot satisfy `fees > 0`.
const HEIGHT = 400000;
const HASH = "000000000000000004ec466ce4732fe6f1ed1cddc2ed4b328fff5224276e3f6f";
const TX_COUNT = 1660;

describe("getBlock (live explorer)", () => {
  it("returns the block info and all of its transactions", async () => {
    const [block, info] = await Promise.all([
      getBlock(liveContext, "bitcoin", HEIGHT),
      getBlockInfo(liveContext, "bitcoin", HEIGHT),
    ]);

    expect(block.info).toEqual(info);
    expect(block.info.height).toBe(HEIGHT);
    expect(block.info.hash).toBe(HASH);
    expect(block.transactions).toHaveLength(TX_COUNT);
    for (const tx of block.transactions) {
      expect(tx.hash).toMatch(/^[0-9a-f]{64}$/);
    }

    const [coinbase, ...others] = block.transactions;
    expect(coinbase.fees).toBe(0n);
    for (const tx of others) {
      const total = (tx.operations as TransferBlockOperation[]).reduce(
        (sum, op) => sum + op.amount,
        0n,
      );
      expect(tx.fees).toBeGreaterThan(0n);
      // Fees are excluded from the operation amounts, which therefore balance out.
      expect(total).toBe(0n);
    }
  });
});
