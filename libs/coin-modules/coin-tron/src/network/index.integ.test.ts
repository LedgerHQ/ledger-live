import { fetchTronAccountTxs } from ".";
import coinConfig from "../config";

describe("fetchTronAccountTxs", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    }));
  });

  it(
    "maps all fields correctly",
    async () => {
      // WHEN
      // const addr = "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre";
      // const addr = "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj";
      // const addr = "THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi";
      // const addr = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
      // const addr = "TUxd6v64YTWkfpFpNDdtgc5Ps4SfGxwizT";
      const addr = "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh";
      const results = await fetchTronAccountTxs(addr, txs => txs.length < 100, {});

      // THEN
      expect(results).not.toHaveLength(0);
    },
    10 * 1000,
  );
});
