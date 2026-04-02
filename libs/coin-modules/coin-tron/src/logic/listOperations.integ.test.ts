import { Operation } from "@ledgerhq/coin-module-framework/api/types";
import coinConfig from "../config";
import { listOperations, ListOperationsOptions } from "./listOperations";

describe("listOperations", () => {
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

  describe("Pagination", () => {
    const testingAccount = "TRRYfGVrzuUvJYRe9UaA8KqxjgVSwU9m6L";

    it("should paginate through transactions without duplicates", async () => {
      const options: ListOperationsOptions = {
        limit: 50,
        minTimestamp: 0,
        order: "asc",
      };

      const allOperations: Operation[] = [];
      const seenTxIds = new Set<string>();
      let cursor: string | undefined;
      let pageCount = 0;
      const maxPages = 5;

      while (pageCount < maxPages) {
        const result = await listOperations(testingAccount, { ...options, cursor });
        pageCount++;

        for (const op of result.items) {
          if (seenTxIds.has(op.id)) {
            throw new Error(`Duplicate transaction found: ${op.id}`);
          }
          seenTxIds.add(op.id);
          allOperations.push(op);
        }

        if (!result.next) break;
        cursor = result.next;
      }

      expect(allOperations.length).toBeGreaterThan(50);
      expect(pageCount).toBeGreaterThan(1);

      for (let i = 1; i < allOperations.length; i++) {
        const prevTimestamp = allOperations[i - 1].tx.block.time.getTime();
        const currTimestamp = allOperations[i].tx.block.time.getTime();
        expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
      }
    }, 60000);

    it("should return consistent results when re-fetching with same cursor", async () => {
      const options: ListOperationsOptions = {
        limit: 20,
        minTimestamp: 0,
        order: "asc",
      };

      const firstPage = await listOperations(testingAccount, options);
      expect(typeof firstPage.next).toBe("string");

      const secondPageA = await listOperations(testingAccount, {
        ...options,
        cursor: firstPage.next,
      });
      const secondPageB = await listOperations(testingAccount, {
        ...options,
        cursor: firstPage.next,
      });

      expect(secondPageA.items.length).toBe(secondPageB.items.length);
      for (let i = 0; i < secondPageA.items.length; i++) {
        expect(secondPageA.items[i].id).toBe(secondPageB.items[i].id);
      }
    }, 30000);

    it("should handle cursor at block boundary without losing transactions", async () => {
      const options: ListOperationsOptions = {
        limit: 10,
        minTimestamp: 0,
        order: "asc",
      };

      const allOps: Operation[] = [];
      let cursor: string | undefined;

      for (let page = 0; page < 10; page++) {
        const result = await listOperations(testingAccount, { ...options, cursor });
        allOps.push(...result.items);
        if (!result.next) break;
        cursor = result.next;
      }

      const txIds = allOps.map(op => op.id);
      const uniqueTxIds = new Set(txIds);
      expect(txIds.length).toBe(uniqueTxIds.size);
    }, 60000);
  });

  describe("Basic operations", () => {
    const testingAccount = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";

    it("should fetch operations in ascending order", async () => {
      const options: ListOperationsOptions = {
        limit: 50,
        minTimestamp: 0,
        order: "asc",
      };

      const result = await listOperations(testingAccount, options);

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThan(0);

      for (let i = 1; i < result.items.length; i++) {
        const prevTimestamp = result.items[i - 1].tx.block.time.getTime();
        const currTimestamp = result.items[i].tx.block.time.getTime();
        expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
      }
    }, 30000);

    it("should fetch operations in descending order", async () => {
      const options: ListOperationsOptions = {
        limit: 50,
        minTimestamp: 0,
        order: "desc",
      };

      const result = await listOperations(testingAccount, options);

      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThan(0);

      for (let i = 1; i < result.items.length; i++) {
        const prevTimestamp = result.items[i - 1].tx.block.time.getTime();
        const currTimestamp = result.items[i].tx.block.time.getTime();
        expect(currTimestamp).toBeLessThanOrEqual(prevTimestamp);
      }
    }, 30000);

    it("should filter by minTimestamp", async () => {
      const minTimestamp = 1600000000000;
      const options: ListOperationsOptions = {
        limit: 50,
        minTimestamp,
        order: "asc",
      };

      const result = await listOperations(testingAccount, options);

      for (const op of result.items) {
        expect(op.tx.block.time.getTime()).toBeGreaterThanOrEqual(minTimestamp);
      }
    }, 30000);
  });

  describe("Transaction types", () => {
    const testingAccount = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const magnitudeMultiplier = 1000000;

    it("should return TRX native operations", async () => {
      const options: ListOperationsOptions = {
        limit: 200,
        minTimestamp: 0,
        order: "desc",
      };

      const result = await listOperations(testingAccount, options);

      const nativeOps = result.items.filter(op => op.asset.type === "native");
      expect(nativeOps.length).toBeGreaterThan(0);

      const txHash = "7aa4e072e4846e99728e4852852be017ad5bbb4c1f9935ba7d266a88533992be";
      const operation = result.items.find(op => op.tx.hash === txHash);
      expect(operation).toMatchObject({
        type: "OUT",
        value: BigInt(0.1 * magnitudeMultiplier),
        senders: [testingAccount],
        recipients: ["TASbVCzbnwu8swZEGFBAH88Z4AwTTBt1PW"],
        asset: { type: "native" },
      });
    }, 60000);

    it("should return TRC10 operations", async () => {
      const options: ListOperationsOptions = {
        limit: 200,
        minTimestamp: 0,
        order: "desc",
      };

      const result = await listOperations(testingAccount, options);

      const trc10Ops = result.items.filter(op => op.asset.type === "trc10");
      expect(trc10Ops.length).toBeGreaterThan(0);

      const txHash = "242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7";
      const operation = result.items.find(op => op.tx.hash === txHash);
      expect(operation).toMatchObject({
        type: "IN",
        value: BigInt(5.911874 * magnitudeMultiplier),
        recipients: [testingAccount],
        senders: ["TWBEcQ57vbFSEhrQCvsHLDuSb39wprpsEX"],
        asset: {
          type: "trc10",
          assetReference: "1004031",
        },
      });
    }, 30000);

    it("should return TRC20 operations", async () => {
      const options: ListOperationsOptions = {
        limit: 200,
        minTimestamp: 0,
        order: "desc",
      };

      const result = await listOperations(testingAccount, options);

      const trc20Ops = result.items.filter(op => op.asset.type === "trc20");
      expect(trc20Ops.length).toBeGreaterThan(0);

      const txHash = "548f235c69eaab2aedaddb5b4763303316d02c2ec4d25617cc3c2a26e1b4a201";
      const operation = result.items.find(op => op.tx.hash === txHash);
      expect(operation).toMatchObject({
        type: "IN",
        value: BigInt(0.000376 * magnitudeMultiplier),
        senders: ["TUgU8FRUFSUfxTAoSPsaUBzJgSwpUuJs9N"],
        recipients: [testingAccount],
        asset: {
          type: "trc20",
          assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        },
      });
    }, 60000);
  });

  describe("Edge cases", () => {
    it("should handle account with failed trc20 transaction", async () => {
      const testingAccount = "TTZQfHheDCDbY2kW5tETUGJrPKLUa3T4ag";
      const options: ListOperationsOptions = {
        limit: 200,
        minTimestamp: 1771521400000,
        order: "asc",
      };

      const result = await listOperations(testingAccount, options);

      const failedTxHash = "f8a52daf9a247f73432afa292b8063d5c5429c8fdb0f8c66f5e8b15b3767e14b";
      const failedOp = result.items.find(op => op.tx.hash === failedTxHash);
      expect(failedOp).toMatchObject({
        tx: expect.objectContaining({
          hash: failedTxHash,
          failed: true,
        }),
        asset: {
          type: "trc20",
          assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        },
      });
    }, 60000);

    it("should return empty result for account with no transactions after minTimestamp", async () => {
      const testingAccount = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
      const options: ListOperationsOptions = {
        limit: 50,
        minTimestamp: Date.now() + 1000000000,
        order: "asc",
      };

      const result = await listOperations(testingAccount, options);
      expect(result.items).toHaveLength(0);
      expect(result.next).toBeUndefined();
    }, 30000);
  });
});
