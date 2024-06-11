import { fetchTronAccountTxs } from ".";
import { setCoinConfig } from "../config";

describe("fetchTronAccountTxs", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
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
      const addr = "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj";
      const results = await fetchTronAccountTxs(addr, txs => txs.length < 100, {});

      // THEN
      expect(results).not.toHaveLength(0);
      expect(results).toBeNull();
    },
    10 * 1000,
  );
});
