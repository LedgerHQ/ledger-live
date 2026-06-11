import { Operation } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  address as TyphonAddress,
  types as TyphonTypes,
  utils as TyphonUtils,
} from "@stricahq/typhonjs";
import { listOperations } from "./listOperations";

/**
 * Integration tests for listOperations against Cardano mainnet API.
 * Tests are resilient to empty data and validate logic with real blockchain transactions.
 *
 * NOTE: these are `.integ.test.ts` and are excluded from the default `pnpm test`
 * run, so they do not gate correctness in CI. The mapping/pagination logic should
 * also be covered by deterministic unit tests that mock `@ledgerhq/live-network/network`
 * (tracked as a follow-up) — those are what catch a mapping regression on every PR.
 */
describe("listOperations", () => {
  let currency: CryptoCurrency;
  let TESTING_ADDRESS: string;
  let PRISTINE_ADDRESS: string;
  // `listOperations` ignores `options.limit` (the backend dictates page size), so
  // every first-page `minHeight: 0, order: "desc"` query returns the same page.
  // Fetch it once and share it across the tests that only inspect that page,
  // instead of hitting mainnet ~24 times.
  let descFirstPage: Awaited<ReturnType<typeof listOperations>>;

  beforeAll(async () => {
    currency = getCryptoCurrencyById("cardano");

    const testAddressFromCodebase =
      "addr1q8mgw8geggkl2hs0m6rq3pgt69uxttpqcgu6euxje5tt6plxjtjrnskhhtt03g6l3sr98p9t8mtlajr26vmwjzep77pqxn8cms";
    const decodedAddress = TyphonUtils.getAddressFromString(testAddressFromCodebase);

    if (!(decodedAddress instanceof TyphonAddress.BaseAddress)) {
      throw new Error("Test address must be a BaseAddress");
    }

    const realPaymentCredHash = decodedAddress.paymentCredential.hash;
    const realStakeCredHash = decodedAddress.stakeCredential.hash;

    const testAddress = new TyphonAddress.BaseAddress(
      TyphonTypes.NetworkId.MAINNET,
      {
        type: TyphonTypes.HashType.ADDRESS,
        hash: realPaymentCredHash,
      },
      {
        type: TyphonTypes.HashType.ADDRESS,
        hash: realStakeCredHash,
      },
    );
    TESTING_ADDRESS = testAddress.getBech32();

    const pristinePaymentHash = Buffer.from("00".repeat(28), "hex");
    const pristineStakeHash = Buffer.from("00".repeat(28), "hex");

    const pristineAddress = new TyphonAddress.BaseAddress(
      TyphonTypes.NetworkId.MAINNET,
      {
        type: TyphonTypes.HashType.ADDRESS,
        hash: pristinePaymentHash,
      },
      {
        type: TyphonTypes.HashType.ADDRESS,
        hash: pristineStakeHash,
      },
    );
    PRISTINE_ADDRESS = pristineAddress.getBech32();

    descFirstPage = await listOperations(currency, TESTING_ADDRESS, {
      minHeight: 0,
      order: "desc",
      limit: 200,
    });
  }, 30000);

  describe("Basic operations", () => {
    it("rejects ascending order (unsupported on a newest-first backend)", async () => {
      await expect(
        listOperations(currency, TESTING_ADDRESS, { minHeight: 0, order: "asc", limit: 20 }),
      ).rejects.toThrow("ascending order is not supported");
    });

    it("should fetch operations in descending order", () => {
      const result = descFirstPage;

      expect(result.items).toBeInstanceOf(Array);

      if (result.items.length > 1) {
        for (let i = 1; i < result.items.length; i++) {
          const prevTimestamp = result.items[i - 1].tx.date.getTime();
          const currTimestamp = result.items[i].tx.date.getTime();
          expect(currTimestamp).toBeLessThanOrEqual(prevTimestamp);
        }
      }
    }, 30000);

    it("should filter by minHeight", async () => {
      const minHeight = 8000000;
      const result = await listOperations(currency, TESTING_ADDRESS, {
        minHeight,
        order: "desc",
        limit: 20,
      });

      for (const op of result.items) {
        expect(op.tx.block.height).toBeGreaterThanOrEqual(minHeight);
      }
    }, 30000);
  });

  describe("Operation structure validation", () => {
    it("should return properly structured operations", () => {
      const result = descFirstPage;

      expect(result.items).toBeInstanceOf(Array);

      if (result.items.length === 0) {
        return;
      }

      result.items.forEach(op => {
        expect(op).toHaveProperty("id");
        expect(op).toHaveProperty("type");
        expect(op).toHaveProperty("senders");
        expect(op).toHaveProperty("recipients");
        expect(op).toHaveProperty("value");
        expect(op).toHaveProperty("asset");
        expect(op).toHaveProperty("tx");

        expect(["NONE", "FEES", "IN", "OUT", "DELEGATE", "UNDELEGATE"]).toContain(op.type);

        expect(Array.isArray(op.senders)).toBe(true);
        expect(Array.isArray(op.recipients)).toBe(true);

        expect(typeof op.value).toBe("bigint");
        expect(op.value).toBeGreaterThanOrEqual(0n);

        expect(op.asset).toHaveProperty("type");
        expect(["native", "token"].includes(op.asset.type)).toBe(true);

        expect(op.tx).toHaveProperty("hash");
        expect(op.tx).toHaveProperty("block");
        expect(op.tx).toHaveProperty("fees");
        expect(op.tx).toHaveProperty("date");
        expect(op.tx).toHaveProperty("failed");

        expect(op.tx.hash).toMatch(/^[a-f0-9]{64}$/);

        expect(op.tx.block.height).toBeGreaterThan(0);
        expect(op.tx.block.time).toBeInstanceOf(Date);

        expect(typeof op.tx.fees).toBe("bigint");
        expect(op.tx.fees).toBeGreaterThanOrEqual(0n);

        expect(op.tx.date).toBeInstanceOf(Date);

        expect(typeof op.tx.failed).toBe("boolean");

        // API returns addresses in hex format while we query with bech32. Address filtering
        // happens at the API level by payment key, so all returned operations are relevant.
      });
    }, 30000);
  });

  describe("Pagination", () => {
    it("should paginate through operations without duplicates", async () => {
      const allOperations: Operation[] = [];
      const seenTxIds = new Set<string>();
      let cursor: string | undefined;
      let pageCount = 0;
      const maxPages = 3;
      const limit = 10;

      while (pageCount < maxPages) {
        const result = await listOperations(currency, TESTING_ADDRESS, {
          minHeight: 0,
          order: "desc",
          limit,
          ...(cursor ? { cursor } : {}),
        });
        pageCount++;

        for (const op of result.items) {
          if (seenTxIds.has(op.id)) {
            throw new Error(`Duplicate operation found: ${op.id}`);
          }
          seenTxIds.add(op.id);
          allOperations.push(op);
        }

        if (!result.next) break;
        cursor = result.next;
      }

      expect(seenTxIds.size).toBe(allOperations.length);

      for (let i = 1; i < allOperations.length; i++) {
        const prevTimestamp = allOperations[i - 1].tx.date.getTime();
        const currTimestamp = allOperations[i].tx.date.getTime();
        expect(currTimestamp).toBeLessThanOrEqual(prevTimestamp);
      }
    }, 60000);

    it("should return consistent results when re-fetching with same cursor", async () => {
      const firstPage = await listOperations(currency, TESTING_ADDRESS, {
        minHeight: 0,
        order: "desc",
        limit: 10,
      });

      if (!firstPage.next) {
        return;
      }

      const secondPageA = await listOperations(currency, TESTING_ADDRESS, {
        minHeight: 0,
        order: "desc",
        limit: 10,
        cursor: firstPage.next,
      });
      const secondPageB = await listOperations(currency, TESTING_ADDRESS, {
        minHeight: 0,
        order: "desc",
        limit: 10,
        cursor: firstPage.next,
      });

      expect(secondPageA.items.length).toBe(secondPageB.items.length);
      for (let i = 0; i < secondPageA.items.length; i++) {
        expect(secondPageA.items[i].id).toBe(secondPageB.items[i].id);
      }
    }, 30000);

    it("should return undefined cursor on last page", async () => {
      let cursor: string | undefined;
      let lastResult;
      let pageCount = 0;
      const maxPages = 10;

      while (pageCount < maxPages) {
        lastResult = await listOperations(currency, TESTING_ADDRESS, {
          minHeight: 0,
          order: "desc",
          limit: 10,
          ...(cursor ? { cursor } : {}),
        });
        pageCount++;

        if (!lastResult.next) {
          expect(lastResult.next).toBeUndefined();
          return;
        }

        cursor = lastResult.next;
      }
    }, 60000);
  });

  describe("Transaction types", () => {
    it("should return native ADA operations", () => {
      const result = descFirstPage;

      const nativeOps = result.items.filter(op => op.asset.type === "native");

      if (nativeOps.length === 0) {
        return;
      }

      nativeOps.forEach(op => {
        expect(op.asset).toEqual({ type: "native" });
        expect(op.value).toBeGreaterThanOrEqual(0n);
      });
    }, 30000);

    it("should return token operations if present", () => {
      const result = descFirstPage;

      const tokenOps = result.items.filter(op => op.asset.type === "token");

      if (tokenOps.length > 0) {
        tokenOps.forEach(op => {
          expect(op.asset.type).toBe("token");
          expect(op.asset).toHaveProperty("assetReference");

          if ("assetOwner" in op.asset && op.asset.assetOwner) {
            expect(op.asset.assetOwner).toBe(TESTING_ADDRESS);
          }

          if (op.details) {
            expect(op.details).toHaveProperty("policyId");
            expect(op.details).toHaveProperty("assetName");
          }
        });
      }
    });
  });

  describe("Operation types", () => {
    it("should correctly identify IN operations", () => {
      const result = descFirstPage;

      const inOps = result.items.filter(op => op.type === "IN");

      inOps.forEach(op => {
        expect(op.type).toBe("IN");
        expect(op.recipients.length).toBeGreaterThan(0);
        expect(op.value).toBeGreaterThan(0n);
      });
    }, 30000);

    it("should correctly identify OUT operations", () => {
      const result = descFirstPage;

      const outOps = result.items.filter(op => op.type === "OUT");

      outOps.forEach(op => {
        expect(op.type).toBe("OUT");
        expect(op.senders.length).toBeGreaterThan(0);
      });
    }, 30000);

    it("should correctly identify FEES operations", () => {
      const result = descFirstPage;

      const feesOps = result.items.filter(op => op.type === "FEES");

      if (feesOps.length > 0) {
        feesOps.forEach(op => {
          expect(op.type).toBe("FEES");
          // value excludes the fee (the generic-coin-framework adapter re-adds tx.fees).
          expect(op.value).toBe(0n);
          expect(op.senders.length).toBeGreaterThan(0);
        });
      }
    }, 30000);

    it("should correctly identify DELEGATE operations", () => {
      const result = descFirstPage;

      const delegateOps = result.items.filter(op => op.type === "DELEGATE");

      if (delegateOps.length > 0) {
        delegateOps.forEach(op => {
          expect(op.type).toBe("DELEGATE");
          if (op.details && typeof op.details === "object") {
            expect(op.details).toHaveProperty("poolId");
          }
        });
      }
    }, 30000);

    it("should correctly identify UNDELEGATE operations", () => {
      const result = descFirstPage;

      const undelegateOps = result.items.filter(op => op.type === "UNDELEGATE");

      if (undelegateOps.length > 0) {
        undelegateOps.forEach(op => {
          expect(op.type).toBe("UNDELEGATE");
          expect(op.senders.length).toBeGreaterThan(0);
          expect(op.recipients.length).toBeGreaterThan(0);
        });
      }
    }, 30000);
  });

  describe("Cardano-specific features", () => {
    it("should include deposit details for stake registrations", () => {
      const result = descFirstPage;

      const opsWithDeposit = result.items.filter(
        op => op.details && typeof op.details === "object" && "deposit" in op.details,
      );

      if (opsWithDeposit.length > 0) {
        opsWithDeposit.forEach(op => {
          expect(op.details).toHaveProperty("deposit");
          const deposit = (op.details as any).deposit;
          expect(typeof deposit).toBe("string");
          const depositAmount = BigInt(deposit);
          expect(depositAmount).toBeGreaterThan(0n);
        });
      }
    }, 30000);

    it("should include refund details for stake de-registrations", () => {
      const result = descFirstPage;

      const opsWithRefund = result.items.filter(
        op =>
          op.type === "UNDELEGATE" &&
          op.details &&
          typeof op.details === "object" &&
          "refund" in op.details,
      );

      if (opsWithRefund.length > 0) {
        opsWithRefund.forEach(op => {
          expect(op.type).toBe("UNDELEGATE");
          expect(op.details).toHaveProperty("refund");
          const refund = (op.details as any).refund;
          expect(typeof refund).toBe("string");
          const refundAmount = BigInt(refund);
          expect(refundAmount).toBeGreaterThan(0n);
        });
      }
    }, 30000);

    it("should include rewards for withdrawal operations", () => {
      const result = descFirstPage;

      const opsWithWithdrawals = result.items.filter(
        op => op.details && typeof op.details === "object" && "rewards" in op.details,
      );

      if (opsWithWithdrawals.length > 0) {
        opsWithWithdrawals.forEach(op => {
          expect(op.details).toHaveProperty("rewards");
          const rewards = (op.details as any).rewards;
          expect(typeof rewards).toBe("string");
          const rewardsAmount = BigInt(rewards);
          expect(rewardsAmount).toBeGreaterThan(0n);
          expect(op.value).toBeGreaterThanOrEqual(0n);
        });
      }
    }, 30000);

    it("should format pool IDs in bech32 format for delegations", () => {
      const result = descFirstPage;

      const delegateOpsWithPool = result.items.filter(
        op =>
          op.type === "DELEGATE" &&
          op.details &&
          typeof op.details === "object" &&
          "poolId" in op.details,
      );

      if (delegateOpsWithPool.length > 0) {
        delegateOpsWithPool.forEach(op => {
          expect(op.type).toBe("DELEGATE");
          expect(op.details).toHaveProperty("poolId");
          const poolId = (op.details as any).poolId;
          expect(typeof poolId).toBe("string");

          const isBech32 = poolId.startsWith("pool1") || poolId.startsWith("pool_test1");
          const isHex = /^[a-f0-9]{56}$/.test(poolId);

          expect(isBech32).toBe(true);
          expect(isHex).toBe(false);
        });
      }
    }, 30000);

    it("should include memo when present in transaction metadata", () => {
      const result = descFirstPage;

      const opsWithMemo = result.items.filter(
        op => op.details && typeof op.details === "object" && "memo" in op.details,
      );

      if (opsWithMemo.length > 0) {
        opsWithMemo.forEach(op => {
          expect(op.details).toHaveProperty("memo");
          const memo = (op.details as any).memo;
          expect(typeof memo).toBe("string");
          expect(memo.length).toBeGreaterThan(0);
        });
      }
    }, 30000);

    it("should include metadata hash when present", () => {
      const result = descFirstPage;

      const opsWithMetadata = result.items.filter(
        op => op.details && typeof op.details === "object" && "metadataHash" in op.details,
      );

      if (opsWithMetadata.length > 0) {
        opsWithMetadata.forEach(op => {
          expect(op.details).toHaveProperty("metadataHash");
          const metadataHash = (op.details as any).metadataHash;
          expect(typeof metadataHash).toBe("string");
          expect(metadataHash.length).toBeGreaterThan(0);
        });
      }
    }, 30000);

    it("should handle Conway era stake registrations", async () => {
      const result = await listOperations(currency, TESTING_ADDRESS, {
        minHeight: 8000000, // Post-Conway hardfork
        order: "desc",
        limit: 200,
      });

      const conwayRegistrations = result.items.filter(
        op =>
          op.type === "DELEGATE" &&
          op.details &&
          typeof op.details === "object" &&
          "deposit" in op.details,
      );

      if (conwayRegistrations.length > 0) {
        conwayRegistrations.forEach(op => {
          expect(op.type).toBe("DELEGATE");
          expect(op.details).toHaveProperty("deposit");
          const deposit = (op.details as any).deposit;
          expect(typeof deposit).toBe("string");
          expect(BigInt(deposit)).toBeGreaterThan(0n);
        });
      }
    }, 30000);
  });

  describe("Token operations", () => {
    it("should return token operations with proper structure", () => {
      const result = descFirstPage;

      const tokenOps = result.items.filter(op => op.asset.type === "token");

      if (tokenOps.length > 0) {
        tokenOps.forEach(op => {
          expect(op.asset.type).toBe("token");
          expect(op.asset).toHaveProperty("assetReference");

          if ("assetOwner" in op.asset && op.asset.assetOwner) {
            expect(op.asset.assetOwner).toBe(TESTING_ADDRESS);
          }

          if (op.details) {
            expect(op.details).toHaveProperty("policyId");
            expect(op.details).toHaveProperty("assetName");
          }
        });
      }
    }, 30000);

    it("should decode token asset names when ASCII-decodable", () => {
      const result = descFirstPage;

      const tokenOps = result.items.filter(op => op.asset.type === "token");

      if (tokenOps.length > 0) {
        tokenOps.forEach(op => {
          expect(op.details).toHaveProperty("assetName");
          const assetName = (op.details as any).assetName;
          expect(typeof assetName).toBe("string");

          if (op.details && "assetNameDecoded" in op.details) {
            const decoded = (op.details as any).assetNameDecoded;
            expect(typeof decoded).toBe("string");
            expect(decoded).not.toBe(assetName);
            expect(decoded).toMatch(/^[\x20-\x7E]+$/);
          }
        });
      }
    }, 30000);

    it("should handle transactions with multiple tokens", () => {
      const result = descFirstPage;

      const tokenOps = result.items.filter(op => op.asset.type === "token");

      if (tokenOps.length > 1) {
        const opsByTx = new Map<string, typeof tokenOps>();
        tokenOps.forEach(op => {
          const txHash = op.tx.hash;
          if (!opsByTx.has(txHash)) {
            opsByTx.set(txHash, []);
          }
          opsByTx.get(txHash)!.push(op);
        });

        for (const [txHash, ops] of opsByTx) {
          if (ops.length > 1) {
            const assetRefs = new Set(ops.map(op => (op.asset as any).assetReference));
            expect(assetRefs.size).toBe(ops.length);

            ops.forEach(op => {
              expect(op.tx.hash).toBe(txHash);
            });
          }
        }
      }
    }, 30000);
  });

  describe("Address handling", () => {
    it("should convert hex addresses to bech32 format", () => {
      const result = descFirstPage;

      if (result.items.length > 0) {
        result.items.forEach(op => {
          op.senders.forEach(sender => {
            const isShelleyBech32 =
              sender.startsWith("addr1") ||
              sender.startsWith("addr_test1") ||
              sender.startsWith("stake") ||
              sender.startsWith("stake_test");

            const isByron =
              sender.startsWith("Ae2") ||
              sender.startsWith("Dd") ||
              /^[A-Za-z0-9]{58,}$/.test(sender);

            const isHex = /^[a-f0-9]+$/.test(sender) && sender.length > 50;

            expect(isShelleyBech32 || isByron).toBe(true);
            expect(isHex).toBe(false);
          });

          op.recipients.forEach(recipient => {
            const isShelleyBech32 =
              recipient.startsWith("addr1") ||
              recipient.startsWith("addr_test1") ||
              recipient.startsWith("stake") ||
              recipient.startsWith("stake_test");

            const isByron =
              recipient.startsWith("Ae2") ||
              recipient.startsWith("Dd") ||
              /^[A-Za-z0-9]{58,}$/.test(recipient);

            const isHex = /^[a-f0-9]+$/.test(recipient) && recipient.length > 50;

            expect(isShelleyBech32 || isByron).toBe(true);
            expect(isHex).toBe(false);
          });
        });
      }
    }, 30000);

    it("should handle Byron addresses gracefully", async () => {
      const byronAddress = "Ae2tdPwUPEZCanmBz5g2GEwFqKTKpNJcGYPKfDxoNeKZ8bRHr8366kseiK2";

      const result = await listOperations(currency, byronAddress, {
        minHeight: 0,
        order: "desc",
        limit: 10,
      });

      expect(result.items).toHaveLength(0);
      expect(result.next).toBeUndefined();
    }, 30000);
  });

  describe("Edge cases and error handling", () => {
    it("should handle pristine address query correctly", async () => {
      const result = await listOperations(currency, PRISTINE_ADDRESS, {
        minHeight: 0,
        order: "desc",
        limit: 10,
      });

      expect(result.items).toBeInstanceOf(Array);
      expect(result).toHaveProperty("next");
    }, 30000);

    it("should handle invalid address gracefully", async () => {
      const invalidAddress = "invalid_cardano_address";

      const result = await listOperations(currency, invalidAddress, {
        minHeight: 0,
        order: "desc",
        limit: 10,
      });

      expect(result.items).toHaveLength(0);
      expect(result.next).toBeUndefined();
    }, 30000);

    it("should handle malformed/empty address strings", async () => {
      const testCases = [
        "",
        "   ",
        "0x123",
        "not_a_cardano_address",
        null as any,
        undefined as any,
      ];

      for (const invalidAddr of testCases) {
        const result = await listOperations(currency, invalidAddr, {
          minHeight: 0,
          order: "desc",
          limit: 10,
        });

        expect(result.items).toHaveLength(0);
        expect(result.next).toBeUndefined();
      }
    }, 30000);

    it("should ignore options.limit (API uses fixed page size)", async () => {
      const result1 = await listOperations(currency, TESTING_ADDRESS, {
        minHeight: 0,
        order: "desc",
        limit: 50,
      });

      const result2 = await listOperations(currency, TESTING_ADDRESS, {
        minHeight: 0,
        order: "desc",
        limit: 5,
      });

      if (result1.items.length > 0 && result2.items.length > 0) {
        expect(result1.items.length).toBe(result2.items.length);
      }
    }, 30000);

    it("should return undefined cursor when all transactions are filtered by minHeight", async () => {
      const result = await listOperations(currency, TESTING_ADDRESS, {
        minHeight: 999999999,
        order: "desc",
        limit: 10,
      });

      expect(result.items).toHaveLength(0);
      expect(result.next).toBeUndefined();
    }, 30000);

    it("should verify multi-token operations have unique asset references", () => {
      const result = descFirstPage;

      const tokenOps = result.items.filter(op => op.asset.type === "token");

      if (tokenOps.length > 1) {
        const opsByTx = new Map<string, typeof tokenOps>();
        tokenOps.forEach(op => {
          const txHash = op.tx.hash;
          if (!opsByTx.has(txHash)) {
            opsByTx.set(txHash, []);
          }
          opsByTx.get(txHash)!.push(op);
        });

        for (const [txHash, ops] of opsByTx) {
          if (ops.length > 1) {
            const assetRefs = new Set(ops.map(op => (op.asset as any).assetReference));
            expect(assetRefs.size).toBe(ops.length);

            ops.forEach(op => {
              expect(op.tx.hash).toBe(txHash);
            });
          }
        }
      }
    }, 30000);

    it("should handle very old transactions (edge case block heights)", async () => {
      const result = await listOperations(currency, TESTING_ADDRESS, {
        minHeight: 1,
        order: "desc",
        limit: 10,
      });

      expect(result.items).toBeInstanceOf(Array);
      result.items.forEach(op => {
        expect(op.tx.block.height).toBeGreaterThanOrEqual(1);
      });
    }, 30000);

    it("should maintain operation order across pagination", async () => {
      const allOps: Operation[] = [];
      let cursor: string | undefined;
      const maxPages = 5;
      let pageCount = 0;

      while (pageCount < maxPages) {
        const result = await listOperations(currency, TESTING_ADDRESS, {
          minHeight: 0,
          order: "desc",
          limit: 10,
          ...(cursor ? { cursor } : {}),
        });

        allOps.push(...result.items);
        pageCount++;

        if (!result.next) break;
        cursor = result.next;
      }

      for (let i = 1; i < allOps.length; i++) {
        const prevDate = allOps[i - 1].tx.date.getTime();
        const currDate = allOps[i].tx.date.getTime();
        expect(currDate).toBeLessThanOrEqual(prevDate);
      }
    }, 90000);

    it("should handle cursor edge cases", async () => {
      const invalidCursors = ["abc", "-1", "0", "999999999999", "", "  ", "NaN"];

      for (const invalidCursor of invalidCursors) {
        const result = await listOperations(currency, TESTING_ADDRESS, {
          minHeight: 0,
          order: "desc",
          limit: 10,
          cursor: invalidCursor,
        });

        expect(result.items).toBeInstanceOf(Array);
        expect(result).toHaveProperty("next");
      }
    }, 30000);

    it("should verify all operations have unique IDs", () => {
      const result = descFirstPage;

      if (result.items.length > 0) {
        const ids = new Set(result.items.map(op => op.id));
        expect(ids.size).toBe(result.items.length);
      }
    }, 30000);

    it("should handle zero-value operations correctly", () => {
      const result = descFirstPage;

      result.items.forEach(op => {
        expect(op.value).toBeGreaterThanOrEqual(0n);
      });
    }, 30000);

    it("should validate operation dates are chronologically valid", () => {
      const result = descFirstPage;

      result.items.forEach(op => {
        const date = op.tx.date;
        const blockTime = op.tx.block.time;

        expect(date).toBeInstanceOf(Date);
        expect(blockTime).toBeInstanceOf(Date);
        expect(isNaN(date.getTime())).toBe(false);
        expect(isNaN(blockTime.getTime())).toBe(false);

        // 1 hour tolerance for clock drift
        const now = Date.now() + 3600000;
        expect(date.getTime()).toBeLessThan(now);
        expect(blockTime.getTime()).toBeLessThan(now);
      });
    }, 30000);

    it("should handle UNDELEGATE operations", () => {
      const result = descFirstPage;

      const undelegateOps = result.items.filter(op => op.type === "UNDELEGATE");

      if (undelegateOps.length > 0) {
        undelegateOps.forEach(op => {
          expect(op.type).toBe("UNDELEGATE");
          expect(op.senders.length).toBeGreaterThan(0);
          expect(op.recipients.length).toBeGreaterThan(0);
        });
      }
    }, 30000);
  });
});
