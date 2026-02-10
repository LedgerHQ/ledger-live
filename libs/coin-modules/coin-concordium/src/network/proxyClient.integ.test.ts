import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";
import {
  getAccountBalance,
  getAccountNonce,
  getTransactions,
  getTransactionCost,
  getAccountsByPublicKey,
} from "./proxyClient";

describe("Concordium Proxy Client", () => {
  let currency: CryptoCurrency;
  const ADDRESS = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      networkType: "testnet",
      grpcUrl: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 0,
      status: { type: "active" },
    }));
    currency = getCryptoCurrencyById("concordium");
  });

  describe("getAccountBalance", () => {
    it("returns balance information for a valid address", async () => {
      const result = await getAccountBalance(currency, ADDRESS);

      expect(result).toBeDefined();
      expect(result.finalizedBalance).toBeDefined();
      expect(result.finalizedBalance.accountAmount).toBeDefined();
      expect(typeof result.finalizedBalance.accountAmount).toBe("string");
      expect(Number(result.finalizedBalance.accountAmount)).toBeGreaterThanOrEqual(0);
      expect(result.finalizedBalance.accountAtDisposal).toBeDefined();
      expect(result.finalizedBalance.accountCooldowns).toBeInstanceOf(Array);
      expect(typeof result.finalizedBalance.accountNonce).toBe("number");
    });
  });

  describe("getAccountNonce", () => {
    it("returns the next nonce for a valid address", async () => {
      const result = await getAccountNonce(currency, ADDRESS);

      expect(result).toBeDefined();
      expect(typeof result.nonce).toBe("number");
      expect(result.nonce).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getTransactions", () => {
    it("returns transactions for a valid address", async () => {
      const result = await getTransactions(currency, ADDRESS, {
        limit: 10,
        order: "d",
      });

      expect(result).toBeDefined();
      expect(result.transactions).toBeInstanceOf(Array);
      expect(result.transactions.length).toBeLessThanOrEqual(10);
      expect(typeof result.count).toBe("number");
      expect(typeof result.limit).toBe("number");

      result.transactions.forEach(tx => {
        expect(typeof tx.blockTime).toBe("number");
        expect(typeof tx.id).toBe("number");
        expect(tx.details).toBeDefined();
        expect(tx.details.type).toBeDefined();
        expect(tx.origin).toBeDefined();
      });
    });

    it("respects limit parameter", async () => {
      const result = await getTransactions(currency, ADDRESS, {
        limit: 5,
        order: "d",
      });

      expect(result.transactions.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getTransactionCost", () => {
    it("returns cost for a simple transfer", async () => {
      const result = await getTransactionCost(currency, 1);

      expect(result).toBeDefined();
      expect(result.cost).toBeDefined();
      expect(result.energy).toBeDefined();
      expect(Number(result.cost)).toBeGreaterThan(0);
      expect(Number(result.energy)).toBeGreaterThan(0);
    });

    it("returns higher cost when memo size is provided", async () => {
      const simpleCost = await getTransactionCost(currency, 1);
      const memoCost = await getTransactionCost(currency, 1, { memoSize: 50 });

      expect(Number(memoCost.cost)).toBeGreaterThan(Number(simpleCost.cost));
      expect(Number(memoCost.energy)).toBeGreaterThan(Number(simpleCost.energy));
    });
  });

  describe("getAccountsByPublicKey", () => {
    it.skip("returns accounts for a known public key", async () => {
      // This test requires a known public key with accounts on testnet
      // Skip by default as we don't have a guaranteed test public key
      const PUB_KEY = process.env["PUB_KEY"];
      if (!PUB_KEY) return;

      const result = await getAccountsByPublicKey(currency, PUB_KEY);

      expect(result).toBeInstanceOf(Array);
      result.forEach(account => {
        expect(account.address).toBeDefined();
        expect(typeof account.credential_index).toBe("number");
        expect(typeof account.is_simple_account).toBe("boolean");
        expect(account.public_key).toBeDefined();
      });
    });
  });
});
