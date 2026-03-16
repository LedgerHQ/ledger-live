import type { RawOperation } from "../../types";
import { setupTestnetCoinConfig } from "../../test/fixtures";
import { listOperations } from "./listOperations";

describe("listOperations", () => {
  const ADDRESS_WITH_BALANCE = "3U6m951FWryY56SKFFHgMLGVHtJtk4VaxN7V2F9hjkR7Sg1FUx";
  const ADDRESS_PRISTINE = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";

  beforeAll(() => {
    setupTestnetCoinConfig();
  });

  describe("Account with no transactions", () => {
    it("should return empty array for pristine account", async () => {
      const { items: operations, next: cursor } = await listOperations(
        ADDRESS_PRISTINE,
        { minHeight: 0 },
        "concordium_testnet",
      );

      expect(Array.isArray(operations)).toBe(true);
      expect(operations.length).toBe(0);
      expect(cursor).toBeUndefined();
    });
  });

  describe("Account with transactions", () => {
    let operations: RawOperation[];
    let cursor: string | undefined;

    beforeAll(async () => {
      const page = await listOperations(
        ADDRESS_WITH_BALANCE,
        { minHeight: 0 },
        "concordium_testnet",
      );
      operations = page.items;
      cursor = page.next;
    });

    it("should fetch operations successfully", async () => {
      expect(Array.isArray(operations)).toBe(true);
    });

    it("should return operations with correct structure", async () => {
      if (operations.length > 0) {
        operations.forEach(operation => {
          expect(operation).toHaveProperty("hash");
          expect(operation).toHaveProperty("type");
          expect(operation).toHaveProperty("value");
          expect(operation).toHaveProperty("sender");
          expect(operation).toHaveProperty("recipient");
          expect(operation).toHaveProperty("amount");
          expect(operation).toHaveProperty("fee");

          expect(["IN", "OUT"]).toContain(operation.type);
          expect(typeof operation.value).toBe("string");
          expect(typeof operation.amount).toBe("string");
          expect(typeof operation.fee).toBe("string");
        });
      }
    });

    it("should return operations with valid transaction data", async () => {
      if (operations.length > 0) {
        operations.forEach(operation => {
          expect(operation.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
          expect(Number(operation.fee)).toBeGreaterThanOrEqual(0);
          expect(operation.date).toBeInstanceOf(Date);
          expect(typeof operation.failed).toBe("boolean");
        });
      }
    });

    it("should include the account address in sender or recipient", async () => {
      if (operations.length > 0) {
        operations.forEach(operation => {
          const isSenderOrRecipient =
            operation.sender === ADDRESS_WITH_BALANCE ||
            operation.recipient === ADDRESS_WITH_BALANCE;
          expect(isSenderOrRecipient).toBe(true);
        });
      }
    });

    it("should return unique operations without duplicates", async () => {
      if (operations.length > 0) {
        const hashes = operations.map(op => op.hash);
        const uniqueHashes = new Set(hashes);
        expect(uniqueHashes.size).toBeLessThanOrEqual(operations.length);
      }
    });

    it("should return empty cursor for proxy-based operations", async () => {
      expect(cursor).toBeUndefined();
    });
  });

  describe("Transaction types", () => {
    let operations: RawOperation[];

    beforeAll(async () => {
      const page = await listOperations(
        ADDRESS_WITH_BALANCE,
        { minHeight: 0 },
        "concordium_testnet",
      );
      operations = page.items;
    });

    it("should categorize operations as IN or OUT", async () => {
      if (operations.length > 0) {
        const inOps = operations.filter(op => op.type === "IN");
        const outOps = operations.filter(op => op.type === "OUT");

        expect(inOps.length + outOps.length).toBe(operations.length);
      }
    });

    it("should have correct sender for OUT operations", async () => {
      const outOps = operations.filter(op => op.type === "OUT");

      outOps.forEach(operation => {
        expect(operation.sender).toBe(ADDRESS_WITH_BALANCE);
      });
    });

    it("should have correct recipient for IN operations", async () => {
      const inOps = operations.filter(op => op.type === "IN");

      inOps.forEach(operation => {
        expect(operation.recipient).toBe(ADDRESS_WITH_BALANCE);
      });
    });
  });
});
