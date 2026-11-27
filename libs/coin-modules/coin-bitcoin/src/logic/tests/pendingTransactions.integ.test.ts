import type { BitcoinContext } from "../../config";
import { getPendingTransaction } from "../getPendingTransaction";
import { listPendingOperations } from "../listPendingOperations";
import { FUNDED_P2WPKH, SPENT_TX } from "./helpers/fixtures";

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

// The mempool changes from one run to the next: only the shapes and the "not pending" answers are
// pinned here, the content of a pending transaction is covered with the explorer mocked.
describe("pending transactions (live explorer)", () => {
  it("lists the funded address's pending operations, none of them mined", async () => {
    const operations = await listPendingOperations(liveContext, "bitcoin", FUNDED_P2WPKH);
    expect(Array.isArray(operations)).toBe(true);
    for (const operation of operations) {
      expect(operation.tx.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(operation.tx).not.toHaveProperty("block");
      expect(operation.tx.date).toBeInstanceOf(Date);
    }
  });

  it("answers undefined for a mined transaction", async () => {
    await expect(getPendingTransaction(liveContext, "bitcoin", SPENT_TX)).resolves.toBeUndefined();
  });

  it("answers undefined for an unknown transaction", async () => {
    await expect(
      getPendingTransaction(liveContext, "bitcoin", "00".repeat(32)),
    ).resolves.toBeUndefined();
  });
});
