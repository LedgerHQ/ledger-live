import type { BitcoinContext } from "../../config";
import { listOperations } from "../listOperations";
import { EMPTIED_P2PKH, FUNDED_P2WPKH, PRISTINE_P2WPKH } from "./helpers/fixtures";

const context: BitcoinContext = {
  config: async () => ({
    status: { type: "active" },
    name: "Bitcoin",
    unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
    explorer: { url: "https://explorers.api.live.ledger.com" },
    explorerId: "btc",
  }),
  logger: () => {},
};

describe("listOperations (mainnet)", () => {
  it("lists nothing for a pristine address", async () => {
    expect(await listOperations(context, "bitcoin", PRISTINE_P2WPKH, { minHeight: 0 })).toEqual({
      items: [],
      next: undefined,
    });
  });

  it("lists the incoming payment of a funded address", async () => {
    const { items } = await listOperations(context, "bitcoin", FUNDED_P2WPKH, { minHeight: 0 });
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toEqual(
      expect.objectContaining({ type: "IN", value: 9_623n, recipients: [FUNDED_P2WPKH] }),
    );
  });

  it("lists outgoing operations of a used address and pages through them", async () => {
    const first = await listOperations(context, "bitcoin", EMPTIED_P2PKH, {
      minHeight: 0,
      limit: 2,
    });
    expect(first.items.length).toBeGreaterThan(0);
    expect(first.next).toEqual(expect.any(String));
    const second = await listOperations(context, "bitcoin", EMPTIED_P2PKH, {
      minHeight: 0,
      limit: 2,
      cursor: first.next!,
    });
    expect(second.items.length).toBeGreaterThan(0);
    expect(second.items[0].tx.hash).not.toBe(first.items[0].tx.hash);
    expect([...first.items, ...second.items].some(op => op.type === "OUT")).toBe(true);
  });
});
