import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "../config";
import {
  getAccountsByPublicKey,
  getAccountBalance,
  getAccountNonce,
  getTransactions,
  getTransactionCost,
  getOperations,
} from "./proxyClient";

describe("proxyClient", () => {
  const currency = getCryptoCurrencyById("concordium");
  const ADDRESS_WITH_BALANCE = "3U6m951FWryY56SKFFHgMLGVHtJtk4VaxN7V2F9hjkR7Sg1FUx";
  const ADDRESS_PRISTINE = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";
  const PUBLIC_KEY = "aa".repeat(32);
  const ACCOUNT_ID = "js:2:concordium:test:";

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

  describe("getAccountsByPublicKey", () => {
    it("should return accounts for valid public key", async () => {
      // Note: This will return empty for test public key, but should not error
      const result = await getAccountsByPublicKey(currency, PUBLIC_KEY);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return array even for unknown public key", async () => {
      const unknownPubKey = "bb".repeat(32);
      const result = await getAccountsByPublicKey(currency, unknownPubKey);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getAccountBalance", () => {
    it("should return balance for existing account", async () => {
      const result = await getAccountBalance(currency, ADDRESS_WITH_BALANCE);

      expect(result).toHaveProperty("finalizedBalance");
      expect(result.finalizedBalance).toHaveProperty("accountAmount");
      expect(result.finalizedBalance).toHaveProperty("accountAtDisposal");
      expect(typeof result.finalizedBalance.accountAmount).toBe("string");
      expect(typeof result.finalizedBalance.accountAtDisposal).toBe("string");
    });

    it("should return balance structure for pristine account", async () => {
      try {
        const result = await getAccountBalance(currency, ADDRESS_PRISTINE);
        expect(result).toHaveProperty("finalizedBalance");
      } catch (error) {
        // Pristine accounts may not exist yet, which is expected
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should parse balance as valid numbers", async () => {
      const result = await getAccountBalance(currency, ADDRESS_WITH_BALANCE);

      const amount = BigInt(result.finalizedBalance.accountAmount);
      const atDisposal = BigInt(result.finalizedBalance.accountAtDisposal);

      expect(amount).toBeGreaterThanOrEqual(BigInt(0));
      expect(atDisposal).toBeGreaterThanOrEqual(BigInt(0));
      expect(atDisposal).toBeLessThanOrEqual(amount);
    });
  });

  describe("getAccountNonce", () => {
    it("should return nonce for existing account", async () => {
      const result = await getAccountNonce(currency, ADDRESS_WITH_BALANCE);

      expect(result).toHaveProperty("nonce");
      expect(typeof result.nonce).toBe("number");
      expect(result.nonce).toBeGreaterThanOrEqual(0);
    });

    it("should handle pristine account", async () => {
      try {
        const result = await getAccountNonce(currency, ADDRESS_PRISTINE);
        expect(result).toHaveProperty("nonce");
      } catch (error) {
        // Pristine accounts may not exist yet, which is expected
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should return consistent nonce for same account", async () => {
      const result1 = await getAccountNonce(currency, ADDRESS_WITH_BALANCE);
      const result2 = await getAccountNonce(currency, ADDRESS_WITH_BALANCE);

      // Nonce should be the same or higher (if transactions were sent in between)
      expect(result2.nonce).toBeGreaterThanOrEqual(result1.nonce);
    });
  });

  describe("getTransactions", () => {
    it("should return transactions for account", async () => {
      const result = await getTransactions(currency, ADDRESS_WITH_BALANCE);

      expect(result).toHaveProperty("transactions");
      expect(Array.isArray(result.transactions)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const limit = 5;
      const result = await getTransactions(currency, ADDRESS_WITH_BALANCE, { limit });

      expect(result.transactions.length).toBeLessThanOrEqual(limit);
    });

    it("should respect order parameter", async () => {
      const resultDesc = await getTransactions(currency, ADDRESS_WITH_BALANCE, {
        limit: 10,
        order: "d",
      });

      if (resultDesc.transactions.length > 1) {
        // Verify descending order
        for (let i = 0; i < resultDesc.transactions.length - 1; i++) {
          expect(resultDesc.transactions[i].id).toBeGreaterThanOrEqual(
            resultDesc.transactions[i + 1].id,
          );
        }
      }
    });

    it("should return transactions with valid structure", async () => {
      const result = await getTransactions(currency, ADDRESS_WITH_BALANCE, { limit: 5 });

      if (result.transactions.length > 0) {
        result.transactions.forEach(tx => {
          expect(tx).toHaveProperty("id");
          expect(tx).toHaveProperty("transactionHash");
          expect(tx).toHaveProperty("blockTime");
          expect(tx).toHaveProperty("details");
          expect(typeof tx.id).toBe("number");
          expect(typeof tx.transactionHash).toBe("string");
        });
      }
    });
  });

  describe("getTransactionCost", () => {
    it("should return cost estimation for simple transfer", async () => {
      const numSignatures = 1;
      const result = await getTransactionCost(currency, numSignatures);

      expect(result).toHaveProperty("cost");
      expect(result).toHaveProperty("energy");
      expect(typeof result.cost).toBe("string");
      expect(typeof result.energy).toBe("number");

      const cost = BigInt(result.cost);
      const energy = BigInt(result.energy);
      expect(cost).toBeGreaterThan(BigInt(0));
      expect(energy).toBeGreaterThan(BigInt(0));
    });

    it("should return higher cost for transfer with memo", async () => {
      const numSignatures = 1;
      const memoSize = 50;

      const resultWithoutMemo = await getTransactionCost(currency, numSignatures);
      const resultWithMemo = await getTransactionCost(currency, numSignatures, { memoSize });

      const costWithoutMemo = BigInt(resultWithoutMemo.cost);
      const costWithMemo = BigInt(resultWithMemo.cost);

      expect(costWithMemo).toBeGreaterThan(costWithoutMemo);
    });

    it("should scale with memo size", async () => {
      const numSignatures = 1;

      const resultSmallMemo = await getTransactionCost(currency, numSignatures, { memoSize: 10 });
      const resultLargeMemo = await getTransactionCost(currency, numSignatures, {
        memoSize: 100,
      });

      const costSmall = BigInt(resultSmallMemo.cost);
      const costLarge = BigInt(resultLargeMemo.cost);

      expect(costLarge).toBeGreaterThanOrEqual(costSmall);
    });

    it("should return consistent results for same parameters", async () => {
      const numSignatures = 1;

      const result1 = await getTransactionCost(currency, numSignatures);
      const result2 = await getTransactionCost(currency, numSignatures);

      expect(result1.cost).toBe(result2.cost);
      expect(result1.energy).toBe(result2.energy);
    });
  });

  describe("getOperations", () => {
    it("should return operations for account", async () => {
      const result = await getOperations(currency, ADDRESS_WITH_BALANCE, ACCOUNT_ID);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for pristine account", async () => {
      const result = await getOperations(currency, ADDRESS_PRISTINE, ACCOUNT_ID);

      expect(result).toEqual([]);
    });

    it("should respect size parameter", async () => {
      const size = 5;
      const result = await getOperations(currency, ADDRESS_WITH_BALANCE, ACCOUNT_ID, { size });

      expect(result.length).toBeLessThanOrEqual(size);
    });

    it("should return operations with valid structure", async () => {
      const result = await getOperations(currency, ADDRESS_WITH_BALANCE, ACCOUNT_ID, { size: 10 });

      if (result.length > 0) {
        result.forEach(operation => {
          expect(operation).toHaveProperty("id");
          expect(operation).toHaveProperty("hash");
          expect(operation).toHaveProperty("accountId");
          expect(operation).toHaveProperty("type");
          expect(operation).toHaveProperty("value");
          expect(operation).toHaveProperty("fee");
          expect(operation).toHaveProperty("senders");
          expect(operation).toHaveProperty("recipients");
          expect(operation).toHaveProperty("date");

          expect(["IN", "OUT"]).toContain(operation.type);
          expect(operation.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
          expect(operation.date).toBeInstanceOf(Date);
        });
      }
    });

    it("should filter transactions by type", async () => {
      const result = await getOperations(currency, ADDRESS_WITH_BALANCE, ACCOUNT_ID, {
        size: 100,
      });

      if (result.length > 0) {
        result.forEach(operation => {
          // Only transfer and transferWithMemo should be included
          expect(["IN", "OUT"]).toContain(operation.type);
        });
      }
    });

    it("should handle network errors gracefully", async () => {
      // Even with invalid address, should return empty array instead of throwing
      const invalidAddress = "invalid-address";
      const result = await getOperations(currency, invalidAddress, ACCOUNT_ID);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Network connectivity", () => {
    it("should successfully connect to proxy endpoint", async () => {
      await expect(getTransactionCost(currency, 1)).resolves.toHaveProperty("cost");
    });

    it("should handle multiple concurrent requests", async () => {
      const promises = [
        getTransactionCost(currency, 1),
        getTransactionCost(currency, 1),
        getTransactionCost(currency, 1),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toHaveProperty("cost");
        expect(result).toHaveProperty("energy");
      });
    });
  });
});
