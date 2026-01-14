import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { createApi } from "../api";

describe("createApi", () => {
  const mockCurrency = { id: "aleo" } as CryptoCurrency;
  const mockNodeUrl = "https://api.provable.com/v2/testnet";
  const mockAddress = "aleo177n83pjn4m995e60z6njza7xg3wankzfwu3rutqtj05usmtza5yqw8gryy";
  const api = createApi({ nodeUrl: mockNodeUrl }, mockCurrency.id);

  beforeAll(() => {
    setupCalClientStore();
  });

  describe("broadcast", () => {
    it("should throw not supported error", () => {
      expect(() => api.broadcast("tx")).toThrow();
    });
  });

  describe("listOperations", () => {
    it("paginates results", async () => {
      const [page, cursor] = await api.listOperations(mockAddress, {
        minHeight: 1,
        limit: 5,
        order: "desc",
      });

      expect(page.length).toBeGreaterThan(0);
      expect(page.length).toBeLessThanOrEqual(5);
      expect(cursor).toBeTruthy();

      const dates = page.map(op => op.tx.date.getTime());
      const sorted = [...dates].sort((a, b) => b - a);
      expect(dates).toEqual(sorted);
    });

    it("verify rawTx correct mapping", async () => {
      const [ops] = await api.listOperations(mockAddress, {
        limit: 1,
        order: "desc",
        minHeight: 1,
      });

      expect(ops.length).toBe(1);

      const op = ops[0];

      expect(typeof op.id).toBe("string");
      expect(op.type).toBeDefined();
      expect(Array.isArray(op.senders)).toBe(true);
      expect(Array.isArray(op.recipients)).toBe(true);

      expect(typeof op.value).toBe("bigint");

      expect(op.asset).toEqual({ type: "native" });

      expect(op.details).toBeDefined();
      expect(op.details.ledgerOpType).toBe(op.type);

      expect(op.tx).toBeDefined();
      expect(typeof op.tx.hash).toBe("string");
      expect(typeof op.tx.fees).toBe("bigint");
      expect(op.tx.date).toBeInstanceOf(Date);

      expect(op.tx.block).toBeDefined();
      expect(typeof op.tx.block.hash).toBe("string");
      expect(typeof op.tx.block.height).toBe("number");

      expect(typeof op.tx.failed).toBe("boolean");
    });
  });
});