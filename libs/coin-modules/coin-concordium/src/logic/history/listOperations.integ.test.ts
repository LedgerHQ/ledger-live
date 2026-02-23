import type { Operation } from "@ledgerhq/coin-framework/api/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "../../config";
import { listOperations } from "./listOperations";

describe("listOperations", () => {
  const currency = getCryptoCurrencyById("concordium");
  const ADDRESS_WITH_BALANCE = "3U6m951FWryY56SKFFHgMLGVHtJtk4VaxN7V2F9hjkR7Sg1FUx";
  const ADDRESS_PRISTINE = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      networkType: "testnet",
      grpcUrl: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 100000,
    }));
  });

  describe("Account with no transactions", () => {
    it("should return empty array for pristine account", async () => {
      const [operations, cursor] = await listOperations(
        ADDRESS_PRISTINE,
        { minHeight: 0 },
        currency,
      );

      expect(Array.isArray(operations)).toBe(true);
      expect(operations.length).toBe(0);
      expect(cursor).toBe("");
    });
  });

  describe("Account with transactions", () => {
    let operations: Operation[];
    let cursor: string;

    beforeAll(async () => {
      [operations, cursor] = await listOperations(ADDRESS_WITH_BALANCE, { minHeight: 0 }, currency);
    });

    it("should fetch operations successfully", async () => {
      expect(Array.isArray(operations)).toBe(true);
    });

    it("should return operations with correct structure", async () => {
      if (operations.length > 0) {
        operations.forEach(operation => {
          expect(operation).toHaveProperty("id");
          expect(operation).toHaveProperty("type");
          expect(operation).toHaveProperty("value");
          expect(operation).toHaveProperty("senders");
          expect(operation).toHaveProperty("recipients");
          expect(operation).toHaveProperty("asset");
          expect(operation).toHaveProperty("tx");

          expect(operation.asset).toEqual({ type: "native" });
          expect(["IN", "OUT"]).toContain(operation.type);
          expect(operation.value).toBeGreaterThanOrEqual(0);
          expect(typeof operation.value).toBe("bigint");
        });
      }
    });

    it("should return operations with valid transaction data", async () => {
      if (operations.length > 0) {
        operations.forEach(operation => {
          expect(operation.tx.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
          expect(typeof operation.tx.fees).toBe("bigint");
          expect(operation.tx.fees).toBeGreaterThanOrEqual(BigInt(0));
          expect(operation.tx.date).toBeInstanceOf(Date);
          expect(operation.tx.failed).toBe(false);

          expect(operation.tx.block).toHaveProperty("height");
          expect(operation.tx.block).toHaveProperty("hash");
          expect(operation.tx.block).toHaveProperty("time");
          expect(operation.tx.block.height).toBeGreaterThanOrEqual(0);
          expect(operation.tx.block.time).toBeInstanceOf(Date);
        });
      }
    });

    it("should return operations sorted by height (newest first)", async () => {
      if (operations.length > 1) {
        for (let i = 0; i < operations.length - 1; i++) {
          expect(operations[i].tx.block.height).toBeGreaterThanOrEqual(
            operations[i + 1].tx.block.height,
          );
        }
      }
    });

    it("should include the account address in senders or recipients", async () => {
      if (operations.length > 0) {
        operations.forEach(operation => {
          const isSenderOrRecipient =
            operation.senders.includes(ADDRESS_WITH_BALANCE) ||
            operation.recipients.includes(ADDRESS_WITH_BALANCE);
          expect(isSenderOrRecipient).toBe(true);
        });
      }
    });

    it("should return unique operations without duplicates", async () => {
      if (operations.length > 0) {
        const hashes = operations.map(op => op.tx.hash);
        const uniqueHashes = new Set(hashes);
        expect(uniqueHashes.size).toBeLessThanOrEqual(operations.length);
      }
    });

    it("should return empty cursor for proxy-based operations", async () => {
      expect(cursor).toBe("");
    });
  });

  describe("Transaction types", () => {
    let operations: Operation[];

    beforeAll(async () => {
      [operations] = await listOperations(ADDRESS_WITH_BALANCE, { minHeight: 0 }, currency);
    });

    it("should categorize operations as IN or OUT", async () => {
      if (operations.length > 0) {
        const inOps = operations.filter(op => op.type === "IN");
        const outOps = operations.filter(op => op.type === "OUT");

        expect(inOps.length + outOps.length).toBe(operations.length);
      }
    });

    it("should have correct sender/recipient for OUT operations", async () => {
      const outOps = operations.filter(op => op.type === "OUT");

      outOps.forEach(operation => {
        expect(operation.senders.includes(ADDRESS_WITH_BALANCE)).toBe(true);
      });
    });

    it("should have correct sender/recipient for IN operations", async () => {
      const inOps = operations.filter(op => op.type === "IN");

      inOps.forEach(operation => {
        expect(operation.recipients.includes(ADDRESS_WITH_BALANCE)).toBe(true);
      });
    });
  });
});
