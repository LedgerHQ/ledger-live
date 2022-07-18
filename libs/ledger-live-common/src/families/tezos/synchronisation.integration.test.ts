import { getEnv, setEnv } from "../../env";
import { fetchAllTransactions } from "./synchronisation";

describe("TEZOS_MAX_TX_QUERIES", () => {
  const bigAccount = "tz1cgQAQfECg5bPASYTMyJ9QJQjSUi8rfL67";
  test("default have more than 100 txs", async () => {
    const txs = await fetchAllTransactions(bigAccount);
    expect(txs.length).toBeGreaterThan(100);
  });
  test("lowering it to 1 will only fetch a few txs", async () => {
    const cur = getEnv("TEZOS_MAX_TX_QUERIES");
    setEnv("TEZOS_MAX_TX_QUERIES", 1);
    try {
      const txs = await fetchAllTransactions(bigAccount);
      expect(txs.length).toBeLessThanOrEqual(100);
    } finally {
      setEnv("TEZOS_MAX_TX_QUERIES", cur);
    }
  });
});
