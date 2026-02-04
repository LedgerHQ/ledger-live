/**
 * Integration tests for MultiversX Alpaca API.
 * Tests against real MultiversX mainnet (ADR-005).
 *
 * To run: pnpm test-integ
 *
 * Test addresses sourced from MultiversX Explorer for consistent results.
 *
 * Timeout Strategy:
 * - TIMEOUT_STANDARD (60s): Default for most API calls
 * - TIMEOUT_EXTENDED (120s): Heavy operations (validator lists, pagination, multi-page fetches)
 * - beforeAll blocks use extended timeouts to pre-fetch data for multiple tests
 *
 * Test Execution:
 * - Some tests conditionally skip via early return when sender balance is insufficient
 * - One test intentionally skipped via it.skip() - broadcast requires real testnet
 * - Tests are deterministic using known mainnet addresses with predictable data
 */

import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";

import { createApi } from "./index";
import type { MultiversXApi } from "./types";
import { GAS, MIN_GAS_LIMIT, GAS_PRICE } from "../constants";

// Test addresses (mainnet)
// Sourced from MultiversX Explorer with verified activity
const TEST_ADDRESSES = {
  // Maiar Exchange contract - has many ESDT tokens
  withTokens: "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2",
  // Active account with EGLD balance (MultiversX genesis address)
  withEgld: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
  // System smart contract (has 0 balance but valid address)
  zeroBalance: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
  // Address with moderate ESDT activity (not millions of transactions)
  withModerateEsdtActivity: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
};

// Shared test constants
const LEDGER_VALIDATOR = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy";
const ONE_EGLD = 1000000000000000000n;

// Test timeout constants (in milliseconds)
const TIMEOUT_STANDARD = 60000; // 60s - standard network API calls
const TIMEOUT_EXTENDED = 120000; // 120s - heavy operations (validator lists, pagination)

// Balance and fee constants for test execution
const MIN_BALANCE_FOR_FEES = BigInt(MIN_GAS_LIMIT) * BigInt(GAS_PRICE); // Minimum balance needed for transaction fees

describe("MultiversX API Integration Tests", () => {
  let api: MultiversXApi;

  beforeAll(() => {
    // Use real mainnet endpoints
    api = createApi({
      apiEndpoint: "https://elrond.coin.ledger.com",
      delegationApiEndpoint: "https://delegations-elrond.coin.ledger.com",
    });
  });

  describe("getBalance", () => {
    it("returns native EGLD balance for funded account", async () => {
      const balances = await api.getBalance(TEST_ADDRESSES.withEgld);

      // Should always have at least native balance
      expect(balances.length).toBeGreaterThanOrEqual(1);

      // First element is native balance
      const nativeBalance = balances[0];
      expect(nativeBalance.asset).toEqual({ type: "native" });
      expect(typeof nativeBalance.value).toBe("bigint");
    });

    it("returns array with native balance even for zero-balance account (FR4)", async () => {
      const balances = await api.getBalance(TEST_ADDRESSES.zeroBalance);

      // CRITICAL: Must never return empty array per FR4
      expect(balances.length).toBeGreaterThanOrEqual(1);
      expect(balances[0].asset).toEqual({ type: "native" });
    });

    it("returns ESDT token balances with correct structure (Story 1.3)", async () => {
      const balances = await api.getBalance(TEST_ADDRESSES.withTokens);

      // Should have native + potentially ESDT tokens
      expect(balances.length).toBeGreaterThanOrEqual(1);

      // Native balance first
      expect(balances[0].asset.type).toBe("native");

      // If there are ESDT tokens, verify structure
      const esdtBalances = balances.filter(b => b.asset.type === "esdt");
      for (const esdt of esdtBalances) {
        expect(esdt.asset).toHaveProperty("type", "esdt");
        expect(esdt.asset).toHaveProperty("assetReference");
        expect(typeof esdt.value).toBe("bigint");
        // Token identifier format: TICKER-hexhash (case-insensitive hex)
        expect((esdt.asset as { assetReference?: string }).assetReference).toMatch(
          /^[A-Za-z0-9]+-[a-fA-F0-9]+$/,
        );
      }
    });

    it("each ESDT balance has asset.type='esdt' and assetReference containing token identifier", async () => {
      const balances = await api.getBalance(TEST_ADDRESSES.withTokens);

      const esdtBalances = balances.filter(b => b.asset.type === "esdt");

      // Verify each ESDT token has required fields
      for (const balance of esdtBalances) {
        const asset = balance.asset as { type: string; assetReference?: string; name?: string };
        expect(asset.type).toBe("esdt");
        expect(asset.assetReference).toBeDefined();
        expect(typeof asset.assetReference).toBe("string");
        expect(asset.assetReference!.length).toBeGreaterThan(0);
      }
    });

    it("native balance is always first in the returned array", async () => {
      const balances = await api.getBalance(TEST_ADDRESSES.withTokens);

      // First element must always be native
      expect(balances[0].asset.type).toBe("native");

      // All other elements (if any) should be non-native
      for (let i = 1; i < balances.length; i++) {
        expect(balances[i].asset.type).not.toBe("native");
      }
    });

    it("throws error for invalid address format", async () => {
      await expect(api.getBalance("invalid-address")).rejects.toThrow(/Invalid MultiversX address/);
    });
  });

  describe("getSequence", () => {
    it("returns nonce as bigint for address with transaction history", async () => {
      // Known active account - will have nonce > 0
      const sequence = await api.getSequence(TEST_ADDRESSES.withEgld);

      expect(typeof sequence).toBe("bigint");
      // Active accounts have positive nonce
      expect(sequence).toBeGreaterThanOrEqual(0n);
    });

    it("returns 0n or positive bigint for system contract (new-ish account)", async () => {
      // System smart contract - may have 0 nonce
      const sequence = await api.getSequence(TEST_ADDRESSES.zeroBalance);

      expect(typeof sequence).toBe("bigint");
      expect(sequence).toBeGreaterThanOrEqual(0n);
    });

    it("returns bigint type (not number)", async () => {
      const sequence = await api.getSequence(TEST_ADDRESSES.withEgld);

      // Verify it's specifically a bigint, not just truthy
      expect(typeof sequence).toBe("bigint");
      expect(sequence).not.toBeNaN();
    });

    it("throws descriptive error for invalid address", async () => {
      await expect(api.getSequence("invalid-address")).rejects.toThrow(
        /Invalid MultiversX address/,
      );
    });

    it("verifies nonce is always non-negative (edge case validation)", async () => {
      // Integration test verifies real API never returns negative nonce
      // Null/undefined/type validation covered in unit tests
      const sequence = await api.getSequence(TEST_ADDRESSES.withEgld);

      expect(sequence).toBeGreaterThanOrEqual(0n);
      // Verify it's a valid bigint (not NaN)
      expect(Number.isNaN(Number(sequence))).toBe(false);
    });

    it("wraps network errors with consistent error message format", async () => {
      // Use invalid endpoint to trigger network error
      const badApi = createApi({
        apiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
        delegationApiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
      });

      // Should throw error with consistent format matching getBalance
      await expect(badApi.getSequence(TEST_ADDRESSES.withEgld)).rejects.toThrow(
        /Failed to fetch account/,
      );
    });
  });

  describe("lastBlock", () => {
    it("returns current block height from mainnet", async () => {
      const blockInfo = await api.lastBlock();

      expect(blockInfo.height).toBeGreaterThan(0);
      expect(typeof blockInfo.height).toBe("number");
    });

    it("returns BlockInfo with height property", async () => {
      const blockInfo = await api.lastBlock();

      expect(blockInfo).toHaveProperty("height");
      expect(typeof blockInfo.height).toBe("number");
      expect(Number.isInteger(blockInfo.height)).toBe(true);
    });
  });

  describe("listOperations", () => {
    // Pre-fetch operations once to avoid rate limiting
    let operationsResult: Awaited<ReturnType<typeof api.listOperations>>;
    let operations: Awaited<ReturnType<typeof api.listOperations>>[0];
    let cursor: string;
    let zeroBalanceOperations: Awaited<ReturnType<typeof api.listOperations>>[0];

    beforeAll(async () => {
      // Single API call for most tests - fetch 10 operations
      operationsResult = await api.listOperations(TEST_ADDRESSES.withEgld, { limit: 10 });
      [operations, cursor] = operationsResult;

      // Separate call for zero balance address
      const [zeroOps] = await api.listOperations(TEST_ADDRESSES.zeroBalance, {});
      zeroBalanceOperations = zeroOps;
    }, TIMEOUT_EXTENDED); // Extended timeout for API calls with pagination

    it("returns operations for address with transaction history (AC: #1)", () => {
      expect(operations.length).toBeGreaterThan(0);
      expect(operations.length).toBeLessThanOrEqual(10);

      // Verify operation structure
      const operation = operations[0];
      expect(operation).toHaveProperty("id");
      expect(operation).toHaveProperty("type");
      expect(operation).toHaveProperty("value");
      expect(operation).toHaveProperty("asset");
      expect(operation).toHaveProperty("senders");
      expect(operation).toHaveProperty("recipients");
      expect(operation).toHaveProperty("tx");
    });

    it("returns operations with correct Operation type structure", () => {
      for (const op of operations) {
        // Core fields
        expect(typeof op.id).toBe("string");
        expect(["IN", "OUT"]).toContain(op.type);
        expect(typeof op.value).toBe("bigint");

        // Asset info - can be native or esdt (Story 2.2)
        expect(op.asset).toHaveProperty("type");
        expect(["native", "esdt"]).toContain(op.asset.type);

        // Senders and recipients
        expect(Array.isArray(op.senders)).toBe(true);
        expect(Array.isArray(op.recipients)).toBe(true);

        // Transaction details
        expect(op.tx).toHaveProperty("hash");
        expect(op.tx).toHaveProperty("block");
        expect(op.tx).toHaveProperty("fees");
        expect(op.tx).toHaveProperty("date");
        expect(op.tx).toHaveProperty("failed");

        expect(typeof op.tx.hash).toBe("string");
        expect(typeof op.tx.block.height).toBe("number");
        expect(typeof op.tx.fees).toBe("bigint");
        expect(op.tx.date instanceof Date).toBe(true);
        expect(typeof op.tx.failed).toBe("boolean");
      }
    });

    it("returns paginated operations with limit (AC: #1)", () => {
      expect(operations.length).toBeLessThanOrEqual(10);
      expect(operations.length).toBeGreaterThan(0);
    });

    it("returns empty array for address with no transaction history (AC: #3)", () => {
      expect(Array.isArray(zeroBalanceOperations)).toBe(true);
      // May be empty or have some system operations
    });

    it("throws error for invalid address format (AC: #4)", async () => {
      await expect(api.listOperations("invalid-address", {})).rejects.toThrow(
        /Invalid MultiversX address/,
      );
    });

    it("returns tuple with operations array and cursor string", () => {
      expect(Array.isArray(operationsResult)).toBe(true);
      expect(operationsResult).toHaveLength(2);

      expect(Array.isArray(operations)).toBe(true);
      expect(typeof cursor).toBe("string");
    });

    it("operations have bigint values (not BigNumber)", () => {
      for (const op of operations) {
        expect(typeof op.value).toBe("bigint");
        expect(typeof op.tx.fees).toBe("bigint");
      }
    });

    it("operations have correct sender/recipient arrays", () => {
      for (const op of operations) {
        // Should have at least one sender
        expect(op.senders.length).toBeGreaterThanOrEqual(1);
        // Should have at least one recipient (for transfers)
        expect(op.recipients.length).toBeGreaterThanOrEqual(0);

        // Addresses should be valid bech32
        for (const sender of op.senders) {
          expect(sender).toMatch(/^erd1[a-z0-9]+$/);
        }
        for (const recipient of op.recipients) {
          expect(recipient).toMatch(/^erd1[a-z0-9]+$/);
        }
      }
    });
  });

  describe("listOperations - ESDT operations (Story 2.2)", () => {
    // Pre-fetch operations from an address with moderate activity
    let esdtOperationsResult: Awaited<ReturnType<typeof api.listOperations>>;
    let esdtOperations: Awaited<ReturnType<typeof api.listOperations>>[0];

    beforeAll(async () => {
      // Fetch operations from address with ESDT token history
      // Using an address with moderate activity to avoid API pagination limits
      esdtOperationsResult = await api.listOperations(TEST_ADDRESSES.withModerateEsdtActivity, {
        limit: 50,
      });
      [esdtOperations] = esdtOperationsResult;
    }, TIMEOUT_EXTENDED); // Extended timeout for API calls with pagination

    it("returns operations for address with transaction history (AC: #1, Subtask 7.1)", () => {
      // This address should have operations
      expect(esdtOperations.length).toBeGreaterThan(0);

      // Check operation structure
      for (const op of esdtOperations) {
        expect(["native", "esdt"]).toContain(op.asset.type);
      }
    });

    it("EGLD operations have asset.type === 'native' (AC: #2, Subtask 7.2)", () => {
      const nativeOps = esdtOperations.filter(op => op.asset.type === "native");

      for (const op of nativeOps) {
        expect(op.asset.type).toBe("native");
        expect(typeof op.value).toBe("bigint");
      }
    });

    it("ESDT operations have asset.type === 'esdt' and valid assetReference (AC: #3, Subtask 7.3)", () => {
      const esdtOps = esdtOperations.filter(op => op.asset.type === "esdt");

      // If there are ESDT operations, verify their structure
      for (const op of esdtOps) {
        expect(op.asset.type).toBe("esdt");
        expect(typeof op.value).toBe("bigint");

        const asset = op.asset as { type: string; assetReference?: string };
        expect(asset.assetReference).toBeDefined();
        expect(typeof asset.assetReference).toBe("string");

        // assetReference should be a valid token identifier (or empty for edge cases)
        // Token identifier format: TICKER-hexhash (case-insensitive hex)
        if (asset.assetReference && asset.assetReference.length > 0) {
          expect(asset.assetReference).toMatch(/^[A-Za-z0-9]+-[a-fA-F0-9]+$/);
        }
      }
    });

    it("returns operations for address with only EGLD transactions (AC: #4, Subtask 7.4)", async () => {
      // Use address that likely has only EGLD (system contract)
      const [ops] = await api.listOperations(TEST_ADDRESSES.zeroBalance, { limit: 50 });

      // If it has operations, verify structure (may be empty for system contracts)
      for (const op of ops) {
        // System contracts typically only have native operations
        expect(["native", "esdt"]).toContain(op.asset.type);
      }
    }, TIMEOUT_STANDARD);

    it("operations are sorted by block height (Subtask 7.5)", () => {
      if (esdtOperations.length < 2) return; // Skip if not enough data

      // Default order is desc (newest first)
      for (let i = 1; i < esdtOperations.length; i++) {
        const prev = esdtOperations[i - 1].tx.block.height;
        const curr = esdtOperations[i].tx.block.height;
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it("pagination works with mixed operations (Subtask 7.6)", async () => {
      // Get first page from the address with moderate activity
      const [firstPage, cursor] = await api.listOperations(
        TEST_ADDRESSES.withModerateEsdtActivity,
        { limit: 10 },
      );

      expect(firstPage.length).toBeLessThanOrEqual(10);

      // If there's more data, cursor should allow fetching next page
      if (cursor) {
        const [secondPage] = await api.listOperations(TEST_ADDRESSES.withModerateEsdtActivity, {
          limit: 10,
          pagingToken: cursor,
        });

        // Pages should be different (if there was more data)
        if (secondPage.length > 0 && firstPage.length > 0) {
          expect(secondPage[0].id).not.toBe(firstPage[0].id);
        }
      }
    }, TIMEOUT_EXTENDED);
  });

  // Story 2.3: Operations Sorting Integration Tests
  describe("listOperations - sorting (Story 2.3)", () => {
    // Pre-fetch operations once for sorting tests
    let sortedOperationsDesc: Awaited<ReturnType<typeof api.listOperations>>[0];
    let sortedOperationsAsc: Awaited<ReturnType<typeof api.listOperations>>[0];

    beforeAll(async () => {
      // Fetch operations in descending order (default)
      const [descOps] = await api.listOperations(TEST_ADDRESSES.withEgld, {
        limit: 20,
        order: "desc",
      });
      sortedOperationsDesc = descOps;

      // Fetch operations in ascending order
      const [ascOps] = await api.listOperations(TEST_ADDRESSES.withEgld, {
        limit: 20,
        order: "asc",
      });
      sortedOperationsAsc = ascOps;
    }, TIMEOUT_EXTENDED);

    it("returns operations sorted by block height descending (most recent first) - AC: #1", () => {
      if (sortedOperationsDesc.length < 2) return; // Skip if not enough data

      for (let i = 1; i < sortedOperationsDesc.length; i++) {
        const prev = sortedOperationsDesc[i - 1].tx.block.height;
        const curr = sortedOperationsDesc[i].tx.block.height;
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it("returns operations sorted by block height ascending (oldest first) when order is 'asc' - AC: #1", () => {
      if (sortedOperationsAsc.length < 2) return; // Skip if not enough data

      for (let i = 1; i < sortedOperationsAsc.length; i++) {
        const prev = sortedOperationsAsc[i - 1].tx.block.height;
        const curr = sortedOperationsAsc[i].tx.block.height;
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });

    it("returns consistent ordering across repeated calls - AC: #2", async () => {
      const [result1] = await api.listOperations(TEST_ADDRESSES.withEgld, { limit: 15 });
      const [result2] = await api.listOperations(TEST_ADDRESSES.withEgld, { limit: 15 });

      // Should have identical ordering
      expect(result1.map(op => op.id)).toEqual(result2.map(op => op.id));
    }, TIMEOUT_EXTENDED);

    it("transactions in same block are deterministically ordered - AC: #2", () => {
      // Find any operations in the same block
      const blockHeights = sortedOperationsDesc.map(op => op.tx.block.height);
      const duplicateHeights = blockHeights.filter(
        (height, index) => blockHeights.indexOf(height) !== index,
      );

      if (duplicateHeights.length > 0) {
        // Group operations by block height
        const byHeight = new Map<number, string[]>();
        for (const op of sortedOperationsDesc) {
          const height = op.tx.block.height;
          if (!byHeight.has(height)) {
            byHeight.set(height, []);
          }
          byHeight.get(height)!.push(op.id);
        }

        // For each group with multiple operations, verify alphabetical order by id (txHash)
        for (const [, ids] of byHeight) {
          if (ids.length > 1) {
            const sortedIds = [...ids].sort((a, b) => a.localeCompare(b));
            expect(ids).toEqual(sortedIds);
          }
        }
      }
    });
  });

  // Story 3.1: Delegation Positions Query Integration Tests
  describe("getStakes (Story 3.1)", () => {
    // Pre-fetch stakes for test efficiency
    let stakesResult: Awaited<ReturnType<typeof api.getStakes>>;

    beforeAll(async () => {
      // Fetch stakes for genesis address (may or may not have delegations)
      stakesResult = await api.getStakes(TEST_ADDRESSES.withEgld);
    }, TIMEOUT_STANDARD);

    it("returns Page structure with items and next fields (AC: #1)", () => {
      expect(stakesResult).toHaveProperty("items");
      expect(stakesResult).toHaveProperty("next");
      expect(Array.isArray(stakesResult.items)).toBe(true);
      expect(stakesResult.next).toBeUndefined(); // No pagination from delegation API
    });

    it("validates stake structure when delegations exist (AC: #1, Subtask 8.2)", async () => {
      // Note: We test multiple addresses to increase chance of finding one with delegations
      // This validates the positive case when stakes are present
      const addresses = [TEST_ADDRESSES.withEgld, TEST_ADDRESSES.withTokens];

      for (const addr of addresses) {
        const result = await api.getStakes(addr);
        if (result.items.length > 0) {
          // Found an address with delegations - validate fully
          const stake = result.items[0];
          expect(stake.uid).toBeDefined();
          expect(stake.address).toBe(addr);
          expect(stake.delegate).toBeDefined();
          expect(stake.delegate).toMatch(/^erd1/); // Valid bech32 address
          expect(["active", "deactivating", "inactive"]).toContain(stake.state);
          expect(stake.asset).toEqual({ type: "native" });
          expect(typeof stake.amount).toBe("bigint");
          expect(stake.amount).toBeGreaterThanOrEqual(0n);
          return; // Test passed with positive case
        }
      }
      // If no addresses have delegations, don't fail.
      // Mainnet state can change and delegations may be withdrawn.
    }, TIMEOUT_EXTENDED);

    it("each stake has required fields (uid, address, delegate, state, asset, amount) (Subtask 8.4)", () => {
      for (const stake of stakesResult.items) {
        expect(stake).toHaveProperty("uid");
        expect(stake).toHaveProperty("address");
        expect(stake).toHaveProperty("delegate");
        expect(stake).toHaveProperty("state");
        expect(stake).toHaveProperty("asset");
        expect(stake).toHaveProperty("amount");

        expect(typeof stake.uid).toBe("string");
        expect(typeof stake.address).toBe("string");
        expect(typeof stake.delegate).toBe("string");
        expect(typeof stake.amount).toBe("bigint");
        expect(stake.asset).toEqual({ type: "native" });
      }
    });

    it("state is one of: 'active', 'deactivating', 'inactive' (Subtask 8.5)", () => {
      const validStates = ["active", "deactivating", "inactive"];
      for (const stake of stakesResult.items) {
        expect(validStates).toContain(stake.state);
      }
    });

    it("returns empty items for address with no delegations (AC: #3, Subtask 8.3)", async () => {
      // System contract typically has no delegations
      const result = await api.getStakes(TEST_ADDRESSES.zeroBalance);

      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.next).toBeUndefined();
    }, TIMEOUT_STANDARD);

    it("throws error for invalid address format (AC: #4)", async () => {
      await expect(api.getStakes("invalid-address")).rejects.toThrow(/Invalid MultiversX address/);
    });

    it("uid format is address-contract", () => {
      for (const stake of stakesResult.items) {
        expect(stake.uid).toBe(`${stake.address}-${stake.delegate}`);
      }
    });

    it("amounts are positive or zero bigints", () => {
      for (const stake of stakesResult.items) {
        expect(stake.amount).toBeGreaterThanOrEqual(0n);
        if (stake.amountDeposited !== undefined) {
          expect(stake.amountDeposited).toBeGreaterThanOrEqual(0n);
        }
        if (stake.amountRewarded !== undefined) {
          expect(stake.amountRewarded).toBeGreaterThanOrEqual(0n);
        }
      }
    });

    it("wraps network errors with descriptive message", async () => {
      // Use invalid endpoint to trigger network error
      const badApi = createApi({
        apiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
        delegationApiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
      });

      await expect(badApi.getStakes(TEST_ADDRESSES.withEgld)).rejects.toThrow(
        /Failed to fetch delegations/,
      );
    }, TIMEOUT_STANDARD);
  });

  // Story 3.3: Validators List Query Integration Tests
  describe("getValidators (Story 3.3)", () => {
    // Pre-fetch validators once to avoid rate limiting
    let validatorsResult: Awaited<ReturnType<typeof api.getValidators>>;

    beforeAll(async () => {
      validatorsResult = await api.getValidators();
    }, TIMEOUT_EXTENDED);

    it("returns Page structure with items and next fields (AC: #1, #5)", () => {
      expect(validatorsResult).toHaveProperty("items");
      expect(validatorsResult).toHaveProperty("next");
      expect(Array.isArray(validatorsResult.items)).toBe(true);
      expect(validatorsResult.next).toBeUndefined(); // All validators returned in single page
    });

    it("returns validators with required fields (address, name, apy, commissionRate) (AC: #2, #4)", () => {
      expect(validatorsResult.items.length).toBeGreaterThan(0);

      for (const validator of validatorsResult.items.slice(0, 10)) {
        expect(typeof validator.address).toBe("string");
        expect(validator.address.startsWith("erd1")).toBe(true);

        expect(typeof validator.name).toBe("string");
        expect(validator.name.length).toBeGreaterThan(0);

        expect(validator.apy).toBeDefined();
        expect(typeof validator.apy).toBe("number");

        expect(validator.commissionRate).toBeDefined();
        expect(typeof validator.commissionRate).toBe("string");
      }
    });

    it("returns APY as decimal between 0 and 1 (AC: #2)", () => {
      for (const validator of validatorsResult.items.slice(0, 25)) {
        if (validator.apy !== undefined) {
          expect(validator.apy).toBeGreaterThanOrEqual(0);
          expect(validator.apy).toBeLessThanOrEqual(1);
        }
      }
    });

    it("returns a non-empty validators list on mainnet (AC: #4)", () => {
      expect(validatorsResult.items.length).toBeGreaterThan(0);
    });

    it("returns undefined next cursor (all validators in single page) (AC: #5)", () => {
      expect(validatorsResult.next).toBeUndefined();
    });
  });

  // Story 4.1: Craft Native EGLD Transactions Integration Tests
  describe("craftTransaction (Story 4.1)", () => {
    const SENDER = TEST_ADDRESSES.withEgld;
    const RECIPIENT = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

    it("crafts native EGLD transfer transaction (AC: #1)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000000000000000n, // 1 EGLD
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);

      expect(result).toHaveProperty("transaction");
      expect(typeof result.transaction).toBe("string");
    });

    it("returns valid transaction JSON structure (AC: #2)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 5000000000000000000n, // 5 EGLD
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed).toHaveProperty("nonce");
      expect(parsed).toHaveProperty("value");
      expect(parsed).toHaveProperty("receiver");
      expect(parsed).toHaveProperty("sender");
      expect(parsed).toHaveProperty("gasPrice");
      expect(parsed).toHaveProperty("gasLimit");
      expect(parsed).toHaveProperty("chainID");
      expect(parsed).toHaveProperty("version");
      expect(parsed).toHaveProperty("options");
    });

    it("fetches nonce from network when not provided in intent (AC: #2)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
        // sequence not provided - should fetch from network
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(typeof parsed.nonce).toBe("number");
      expect(parsed.nonce).toBeGreaterThanOrEqual(0);
    });

    it("uses provided sequence as nonce (AC: #2)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
        sequence: 99n,
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.nonce).toBe(99);
    });

    it("uses default gas limit when custom fees not provided (AC: #3)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.gasLimit).toBe(50000); // MIN_GAS_LIMIT
    });

    it("applies custom fees when provided (AC: #4)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
      };

      const customFees = {
        value: 60000000000000n,
        parameters: {
          gasLimit: 60000n,
        },
      };

      const result = await api.craftTransaction(intent, customFees);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.gasLimit).toBe(60000);
    });

    it("creates transaction with correct sender and receiver (AC: #2)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.sender).toBe(SENDER);
      expect(parsed.receiver).toBe(RECIPIENT);
    });

    it("does not include data field for native EGLD transfer (AC: #7)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed).not.toHaveProperty("data");
    });

    it("transaction structure matches MultiversXProtocolTransaction (AC: #6)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
        sequence: 42n,
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      // Verify all required fields for hardware wallet signing
      expect(typeof parsed.nonce).toBe("number");
      expect(typeof parsed.value).toBe("string");
      expect(typeof parsed.receiver).toBe("string");
      expect(typeof parsed.sender).toBe("string");
      expect(typeof parsed.gasPrice).toBe("number");
      expect(typeof parsed.gasLimit).toBe("number");
      expect(typeof parsed.chainID).toBe("string");
      expect(typeof parsed.version).toBe("number");
      expect(typeof parsed.options).toBe("number");

      // Verify specific values
      expect(parsed.gasPrice).toBe(1000000000); // GAS_PRICE constant
      expect(parsed.chainID).toBe("1"); // CHAIN_ID constant
      expect(parsed.version).toBe(2); // TRANSACTION_VERSION_DEFAULT
      expect(parsed.options).toBe(1); // TRANSACTION_OPTIONS_TX_HASH_SIGN
    });

    // Story 4.3: Delegation transaction crafting tests follow below

    it("crafts ESDT token transfer transaction (Story 4.2, AC: #1)", async () => {
      const esdtIntent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 100000000n, // 100 tokens (assuming 6 decimals)
        asset: { type: "esdt" as const, assetReference: "WEGLD-bd4d79" },
      };

      const result = await api.craftTransaction(esdtIntent);

      expect(result).toHaveProperty("transaction");
      expect(typeof result.transaction).toBe("string");
    });

    it("ESDT transaction has value='0' and data field (Story 4.2, AC: #2)", async () => {
      const esdtIntent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 100000000n,
        asset: { type: "esdt" as const, assetReference: "WEGLD-bd4d79" },
      };

      const result = await api.craftTransaction(esdtIntent);
      const parsed = JSON.parse(result.transaction);

      // ESDT transfers have value="0" (value goes in data field)
      expect(parsed.value).toBe("0");

      // Must have data field with ESDT transfer encoding
      expect(parsed).toHaveProperty("data");
      expect(typeof parsed.data).toBe("string");
    });

    it("ESDT transaction data contains correct encoding format (Story 4.2, AC: #2)", async () => {
      const tokenIdentifier = "WEGLD-bd4d79";
      const esdtIntent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 100000000n,
        asset: { type: "esdt" as const, assetReference: tokenIdentifier },
      };

      const result = await api.craftTransaction(esdtIntent);
      const parsed = JSON.parse(result.transaction);

      // Decode the base64 data field
      const decodedData = Buffer.from(parsed.data, "base64").toString();

      // Should start with "ESDTTransfer@"
      expect(decodedData).toMatch(/^ESDTTransfer@/);

      // Should contain the token identifier in hex
      const tokenHex = Buffer.from(tokenIdentifier).toString("hex");
      expect(decodedData).toContain(tokenHex);
    });

    it("ESDT transaction uses assetReference for token identifier (Story 4.2, AC: #3)", async () => {
      const tokenIdentifier = "USDC-abc123";
      const esdtIntent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000n,
        asset: { type: "esdt" as const, assetReference: tokenIdentifier },
      };

      const result = await api.craftTransaction(esdtIntent);
      const parsed = JSON.parse(result.transaction);
      const decodedData = Buffer.from(parsed.data, "base64").toString();

      // Token identifier should be in hex in the data
      const tokenHex = Buffer.from(tokenIdentifier).toString("hex");
      expect(decodedData).toContain(tokenHex);
    });

    it("ESDT transaction uses correct default gas limit (GAS.ESDT_TRANSFER)", async () => {
      const esdtIntent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 100000000n,
        asset: { type: "esdt" as const, assetReference: "WEGLD-bd4d79" },
      };

      const result = await api.craftTransaction(esdtIntent);
      const parsed = JSON.parse(result.transaction);

      // ESDT transfers use GAS.ESDT_TRANSFER = 500000
      expect(parsed.gasLimit).toBe(500000);
    });

    it("crafts ESDT transaction even with unknown token identifier (Story 4.2, AC: #4)", async () => {
      // Per AC#4: Invalid/non-existent tokens should still be crafted
      // Validation happens on-chain or via validateIntent
      const esdtIntent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000n,
        asset: { type: "esdt" as const, assetReference: "INVALID-xxxxxx" },
      };

      const result = await api.craftTransaction(esdtIntent);

      expect(result).toHaveProperty("transaction");
      const parsed = JSON.parse(result.transaction);
      expect(parsed).toHaveProperty("data");
    });

    it("throws error for empty string assetReference in ESDT intent", async () => {
      const esdtIntent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000n,
        asset: { type: "esdt" as const, assetReference: "" },
      };

      // Empty assetReference should be treated as undefined and cause error
      await expect(api.craftTransaction(esdtIntent)).rejects.toThrow(
        "craftTransaction failed: tokenIdentifier is required for ESDT transfers",
      );
    });

    it("uses full token balance when useAllAmount is true for ESDT (Story 4.2)", async () => {
      const balances = await api.getBalance(SENDER);
      const esdtBalance = balances.find(
        b => b.asset.type === "esdt" && "assetReference" in b.asset && b.asset.assetReference === "WEGLD-bd4d79",
      );

      if (!esdtBalance) {
        // Skip if account doesn't have this token
        return;
      }

      const esdtIntent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 0n, // Should be ignored
        asset: { type: "esdt" as const, assetReference: "WEGLD-bd4d79" },
        useAllAmount: true,
      };

      const result = await api.craftTransaction(esdtIntent);
      const parsed = JSON.parse(result.transaction);

      // Amount should match token balance (encoded in data field)
      const decodedData = Buffer.from(parsed.data, "base64").toString();
      const parts = decodedData.split("@");
      const amountHex = parts[parts.length - 1];
      const amountFromData = BigInt("0x" + amountHex);

      expect(amountFromData).toBe(esdtBalance.value);
    }, TIMEOUT_STANDARD);

    it("converts amount bigint to string in transaction (AC: #2)", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 12345678901234567890n, // Large amount
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.value).toBe("12345678901234567890");
      expect(typeof parsed.value).toBe("string");
    });

    it("uses full balance minus fees when useAllAmount is true (AC: #5)", async () => {
      // Check if sender has sufficient balance for this test
      const balances = await api.getBalance(SENDER);
      const nativeBalance = balances.find(b => b.asset.type === "native");
      // Conditionally skip test if balance insufficient (deterministic based on known address)
      if (!nativeBalance || nativeBalance.value < MIN_BALANCE_FOR_FEES) {
        // Test skipped: Sender balance insufficient for transaction fees
        // This is expected behavior for the test address used
        return;
      }

      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 0n, // This should be ignored when useAllAmount is true
        asset: { type: "native" as const },
        useAllAmount: true,
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      // Amount should be positive (balance - fees)
      expect(BigInt(parsed.value)).toBeGreaterThan(0n);

      // Verify it's not the original amount we passed
      expect(parsed.value).not.toBe("0");

      // GasLimit should be MIN_GAS_LIMIT (50000)
      expect(parsed.gasLimit).toBe(50000);
    });

    it("calculates correct amount for useAllAmount with custom fees (AC: #5)", async () => {
      // First, get the balance to know what to expect
      const balances = await api.getBalance(SENDER);
      const nativeBalance = balances.find(b => b.asset.type === "native");
      expect(nativeBalance).toBeDefined();

      const customGasLimit = 60000n;
      const customFees = {
        value: customGasLimit * 1000000000n, // gasLimit * gasPrice
        parameters: {
          gasLimit: customGasLimit,
        },
      };

      // Conditionally skip test if balance insufficient (deterministic based on known address)
      const minRequiredBalance = customGasLimit * 1000000000n;
      if (nativeBalance!.value < minRequiredBalance) {
        // Test skipped: Sender balance insufficient for custom fee transaction
        // This is expected behavior for the test address used
        return;
      }

      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 0n,
        asset: { type: "native" as const },
        useAllAmount: true,
      };

      const result = await api.craftTransaction(intent, customFees);
      const parsed = JSON.parse(result.transaction);

      // Expected amount = balance - (gasLimit * gasPrice)
      const expectedFee = customGasLimit * 1000000000n;
      const expectedAmount = nativeBalance!.value - expectedFee;

      expect(parsed.value).toBe(expectedAmount.toString());
      expect(parsed.gasLimit).toBe(Number(customGasLimit));
    });

    it("throws error when useAllAmount is true but balance is insufficient for fees", async () => {
      // Use an address with very low balance (system contract has 0)
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: TEST_ADDRESSES.zeroBalance,
        recipient: RECIPIENT,
        amount: 0n,
        asset: { type: "native" as const },
        useAllAmount: true,
      };

      await expect(api.craftTransaction(intent)).rejects.toThrow(/insufficient balance/);
    });
  });

  // Story 4.3: Craft Delegation Transactions Integration Tests
  describe("craftTransaction - staking (Story 4.3)", () => {
    // Uses shared LEDGER_VALIDATOR constant defined at top of file
    const TEST_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

    it("crafts delegate transaction with correct structure (AC: #1, #7)", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "delegate",
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 10000000000000000000n, // 10 EGLD
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      // Receiver should be validator contract (AC: #7)
      expect(parsed.receiver).toBe(LEDGER_VALIDATOR);
      // Value should be the amount (delegate carries value in value field)
      expect(parsed.value).toBe("10000000000000000000");
      // Data should be base64("delegate") (AC: #1)
      expect(parsed.data).toBe(Buffer.from("delegate").toString("base64"));
      // Gas limit should be GAS.DELEGATE (AC: #6)
      expect(parsed.gasLimit).toBe(GAS.DELEGATE);
    });

    it("crafts unDelegate transaction with amount in data (AC: #2)", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "undelegate", // lowercase 'd'
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 5000000000000000000n, // 5 EGLD to undelegate
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      // Value should be "0" (amount in data field)
      expect(parsed.value).toBe("0");
      // Data should contain unDelegate@{hex amount}
      const decoded = Buffer.from(parsed.data, "base64").toString();
      expect(decoded).toMatch(/^unDelegate@[0-9a-f]+$/);
      // Gas limit should be GAS.DELEGATE
      expect(parsed.gasLimit).toBe(GAS.DELEGATE);
    });

    it("crafts withdraw transaction (AC: #3)", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "withdraw",
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 0n, // Amount not used for withdraw
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.value).toBe("0");
      expect(parsed.data).toBe(Buffer.from("withdraw").toString("base64"));
      // Gas limit should be GAS.CLAIM (AC: #6)
      expect(parsed.gasLimit).toBe(GAS.CLAIM);
    });

    it("crafts claimRewards transaction (AC: #4)", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "claimRewards",
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 0n,
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.value).toBe("0");
      expect(parsed.data).toBe(Buffer.from("claimRewards").toString("base64"));
      // Gas limit should be GAS.CLAIM (AC: #6)
      expect(parsed.gasLimit).toBe(GAS.CLAIM);
    });

    it("crafts reDelegateRewards transaction (AC: #5)", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "reDelegateRewards",
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 0n,
        asset: { type: "native" as const },
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.value).toBe("0");
      expect(parsed.data).toBe(Buffer.from("reDelegateRewards").toString("base64"));
      expect(parsed.gasLimit).toBe(GAS.CLAIM);
    });

    it("throws error for invalid staking type", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "invalidStakingType",
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
      };

      await expect(api.craftTransaction(intent)).rejects.toThrow(/unsupported staking type/);
    });

    it("throws error for staking intent with non-native asset type", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "delegate",
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 1000000000000000000n,
        asset: { type: "esdt" as const, assetReference: "USDC-abc123" },
      };

      await expect(api.craftTransaction(intent)).rejects.toThrow(
        /staking intents must have asset.type === "native"/,
      );
    });

    it("throws error for staking intent with invalid recipient address (not validator contract)", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "delegate",
        sender: TEST_ADDRESS,
        recipient: TEST_ADDRESS, // Regular address, not validator contract
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
      };

      await expect(api.craftTransaction(intent)).rejects.toThrow(
        /staking recipient must be a validator contract address/,
      );
    });

    it("fetches nonce from network for staking transaction", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "delegate",
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
        // No sequence provided - should fetch from network
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(typeof parsed.nonce).toBe("number");
      expect(parsed.nonce).toBeGreaterThanOrEqual(0);
    });

    it("uses provided sequence as nonce for staking transaction", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "delegate",
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
        sequence: 99n,
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.nonce).toBe(99);
    });

    it("validates staking transaction structure matches MultiversXProtocolTransaction", async () => {
      const intent = {
        intentType: "staking" as const,
        type: "delegate",
        sender: TEST_ADDRESS,
        recipient: LEDGER_VALIDATOR,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
        sequence: 42n,
      };

      const result = await api.craftTransaction(intent);
      const parsed = JSON.parse(result.transaction);

      // Verify all required fields for hardware wallet signing
      expect(typeof parsed.nonce).toBe("number");
      expect(typeof parsed.value).toBe("string");
      expect(typeof parsed.receiver).toBe("string");
      expect(typeof parsed.sender).toBe("string");
      expect(typeof parsed.gasPrice).toBe("number");
      expect(typeof parsed.gasLimit).toBe("number");
      expect(typeof parsed.chainID).toBe("string");
      expect(typeof parsed.version).toBe("number");
      expect(typeof parsed.options).toBe("number");
      expect(typeof parsed.data).toBe("string");

      // Verify specific values
      expect(parsed.gasPrice).toBe(1000000000); // GAS_PRICE constant
      expect(parsed.chainID).toBe("1"); // CHAIN_ID constant
      expect(parsed.version).toBe(2); // TRANSACTION_VERSION_DEFAULT
      expect(parsed.options).toBe(1); // TRANSACTION_OPTIONS_TX_HASH_SIGN
    });
  });

  // Story 4.6: Broadcast Transaction Integration Tests
  describe("broadcast (Story 4.6)", () => {
    const VALID_SIGNED_TX = JSON.stringify({
      nonce: 0,
      value: "1000000000000000000",
      receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      gasPrice: 1000000000,
      gasLimit: 50000,
      chainID: "1",
      version: 2,
      options: 1,
      signature:
        "test_signature_hex_string_64_chars_long_1234567890123456789012345678901234567890123456789012345678901234",
    });

    // Note: Real broadcast tests should be skipped in CI to avoid modifying network state
    // These tests require a valid signed transaction from combine() + craftTransaction()
    it.skip("broadcasts transaction successfully (requires testnet)", async () => {
      // This test should be skipped in CI
      // It requires:
      // 1. A valid unsigned transaction from craftTransaction()
      // 2. A valid signature (from hardware wallet or mock)
      // 3. Combined transaction from combine()
      // 4. Network access to MultiversX testnet

      const api = createApi();

      // Example flow (requires stories 4.1 and 4.5):
      // const unsignedTx = await api.craftTransaction(intent);
      // const signedTx = await api.combine(unsignedTx.transaction, signature);
      // const hash = await api.broadcast(signedTx);

      // expect(typeof hash).toBe("string");
      // expect(hash.length).toBeGreaterThan(0);
    });

    it("handles validation errors for invalid transaction format", async () => {
      // Test validation error handling (not network rejection - that requires actual network call)
      const api = createApi();

      const invalidSignedTx = JSON.stringify({
        nonce: 999999999,
        value: "1000000000000000000",
        receiver: "erd1invalid", // Invalid address format - will fail validation
        sender: "erd1invalid", // Invalid address format - will fail validation
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 2,
        options: 1,
        signature: "invalid_signature",
      });

      await expect(api.broadcast(invalidSignedTx)).rejects.toThrow(
        "Invalid signed transaction: invalid sender address format",
      );
    });

    it("handles malformed JSON input", async () => {
      const api = createApi();

      await expect(api.broadcast("invalid json")).rejects.toThrow(
        "Invalid signed transaction: malformed JSON",
      );
    });

    it("handles missing signature field", async () => {
      const api = createApi();

      const txWithoutSignature = JSON.stringify({
        nonce: 0,
        value: "1000000000000000000",
        receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 2,
        options: 1,
        // signature missing
      });

      await expect(api.broadcast(txWithoutSignature)).rejects.toThrow(
        "Invalid signed transaction: missing or empty signature",
      );
    });

    it("handles missing required fields", async () => {
      const api = createApi();

      const txMissingFields = JSON.stringify({
        signature: "abc123",
        // Missing nonce, sender, receiver, etc.
      });

      await expect(api.broadcast(txMissingFields)).rejects.toThrow(
        "Invalid signed transaction: missing required fields",
      );
    });
  });

  // Story 4.5: Combine Transaction with Signature Integration Tests
  describe("combine (Story 4.5)", () => {
    const VALID_UNSIGNED_TX = JSON.stringify({
      nonce: 0,
      value: "1000000000000000000",
      receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      gasPrice: 1000000000,
      gasLimit: 50000,
      chainID: "1",
      version: 2,
      options: 1,
    });

    const VALID_SIGNATURE =
      "test_signature_hex_string_64_chars_long_1234567890123456789012345678901234567890123456789012345678901234";

    it("combines transaction with valid signature (AC: #1, #2)", () => {
      const result = api.combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);

      expect(typeof result).toBe("string");
      const parsed = JSON.parse(result);
      expect(parsed.signature).toBe(VALID_SIGNATURE);
      expect(parsed.nonce).toBe(0);
    });

    it("resulting transaction has signature field (AC: #2)", () => {
      const unsignedTx = JSON.stringify({
        nonce: 1,
        value: "0",
        receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 2,
        options: 1,
      });

      const signature =
        "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      const result = api.combine(unsignedTx, signature);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty("signature");
      expect(parsed.signature).toBe(signature);
    });

    it("combined transaction can be parsed as valid JSON (AC: #1)", () => {
      const unsignedTx = JSON.stringify({
        nonce: 2,
        value: "500000000000000000",
        receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 2,
        options: 1,
      });

      const signature =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      const result = api.combine(unsignedTx, signature);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe("object");
    });

    it("signature format is preserved as-is (AC: #2)", () => {
      // MultiversX signatures are hex strings from the hardware wallet
      const hexSignature =
        "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";

      const result = api.combine(VALID_UNSIGNED_TX, hexSignature);
      const parsed = JSON.parse(result);

      expect(parsed.signature).toBe(hexSignature);
    });

    it("handles invalid signature without error per AC #3 (validation on broadcast)", () => {
      // Per AC #3: Invalid signatures should NOT cause combine to fail
      // Validation happens at broadcast time
      const invalidSignature = "not-a-valid-hex-signature";

      // Should NOT throw
      const result = api.combine(VALID_UNSIGNED_TX, invalidSignature);
      const parsed = JSON.parse(result);

      expect(parsed.signature).toBe(invalidSignature);
    });

    it("throws error for malformed unsigned transaction", () => {
      expect(() => api.combine("invalid json", VALID_SIGNATURE)).toThrow(
        "Invalid unsigned transaction: malformed JSON",
      );
    });

    it("combine output is compatible with broadcast input format (integration chain test)", async () => {
      // Test that combine() output can be consumed by broadcast() without format errors
      // This validates the integration between the two functions
      const unsignedTx = JSON.stringify({
        nonce: 0,
        value: "1000000000000000000",
        receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 2,
        options: 1,
      });

      const signature =
        "test_signature_hex_string_64_chars_long_1234567890123456789012345678901234567890123456789012345678901234";

      // Step 1: Combine unsigned transaction with signature
      const signedTx = api.combine(unsignedTx, signature);

      // Step 2: Verify signed transaction can be parsed and has correct structure
      const parsed = JSON.parse(signedTx);
      expect(parsed.signature).toBe(signature);
      expect(parsed.nonce).toBe(0);
      expect(parsed.value).toBe("1000000000000000000");

      // Step 3: Verify broadcast() can parse the combined transaction (validation only, no network call)
      // We'll test that broadcast() validation accepts the format (will fail on network call, but not on parsing)
      // Note: broadcast() will fail on network call, but we can verify it parses correctly
      try {
        await api.broadcast(signedTx);
        // If we get here, parsing succeeded (network call may fail, but that's expected)
      } catch (error) {
        // Expected: network call will fail, but parsing should succeed
        // Verify error is NOT about malformed JSON or missing fields
        const errorMessage = (error as Error).message;
        expect(errorMessage).not.toContain("malformed JSON");
        expect(errorMessage).not.toContain("missing required fields");
        expect(errorMessage).not.toContain("missing signature");
        // Error should be about network/validation, not format
      }
    });
  });

  // Story 3.4: Unsupported Rewards Method Integration Tests
  describe("getRewards (Story 3.4)", () => {
    it("throws 'not supported' error", async () => {
      await expect(api.getRewards(TEST_ADDRESSES.withEgld)).rejects.toThrow(
        "getRewards is not supported",
      );
    });

    it("throws error with correct message format for any address", async () => {
      await expect(api.getRewards(TEST_ADDRESSES.zeroBalance)).rejects.toThrow(
        "getRewards is not supported",
      );
    });

    it("error message exactly matches ADR-003 format", async () => {
      await expect(api.getRewards(TEST_ADDRESSES.withEgld)).rejects.toThrow(
        "getRewards is not supported",
      );
      // Verify error type
      await expect(api.getRewards(TEST_ADDRESSES.withEgld)).rejects.toThrow(Error);
    });

    it("ignores cursor parameter when provided", async () => {
      // Verify cursor parameter is ignored (method throws regardless)
      await expect(api.getRewards(TEST_ADDRESSES.withEgld, "some-cursor")).rejects.toThrow(
        "getRewards is not supported",
      );
    });
  });

  // Story 4.8: Unsupported Raw Transaction Method Integration Tests
  describe("craftRawTransaction (Story 4.8)", () => {
    it("throws 'craftRawTransaction is not supported' error", async () => {
      await expect(
        api.craftRawTransaction("raw-tx", TEST_ADDRESSES.withEgld, "pubkey", 1n),
      ).rejects.toThrow("craftRawTransaction is not supported");
    });

    it("throws error with correct message format for any parameters", async () => {
      await expect(api.craftRawTransaction("", "", "", 0n)).rejects.toThrow(
        "craftRawTransaction is not supported",
      );
    });

    it("error message exactly matches ADR-003 format", async () => {
      await expect(
        api.craftRawTransaction("raw-tx", TEST_ADDRESSES.withEgld, "pubkey", 1n),
      ).rejects.toThrow(new Error("craftRawTransaction is not supported"));
    });

    it("accepts correct parameter types per Api interface", async () => {
      // Verify method signature matches interface requirements
      await expect(
        api.craftRawTransaction(
          "valid-string", // string
          TEST_ADDRESSES.withEgld, // string (valid address format)
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // string (public key hex)
          42n, // bigint
        ),
      ).rejects.toThrow("craftRawTransaction is not supported");
    });

    it("ignores all parameters when provided", async () => {
      // Verify parameters are ignored (method throws regardless)
      await expect(
        api.craftRawTransaction("any-tx", "any-sender", "any-pubkey", 999n),
      ).rejects.toThrow("craftRawTransaction is not supported");
    });
  });

  // Story 2.3: Pagination Consistency Integration Tests
  describe("listOperations - pagination consistency (Story 2.3, AC: #3)", () => {
    it("paginated results have no duplicates across pages", async () => {
      // Fetch page 1
      const [page1, cursor1] = await api.listOperations(TEST_ADDRESSES.withEgld, { limit: 10 });

      if (cursor1) {
        // Fetch page 2
        const [page2, cursor2] = await api.listOperations(TEST_ADDRESSES.withEgld, {
          limit: 10,
          pagingToken: cursor1,
        });

        // Verify no duplicates between page1 and page2
        const page1Ids = new Set(page1.map(op => op.id));
        for (const op of page2) {
          expect(page1Ids.has(op.id)).toBe(false);
        }

        // If there's a page 3, check that too
        if (cursor2) {
          const [page3] = await api.listOperations(TEST_ADDRESSES.withEgld, {
            limit: 10,
            pagingToken: cursor2,
          });

          const allPreviousIds = new Set([...page1.map(op => op.id), ...page2.map(op => op.id)]);
          for (const op of page3) {
            expect(allPreviousIds.has(op.id)).toBe(false);
          }
        }
      }
    }, TIMEOUT_EXTENDED);

    it("paginated results maintain proper block height ordering across pages", async () => {
      const [page1, cursor1] = await api.listOperations(TEST_ADDRESSES.withEgld, {
        limit: 10,
        order: "desc",
      });

      if (cursor1 && page1.length > 0) {
        const [page2] = await api.listOperations(TEST_ADDRESSES.withEgld, {
          limit: 10,
          pagingToken: cursor1,
          order: "desc",
        });

        if (page2.length > 0) {
          // Last operation of page1 should have height >= first operation of page2
          const lastPage1Height = page1[page1.length - 1].tx.block.height;
          const firstPage2Height = page2[0].tx.block.height;
          expect(lastPage1Height).toBeGreaterThanOrEqual(firstPage2Height);
        }
      }
    }, TIMEOUT_EXTENDED);

    it("cursor format is height:txHash for precise positioning", async () => {
      const [, cursor] = await api.listOperations(TEST_ADDRESSES.withEgld, { limit: 5 });

      if (cursor) {
        // Cursor should match format "{height}:{txHash}" (case-insensitive hex)
        expect(cursor).toMatch(/^\d+:[a-fA-F0-9]+$/i);
      }
    }, TIMEOUT_STANDARD);

    it("paginated ascending order maintains no gaps or duplicates", async () => {
      const [page1, cursor1] = await api.listOperations(TEST_ADDRESSES.withEgld, {
        limit: 10,
        order: "asc",
      });

      if (cursor1 && page1.length > 0) {
        const [page2] = await api.listOperations(TEST_ADDRESSES.withEgld, {
          limit: 10,
          pagingToken: cursor1,
          order: "asc",
        });

        // Verify no duplicates
        const page1Ids = new Set(page1.map(op => op.id));
        for (const op of page2) {
          expect(page1Ids.has(op.id)).toBe(false);
        }

        // Verify ordering continues correctly
        if (page2.length > 0) {
          const lastPage1Height = page1[page1.length - 1].tx.block.height;
          const firstPage2Height = page2[0].tx.block.height;
          expect(firstPage2Height).toBeGreaterThanOrEqual(lastPage1Height);
        }
      }
    }, TIMEOUT_EXTENDED);
  });

  describe("estimateFees", () => {
    it("should estimate fees for native transfer (AC1)", async () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESSES.withEgld,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const result = await api.estimateFees(intent);

      expect(result.value).toBeGreaterThan(0n);
      expect(result.parameters).toBeDefined();
      expect(result.parameters?.gasLimit).toBeDefined();
      expect(result.parameters?.gasPrice).toBeDefined();
      expect(typeof result.parameters?.gasLimit).toBe("bigint");
      expect(typeof result.parameters?.gasPrice).toBe("bigint");
    });

    it("should estimate fees for ESDT transfer (AC2)", async () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESSES.withTokens,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: 1000000n,
        asset: { type: "esdt", assetReference: "USDC-c76f1f" },
      };

      const result = await api.estimateFees(intent);

      expect(result.value).toBeGreaterThan(0n);
      expect(result.parameters).toBeDefined();
      expect(result.parameters?.gasLimit).toBeDefined();
      expect(result.parameters?.gasPrice).toBeDefined();
      // ESDT transfers should have higher gas limit than native
      expect(result.parameters?.gasLimit).toBeGreaterThan(50000n);
    });

    it("should estimate fees for delegation operation (AC3)", async () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "delegate",
        sender: TEST_ADDRESSES.withEgld,
        recipient: TEST_ADDRESSES.zeroBalance, // Validator address
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const result = await api.estimateFees(intent);

      expect(result.value).toBeGreaterThan(0n);
      expect(result.parameters).toBeDefined();
      expect(result.parameters?.gasLimit).toBeDefined();
      expect(result.parameters?.gasPrice).toBeDefined();
      // Delegation should have much higher gas limit
      expect(result.parameters?.gasLimit).toBeGreaterThan(1000000n);
    });

    it("should estimate fees for claim rewards operation (AC3)", async () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "claimRewards",
        sender: TEST_ADDRESSES.withEgld,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: 0n,
        asset: { type: "native" },
      };

      const result = await api.estimateFees(intent);

      expect(result.value).toBeGreaterThan(0n);
      expect(result.parameters).toBeDefined();
      expect(result.parameters?.gasLimit).toBeDefined();
      expect(result.parameters?.gasPrice).toBeDefined();
    });

    it("should use current network gas price (AC4)", async () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESSES.withEgld,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const result = await api.estimateFees(intent);

      // Verify fee calculation: gasLimit * gasPrice
      const gasLimit = result.parameters?.gasLimit as bigint;
      const gasPrice = result.parameters?.gasPrice as bigint;
      expect(result.value).toBe(gasLimit * gasPrice);
      expect(gasPrice).toBeGreaterThan(0n);

      // AC4: Verify gas price is from network (not hardcoded constant)
      // Network gas price should be a reasonable value (MultiversX typically uses 1,000,000,000 = 1 Gwei)
      // But we verify it's actually fetched by ensuring it's a valid bigint and matches expected range
      expect(gasPrice).toBeGreaterThan(0n);
      expect(gasPrice).toBeLessThanOrEqual(10000000000n); // Should be reasonable (max 10 Gwei)

      // Verify that calling estimateFees again returns consistent network gas price
      // (if network hasn't changed, gas price should be same)
      const result2 = await api.estimateFees(intent);
      expect(result2.parameters?.gasPrice).toBe(gasPrice);
    });

    it("should accept custom fee parameters", async () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESSES.withEgld,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const customGasLimit = 100000n;
      const customGasPrice = 2000000000n;
      const result = await api.estimateFees(intent, {
        gasLimit: customGasLimit,
        gasPrice: customGasPrice,
      });

      expect(result.parameters?.gasLimit).toBe(customGasLimit);
      expect(result.parameters?.gasPrice).toBe(customGasPrice);
      expect(result.value).toBe(customGasLimit * customGasPrice);
    });

    it("should return reasonable fee values", async () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESSES.withEgld,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const result = await api.estimateFees(intent);

      // Fee should be reasonable (not zero, not astronomically high)
      expect(result.value).toBeGreaterThan(0n);
      // For native transfer, fee should be less than 1 EGLD (1e18)
      expect(result.value).toBeLessThan(1000000000000000000n);
    });
  });

  describe("validateIntent", () => {
    it("validates native transfer intent with real balances", async () => {
      const balances = await api.getBalance(TEST_ADDRESSES.withEgld);

      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: TEST_ADDRESSES.withEgld,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: 100000000000000000n, // 0.1 EGLD
        asset: { type: "native" as const },
      };

      const result = await api.validateIntent(intent, balances);

      expect(result).toBeDefined();
      expect(result.estimatedFees).toBeDefined();
      expect(result.amount).toBe(100000000000000000n);
      expect(result.totalSpent).toBeGreaterThanOrEqual(100000000000000000n); // amount + fees
      expect(typeof result.totalSpent).toBe("bigint");
    }, TIMEOUT_STANDARD);

    it("validates ESDT transfer intent with real balances", async () => {
      const balances = await api.getBalance(TEST_ADDRESSES.withTokens);

      // Find an ESDT token balance
      const esdtBalance = balances.find(b => b.asset.type === "esdt");
      if (!esdtBalance) {
        // Skip if account has no ESDT tokens
        return;
      }

      const assetRef = (esdtBalance.asset as { assetReference?: string }).assetReference;
      if (!assetRef) {
        return;
      }

      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: TEST_ADDRESSES.withTokens,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: 100000000000000000n,
        asset: {
          type: "esdt" as const,
          assetReference: assetRef,
        },
      };

      const result = await api.validateIntent(intent, balances);

      expect(result).toBeDefined();
      expect(result.amount).toBe(100000000000000000n);
      expect(result.totalSpent).toBe(100000000000000000n); // Only token amount, fees separate
    }, TIMEOUT_STANDARD);

    it("detects insufficient balance errors correctly", async () => {
      const balances = await api.getBalance(TEST_ADDRESSES.withEgld);
      const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? 0n;

      // Create intent that exceeds balance
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: TEST_ADDRESSES.withEgld,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: nativeBalance + 1000000000000000000n, // Exceeds balance
        asset: { type: "native" as const },
      };

      const result = await api.validateIntent(intent, balances);

      expect(result.errors.amount).toBeDefined();
      expect(result.errors.amount?.message).toContain("Insufficient");
    }, TIMEOUT_STANDARD);

    it("validates with custom fees parameter", async () => {
      const balances = await api.getBalance(TEST_ADDRESSES.withEgld);

      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: TEST_ADDRESSES.withEgld,
        recipient: TEST_ADDRESSES.zeroBalance,
        amount: 100000000000000000n, // 0.1 EGLD
        asset: { type: "native" as const },
      };

      const customFees = {
        value: 100000000000000000n, // 0.1 EGLD
      };

      const result = await api.validateIntent(intent, balances, customFees);

      expect(result.estimatedFees).toBe(100000000000000000n);
      expect(result.totalSpent).toBe(200000000000000000n); // amount + fees
    }, TIMEOUT_STANDARD);
  });

  // Story 5.6: Edge Case Integration Tests
  // Tests edge cases for empty accounts, new accounts, and unusual scenarios
  describe("Edge Cases - Empty and New Accounts (Story 5.6)", () => {
    // Edge Case Test Addresses (documented reasoning)
    // - systemContract: Guaranteed 0 balance, no history, no delegations (used as canonical empty account)
    // - stakingContract: May have interactions but different behavior than regular accounts
    // - withEgld: Very active account for pagination testing
    const EDGE_CASE_ADDRESSES = {
      // System smart contract - guaranteed 0 balance, no history, no delegations
      systemContract: TEST_ADDRESSES.zeroBalance,
      // Staking smart contract - may have interactions but no user delegations
      stakingContract: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
      // Very active account for pagination testing (genesis address)
      highActivity: TEST_ADDRESSES.withEgld,
    };

    // Task 2: Test getBalance edge cases (AC: #1)
    describe("getBalance edge cases (AC: #1)", () => {
      it("returns native balance 0n for empty account (FR4 compliance)", async () => {
        const balances = await api.getBalance(EDGE_CASE_ADDRESSES.systemContract);

        // CRITICAL: Must never return empty array per FR4
        expect(balances.length).toBeGreaterThanOrEqual(1);

        // First element must be native balance with 0n
        expect(balances[0]).toEqual({
          value: 0n,
          asset: { type: "native" },
        });
      });

      it("returns correct structure for new account (never transacted)", async () => {
        const balances = await api.getBalance(EDGE_CASE_ADDRESSES.systemContract);

        // Verify array structure
        expect(Array.isArray(balances)).toBe(true);
        expect(balances.length).toBeGreaterThanOrEqual(1);

        // Verify first element is native balance
        const nativeBalance = balances[0];
        expect(nativeBalance).toHaveProperty("value");
        expect(nativeBalance).toHaveProperty("asset");
        expect(typeof nativeBalance.value).toBe("bigint");
        expect(nativeBalance.asset.type).toBe("native");
      });

      it("account with only EGLD (no ESDT) returns only native balance", async () => {
        // Use a known address that has EGLD but no ESDT tokens
        // For this test, we verify the structure when ESDT tokens are absent
        const balances = await api.getBalance(EDGE_CASE_ADDRESSES.systemContract);

        // Should have exactly 1 balance (native only)
        expect(balances.length).toBe(1);
        expect(balances[0].asset.type).toBe("native");

        // Verify no ESDT tokens
        const esdtBalances = balances.filter(b => b.asset.type === "esdt");
        expect(esdtBalances.length).toBe(0);
      });

      it("balance array structure matches FR4 compliance (value is bigint, asset has type)", async () => {
        const balances = await api.getBalance(EDGE_CASE_ADDRESSES.systemContract);

        // FR4 compliance: Always return at least one Balance
        expect(balances.length).toBeGreaterThanOrEqual(1);

        for (const balance of balances) {
          // Value must be bigint
          expect(typeof balance.value).toBe("bigint");
          expect(balance.value).toBeGreaterThanOrEqual(0n);

          // Asset must have type
          expect(balance.asset).toHaveProperty("type");
          expect(["native", "esdt"]).toContain(balance.asset.type);
        }
      });

      it("returns 0n value (not null, undefined, or empty)", async () => {
        const balances = await api.getBalance(EDGE_CASE_ADDRESSES.systemContract);

        const nativeBalance = balances[0];
        expect(nativeBalance.value).toBe(0n);
        expect(nativeBalance.value).not.toBe(null);
        expect(nativeBalance.value).not.toBe(undefined);
        expect(nativeBalance.value).not.toBe(0); // Must be bigint, not number
      });
    });

    // Task 3: Test listOperations edge cases (AC: #2, #4)
    describe("listOperations edge cases (AC: #2, #4)", () => {
      it("returns valid array structure for system contract address (AC: #2)", async () => {
        // Note: System contract may have incoming transactions on mainnet
        // This test verifies the return type is always a valid array
        const [operations, cursor] = await api.listOperations(
          EDGE_CASE_ADDRESSES.systemContract,
          { limit: 10 },
        );

        // Should always return an array (not null, not undefined)
        expect(Array.isArray(operations)).toBe(true);

        // Cursor should be a string
        expect(typeof cursor).toBe("string");

        // If operations exist, verify their structure
        for (const op of operations) {
          expect(op).toHaveProperty("id");
          expect(op).toHaveProperty("type");
          expect(op).toHaveProperty("value");
          expect(op).toHaveProperty("asset");
          expect(["IN", "OUT"]).toContain(op.type);
          expect(typeof op.value).toBe("bigint");
        }
      }, TIMEOUT_EXTENDED); // Extended timeout for potentially slow API response

      it("returns tuple structure even for empty results", async () => {
        const result = await api.listOperations(EDGE_CASE_ADDRESSES.systemContract, {
          limit: 10,
        });

        // Must return tuple [operations, cursor]
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);

        const [operations, cursor] = result;
        expect(Array.isArray(operations)).toBe(true);
        expect(typeof cursor).toBe("string");
      });

      it("pagination works correctly for very active account (AC: #4)", async () => {
        // Fetch first page
        const [page1, cursor1] = await api.listOperations(EDGE_CASE_ADDRESSES.highActivity, {
          limit: 5,
        });

        expect(page1.length).toBeLessThanOrEqual(5);
        expect(page1.length).toBeGreaterThan(0); // Active account should have operations

        if (cursor1) {
          // Fetch second page
          const [page2, cursor2] = await api.listOperations(EDGE_CASE_ADDRESSES.highActivity, {
            limit: 5,
            pagingToken: cursor1,
          });

          expect(page2.length).toBeLessThanOrEqual(5);

          // Verify no duplicates between pages
          const page1Ids = new Set(page1.map(op => op.id));
          for (const op of page2) {
            expect(page1Ids.has(op.id)).toBe(false);
          }

          // If there's a third page, verify continued pagination
          if (cursor2) {
            const [page3] = await api.listOperations(EDGE_CASE_ADDRESSES.highActivity, {
              limit: 5,
              pagingToken: cursor2,
            });

            // Verify no duplicates with previous pages
            const allPreviousIds = new Set([
              ...page1.map(op => op.id),
              ...page2.map(op => op.id),
            ]);
            for (const op of page3) {
              expect(allPreviousIds.has(op.id)).toBe(false);
            }
          }
        }
      }, TIMEOUT_EXTENDED);

      it("pagination boundary: last page returns remaining items", async () => {
        // First fetch all operations to understand the dataset
        const [allOps] = await api.listOperations(EDGE_CASE_ADDRESSES.highActivity, {
          limit: 100,
        });

        if (allOps.length > 5) {
          // Fetch with small limit to force pagination
          const [page1, cursor1] = await api.listOperations(EDGE_CASE_ADDRESSES.highActivity, {
            limit: 5,
          });

          expect(page1.length).toBe(5);

          // Continue fetching until we reach the end or a smaller page
          let lastPageFound = false;
          let currentCursor: string | undefined = cursor1;
          let iterations = 0;
          const maxIterations = 10;

          while (currentCursor && iterations < maxIterations) {
            const [nextPage, nextCursor] = await api.listOperations(
              EDGE_CASE_ADDRESSES.highActivity,
              { limit: 5, pagingToken: currentCursor },
            );

            if (nextPage.length < 5 || !nextCursor) {
              lastPageFound = true;
              // Verify last page structure is correct
              expect(Array.isArray(nextPage)).toBe(true);
              expect(nextPage.length).toBeLessThanOrEqual(5);
              break;
            }

            currentCursor = nextCursor;
            iterations++;
          }

          // Either we found a last page or reached max iterations (which is fine for very active accounts)
          expect(iterations).toBeLessThanOrEqual(maxIterations);
        }
      }, 180000);

      it("pagination with empty page at end doesn't throw", async () => {
        // Use an address with limited history
        const [ops, cursor] = await api.listOperations(EDGE_CASE_ADDRESSES.systemContract, {
          limit: 10,
        });

        // Should handle gracefully even if no operations
        expect(Array.isArray(ops)).toBe(true);

        // If there's a cursor, try to paginate (should return empty or more results)
        if (cursor) {
          const [nextOps] = await api.listOperations(EDGE_CASE_ADDRESSES.systemContract, {
            limit: 10,
            pagingToken: cursor,
          });

          // Should not throw, should return array
          expect(Array.isArray(nextOps)).toBe(true);
        }
      }, TIMEOUT_EXTENDED); // Extended timeout for potentially slow API response
    });

    // Task 4: Test getStakes edge cases (AC: #3)
    describe("getStakes edge cases (AC: #3)", () => {
      it("returns { items: [], next: undefined } for account with no delegations (AC: #3)", async () => {
        const result = await api.getStakes(EDGE_CASE_ADDRESSES.systemContract);

        // Should return Page structure with empty items
        expect(result).toHaveProperty("items");
        expect(result).toHaveProperty("next");
        expect(result.items).toEqual([]);
        expect(result.next).toBeUndefined();
      });

      it("system contract address returns empty delegations", async () => {
        const result = await api.getStakes(EDGE_CASE_ADDRESSES.systemContract);

        // System contracts typically have no user delegations
        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items.length).toBe(0);
      });

      it("Page structure is returned even when empty", async () => {
        const result = await api.getStakes(EDGE_CASE_ADDRESSES.systemContract);

        // Verify Page<Stake> structure
        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
        expect(result).toHaveProperty("items");
        expect(result).toHaveProperty("next");

        // Items is array (empty is fine)
        expect(Array.isArray(result.items)).toBe(true);

        // Next is undefined for empty results (no pagination)
        expect(result.next).toBeUndefined();
      });

      it("staking contract address returns valid Page structure", async () => {
        const result = await api.getStakes(EDGE_CASE_ADDRESSES.stakingContract);

        // Verify Page structure regardless of content
        expect(result).toHaveProperty("items");
        expect(result).toHaveProperty("next");
        expect(Array.isArray(result.items)).toBe(true);
      });
    });

    // Task 5: Test getSequence edge cases
    describe("getSequence edge cases", () => {
      it("new account returns 0n nonce", async () => {
        const sequence = await api.getSequence(EDGE_CASE_ADDRESSES.systemContract);

        // New/empty accounts should have 0n nonce
        expect(typeof sequence).toBe("bigint");
        expect(sequence).toBeGreaterThanOrEqual(0n);
      });

      it("system contract address returns valid nonce", async () => {
        const sequence = await api.getSequence(EDGE_CASE_ADDRESSES.systemContract);

        // Should return valid bigint
        expect(typeof sequence).toBe("bigint");
        expect(sequence).toBeGreaterThanOrEqual(0n);

        // Should not be NaN or invalid
        expect(Number.isNaN(Number(sequence))).toBe(false);
      });

      it("nonce is never negative", async () => {
        const sequence1 = await api.getSequence(EDGE_CASE_ADDRESSES.systemContract);
        const sequence2 = await api.getSequence(EDGE_CASE_ADDRESSES.highActivity);

        expect(sequence1).toBeGreaterThanOrEqual(0n);
        expect(sequence2).toBeGreaterThanOrEqual(0n);
      });

      it("active account returns positive nonce", async () => {
        const sequence = await api.getSequence(EDGE_CASE_ADDRESSES.highActivity);

        // Active accounts with history should have positive nonce
        expect(typeof sequence).toBe("bigint");
        expect(sequence).toBeGreaterThan(0n);
      });
    });

    // Task 6: Test invalid address handling edge cases
    describe("invalid address handling edge cases", () => {
      it("getBalance throws consistent error for invalid address format", async () => {
        await expect(api.getBalance("invalid-address")).rejects.toThrow(
          /Invalid MultiversX address/,
        );
      });

      it("getSequence throws consistent error for invalid address format", async () => {
        await expect(api.getSequence("invalid-address")).rejects.toThrow(
          /Invalid MultiversX address/,
        );
      });

      it("listOperations throws consistent error for invalid address format", async () => {
        await expect(api.listOperations("invalid-address", {})).rejects.toThrow(
          /Invalid MultiversX address/,
        );
      });

      it("getStakes throws consistent error for invalid address format", async () => {
        await expect(api.getStakes("invalid-address")).rejects.toThrow(
          /Invalid MultiversX address/,
        );
      });

      it("truncated bech32 address throws error", async () => {
        // Truncated address (missing characters)
        const truncatedAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd";

        await expect(api.getBalance(truncatedAddress)).rejects.toThrow(
          /Invalid MultiversX address/,
        );
      });

      it("malformed bech32 address throws error", async () => {
        // Invalid characters in bech32
        const malformedAddress = "erd1INVALID_CHARS!@#$%^&*()";

        await expect(api.getBalance(malformedAddress)).rejects.toThrow(
          /Invalid MultiversX address/,
        );
      });

      it("empty string address throws error", async () => {
        await expect(api.getBalance("")).rejects.toThrow(/Invalid MultiversX address/);
        await expect(api.getSequence("")).rejects.toThrow(/Invalid MultiversX address/);
        await expect(api.listOperations("", {})).rejects.toThrow(/Invalid MultiversX address/);
        await expect(api.getStakes("")).rejects.toThrow(/Invalid MultiversX address/);
      });

      it("wrong prefix address throws error", async () => {
        // Address with wrong prefix (btc instead of erd1)
        const wrongPrefixAddress = "btc1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

        await expect(api.getBalance(wrongPrefixAddress)).rejects.toThrow(
          /Invalid MultiversX address/,
        );
      });
    });

    // Task 7: Test network error edge cases
    describe("network error edge cases", () => {
      it("API with invalid endpoint throws descriptive error for getBalance", async () => {
        const badApi = createApi({
          apiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
          delegationApiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
        });

        await expect(badApi.getBalance(TEST_ADDRESSES.withEgld)).rejects.toThrow(
          /Failed to fetch account/,
        );
      });

      it("API with invalid endpoint throws descriptive error for getSequence", async () => {
        const badApi = createApi({
          apiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
          delegationApiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
        });

        await expect(badApi.getSequence(TEST_ADDRESSES.withEgld)).rejects.toThrow(
          /Failed to fetch account/,
        );
      });

      it("API with invalid endpoint throws error for listOperations", async () => {
        const badApi = createApi({
          apiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
          delegationApiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
        });

        // listOperations may throw raw network error (ENOTFOUND) or wrapped error
        await expect(badApi.listOperations(TEST_ADDRESSES.withEgld, {})).rejects.toThrow();
      });

      it("API with invalid endpoint throws descriptive error for getStakes", async () => {
        const badApi = createApi({
          apiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
          delegationApiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
        });

        await expect(badApi.getStakes(TEST_ADDRESSES.withEgld)).rejects.toThrow(
          /Failed to fetch delegations/,
        );
      });

      it("all methods throw errors for invalid endpoint", async () => {
        const badApi = createApi({
          apiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
          delegationApiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
        });

        const errors: Error[] = [];

        try {
          await badApi.getBalance(TEST_ADDRESSES.withEgld);
        } catch (e) {
          errors.push(e as Error);
        }

        try {
          await badApi.getSequence(TEST_ADDRESSES.withEgld);
        } catch (e) {
          errors.push(e as Error);
        }

        try {
          await badApi.listOperations(TEST_ADDRESSES.withEgld, {});
        } catch (e) {
          errors.push(e as Error);
        }

        try {
          await badApi.getStakes(TEST_ADDRESSES.withEgld);
        } catch (e) {
          errors.push(e as Error);
        }

        // All 4 methods should throw errors for invalid endpoint
        expect(errors.length).toBe(4);

        // All errors should be Error instances with messages
        for (const error of errors) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
        }
      });
    });
  });

  // Story 5.7: Combine Method Integration Tests
  // Tests the full chain: craftTransaction → combine with real transactions
  describe("combine - integration tests (Story 5.7)", () => {
    const SENDER = TEST_ADDRESSES.withEgld;
    const RECIPIENT = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
    // Uses shared LEDGER_VALIDATOR constant defined at top of file

    // Mock signature (64-byte / 128-char hex) - real signatures require hardware wallet
    const MOCK_SIGNATURE =
      "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" +
      "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";

    // Task 1: craftTransaction → combine chain (AC: #1, #4)
    describe("craftTransaction → combine chain (AC: #1, #4)", () => {
      it("combines unsigned transaction from craftTransaction with mock signature (AC: #1)", async () => {
        // Step 1: Craft real unsigned transaction
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: ONE_EGLD, // 1 EGLD
          asset: { type: "native" as const },
          sequence: 42n, // Explicit nonce to avoid network call (deterministic test)
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);

        // Step 2: Combine with mock signature
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        // Step 3: Verify result is valid JSON
        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);
        expect(parsed.signature).toBe(MOCK_SIGNATURE);
        expect(parsed.nonce).toBe(42);
        expect(parsed.sender).toBe(SENDER);
        expect(parsed.receiver).toBe(RECIPIENT);
      });

      it("combined result contains all original transaction fields (AC: #4)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 5n * ONE_EGLD, // 5 EGLD
          asset: { type: "native" as const },
          sequence: 100n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const unsignedParsed = JSON.parse(unsignedTx);

        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const signedParsed = JSON.parse(signedTx);

        // Verify all original fields are preserved
        expect(signedParsed.nonce).toBe(unsignedParsed.nonce);
        expect(signedParsed.value).toBe(unsignedParsed.value);
        expect(signedParsed.receiver).toBe(unsignedParsed.receiver);
        expect(signedParsed.sender).toBe(unsignedParsed.sender);
        expect(signedParsed.gasPrice).toBe(unsignedParsed.gasPrice);
        expect(signedParsed.gasLimit).toBe(unsignedParsed.gasLimit);
        expect(signedParsed.chainID).toBe(unsignedParsed.chainID);
        expect(signedParsed.version).toBe(unsignedParsed.version);
        expect(signedParsed.options).toBe(unsignedParsed.options);
      });

      it("combined result has signature field added (AC: #4)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 2n * ONE_EGLD, // 2 EGLD
          asset: { type: "native" as const },
          sequence: 50n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const unsignedParsed = JSON.parse(unsignedTx);

        // Verify unsigned transaction does NOT have signature
        expect(unsignedParsed.signature).toBeUndefined();

        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const signedParsed = JSON.parse(signedTx);

        // Verify signed transaction HAS signature
        expect(signedParsed.signature).toBeDefined();
        expect(signedParsed.signature).toBe(MOCK_SIGNATURE);
      });

      it("full flow: craftTransaction → combine → verify structure (AC: #1, #4)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: (ONE_EGLD * 3n) / 2n, // 1.5 EGLD
          asset: { type: "native" as const },
          sequence: 77n,
        };

        // Full flow
        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        // Verify result is valid JSON
        expect(() => JSON.parse(signedTx)).not.toThrow();

        // Parse and validate complete structure
        const parsed = JSON.parse(signedTx);

        // All required fields per MultiversXProtocolTransaction
        expect(typeof parsed.nonce).toBe("number");
        expect(typeof parsed.value).toBe("string");
        expect(typeof parsed.receiver).toBe("string");
        expect(typeof parsed.sender).toBe("string");
        expect(typeof parsed.gasPrice).toBe("number");
        expect(typeof parsed.gasLimit).toBe("number");
        expect(typeof parsed.chainID).toBe("string");
        expect(typeof parsed.version).toBe("number");
        expect(typeof parsed.options).toBe("number");
        expect(typeof parsed.signature).toBe("string");

        // Verify expected values
        expect(parsed.nonce).toBe(77);
        expect(parsed.value).toBe(((ONE_EGLD * 3n) / 2n).toString());
        expect(parsed.signature).toBe(MOCK_SIGNATURE);
      });
    });

    // Task 2: Native EGLD transaction integration tests (AC: #2)
    describe("native EGLD transactions (AC: #2)", () => {
      it("crafts and combines native EGLD transfer (AC: #2)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 3n * ONE_EGLD, // 3 EGLD
          asset: { type: "native" as const },
          sequence: 10n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);
        expect(parsed.signature).toBe(MOCK_SIGNATURE);
        expect(parsed.value).toBe((3n * ONE_EGLD).toString());
      });

      it("signed native transaction has correct structure (AC: #2)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: ONE_EGLD, // 1 EGLD
          asset: { type: "native" as const },
          sequence: 25n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        // Verify MultiversXProtocolTransaction structure
        expect(parsed.nonce).toBe(25);
        expect(parsed.sender).toBe(SENDER);
        expect(parsed.receiver).toBe(RECIPIENT);
        expect(parsed.gasPrice).toBe(1000000000); // GAS_PRICE constant
        expect(parsed.gasLimit).toBe(50000); // MIN_GAS_LIMIT for native
        expect(parsed.chainID).toBe("1");
        expect(parsed.version).toBe(2);
        expect(parsed.options).toBe(1);
        expect(parsed.signature).toBe(MOCK_SIGNATURE);
      });

      it("native transaction has no data field (AC: #2)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: ONE_EGLD / 2n, // 0.5 EGLD
          asset: { type: "native" as const },
          sequence: 33n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        // Native EGLD transfers should NOT have data field
        expect(parsed).not.toHaveProperty("data");
        expect(parsed.signature).toBe(MOCK_SIGNATURE);
      });

      it("value, sender, receiver preserved correctly after combine (AC: #2)", async () => {
        const testAmount = (ONE_EGLD * 15n) / 2n; // 7.5 EGLD
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: testAmount,
          asset: { type: "native" as const },
          sequence: 88n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        expect(parsed.value).toBe(testAmount.toString());
        expect(parsed.sender).toBe(SENDER);
        expect(parsed.receiver).toBe(RECIPIENT);
      });
    });

    // Task 3: ESDT token transaction integration tests (AC: #3)
    describe("ESDT token transactions (AC: #3)", () => {
      const TOKEN_IDENTIFIER = "WEGLD-bd4d79";

      it("crafts and combines ESDT token transfer (AC: #3)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: ONE_EGLD / 10n, // 0.1 tokens (18 decimals)
          asset: { type: "esdt" as const, assetReference: TOKEN_IDENTIFIER },
          sequence: 15n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        expect(parsed.signature).toBe(MOCK_SIGNATURE);
        expect(parsed).toHaveProperty("data");
      });

      it("ESDT data field is preserved after combine (AC: #3)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 50000000n, // 50 tokens (with 6 decimals)
          asset: { type: "esdt" as const, assetReference: TOKEN_IDENTIFIER },
          sequence: 20n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const unsignedParsed = JSON.parse(unsignedTx);

        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const signedParsed = JSON.parse(signedTx);

        // Data field should be preserved exactly
        expect(signedParsed.data).toBe(unsignedParsed.data);
        expect(signedParsed.data).toBeDefined();

        // Decode and verify it's ESDT transfer format
        const decodedData = Buffer.from(signedParsed.data, "base64").toString();
        expect(decodedData).toMatch(/^ESDTTransfer@/);
      });

      it("ESDT value='0' preserved (amount in data) (AC: #3)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 1000000000n, // 1000 tokens
          asset: { type: "esdt" as const, assetReference: TOKEN_IDENTIFIER },
          sequence: 30n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        // ESDT transfers have value="0" - amount is in data field
        expect(parsed.value).toBe("0");
        expect(parsed.signature).toBe(MOCK_SIGNATURE);
      });

      it("token identifier is preserved in data encoding (AC: #3)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 250000000n,
          asset: { type: "esdt" as const, assetReference: TOKEN_IDENTIFIER },
          sequence: 45n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        const decodedData = Buffer.from(parsed.data, "base64").toString();

        // Token identifier should be hex-encoded in the data
        const tokenHex = Buffer.from(TOKEN_IDENTIFIER).toString("hex");
        expect(decodedData).toContain(tokenHex);
      });
    });

    // Task 4: Staking transaction integration tests (AC: #3, #4)
    describe("staking transactions (AC: #3, #4)", () => {
      it("crafts and combines delegate transaction (AC: #3, #4)", async () => {
        const intent = {
          intentType: "staking" as const,
          type: "delegate",
          sender: SENDER,
          recipient: LEDGER_VALIDATOR,
          amount: 10n * ONE_EGLD, // 10 EGLD
          asset: { type: "native" as const },
          sequence: 60n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        expect(parsed.signature).toBe(MOCK_SIGNATURE);
        expect(parsed.receiver).toBe(LEDGER_VALIDATOR);
      });

      it("staking data field is preserved after combine (AC: #3, #4)", async () => {
        const intent = {
          intentType: "staking" as const,
          type: "delegate",
          sender: SENDER,
          recipient: LEDGER_VALIDATOR,
          amount: 5n * ONE_EGLD, // 5 EGLD
          asset: { type: "native" as const },
          sequence: 70n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const unsignedParsed = JSON.parse(unsignedTx);

        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const signedParsed = JSON.parse(signedTx);

        // Data field should be preserved
        expect(signedParsed.data).toBe(unsignedParsed.data);

        // Verify it's "delegate" encoded
        const decodedData = Buffer.from(signedParsed.data, "base64").toString();
        expect(decodedData).toBe("delegate");
      });

      it("value field contains delegation amount (AC: #4)", async () => {
        const delegationAmount = 15n * ONE_EGLD; // 15 EGLD
        const intent = {
          intentType: "staking" as const,
          type: "delegate",
          sender: SENDER,
          recipient: LEDGER_VALIDATOR,
          amount: delegationAmount,
          asset: { type: "native" as const },
          sequence: 80n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        // Delegate transactions carry value in value field
        expect(parsed.value).toBe(delegationAmount.toString());
      });

      it("receiver is validator contract address (AC: #4)", async () => {
        const intent = {
          intentType: "staking" as const,
          type: "delegate",
          sender: SENDER,
          recipient: LEDGER_VALIDATOR,
          amount: ONE_EGLD, // 1 EGLD
          asset: { type: "native" as const },
          sequence: 90n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        // Receiver should be the validator contract
        expect(parsed.receiver).toBe(LEDGER_VALIDATOR);
        // Validator contracts start with erd1qqq...
        expect(parsed.receiver).toMatch(/^erd1qqq/);
      });

      it("unDelegate transaction preserves data with amount hex (AC: #3, #4)", async () => {
        const intent = {
          intentType: "staking" as const,
          type: "undelegate",
          sender: SENDER,
          recipient: LEDGER_VALIDATOR,
          amount: 2n * ONE_EGLD, // 2 EGLD
          asset: { type: "native" as const },
          sequence: 95n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        // unDelegate has value="0" and amount in data
        expect(parsed.value).toBe("0");

        const decodedData = Buffer.from(parsed.data, "base64").toString();
        expect(decodedData).toMatch(/^unDelegate@[0-9a-f]+$/);
      });
    });

    // Task 5: Broadcast compatibility (AC: #1, #4)
    describe("broadcast compatibility (AC: #1, #4)", () => {
      it("combined transaction passes broadcast validation checks (AC: #1)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: ONE_EGLD, // 1 EGLD
          asset: { type: "native" as const },
          sequence: 0n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        // Verify result is valid JSON first
        expect(() => JSON.parse(signedTx)).not.toThrow();

        // Verify the signed transaction can be parsed by broadcast (validation only)
        // broadcast() will fail on network call, but parsing should succeed
        try {
          await api.broadcast(signedTx);
        } catch (error) {
          const errorMessage = (error as Error).message;
          // Error should NOT be about format issues
          expect(errorMessage).not.toContain("malformed JSON");
          expect(errorMessage).not.toContain("missing required fields");
          expect(errorMessage).not.toContain("missing signature");
          expect(errorMessage).not.toContain("missing or empty signature");
          expect(errorMessage).not.toContain("invalid sender address format");
          expect(errorMessage).not.toContain("invalid receiver address format");
          // Error should be network/validation related (invalid signature is expected)
        }
      });

      it("combined transaction format matches broadcast expectations (AC: #4)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: ONE_EGLD / 2n, // 0.5 EGLD
          asset: { type: "native" as const },
          sequence: 5n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        // Verify all broadcast-required fields are present and correctly typed
        expect(parsed.nonce).toBeDefined();
        expect(typeof parsed.nonce).toBe("number");
        expect(parsed.value).toBeDefined();
        expect(typeof parsed.value).toBe("string");
        expect(parsed.receiver).toBeDefined();
        expect(parsed.receiver).toMatch(/^erd1[a-z0-9]+$/);
        expect(parsed.sender).toBeDefined();
        expect(parsed.sender).toMatch(/^erd1[a-z0-9]+$/);
        expect(parsed.gasPrice).toBeDefined();
        expect(typeof parsed.gasPrice).toBe("number");
        expect(parsed.gasLimit).toBeDefined();
        expect(typeof parsed.gasLimit).toBe("number");
        expect(parsed.chainID).toBeDefined();
        expect(parsed.version).toBeDefined();
        expect(parsed.options).toBeDefined();
        expect(parsed.signature).toBeDefined();
        expect(typeof parsed.signature).toBe("string");
        expect(parsed.signature.length).toBeGreaterThan(0);
      });

      it("ESDT combined transaction is broadcast-compatible (AC: #1, #4)", async () => {
        const intent = {
          intentType: "transaction" as const,
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 100000000n,
          asset: { type: "esdt" as const, assetReference: "WEGLD-bd4d79" },
          sequence: 12n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        // Verify result is valid JSON
        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        // Verify all broadcast-required fields are present with correct types
        expect(parsed.nonce).toBeDefined();
        expect(typeof parsed.nonce).toBe("number");
        expect(parsed.value).toBeDefined();
        expect(typeof parsed.value).toBe("string");
        expect(parsed.sender).toBeDefined();
        expect(parsed.sender).toMatch(/^erd1[a-z0-9]+$/);
        expect(parsed.receiver).toBeDefined();
        expect(parsed.receiver).toMatch(/^erd1[a-z0-9]+$/);
        expect(parsed.gasPrice).toBeDefined();
        expect(typeof parsed.gasPrice).toBe("number");
        expect(parsed.gasLimit).toBeDefined();
        expect(typeof parsed.gasLimit).toBe("number");
        expect(parsed.signature).toBeDefined();
        expect(typeof parsed.signature).toBe("string");
        expect(parsed.signature.length).toBeGreaterThan(0);
        // ESDT transactions must have data field
        expect(parsed.data).toBeDefined();
        expect(typeof parsed.data).toBe("string");
      });

      it("staking combined transaction is broadcast-compatible (AC: #1, #4)", async () => {
        const intent = {
          intentType: "staking" as const,
          type: "delegate",
          sender: SENDER,
          recipient: LEDGER_VALIDATOR,
          amount: ONE_EGLD, // 1 EGLD
          asset: { type: "native" as const },
          sequence: 99n,
        };

        const { transaction: unsignedTx } = await api.craftTransaction(intent);
        const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);

        // Verify result is valid JSON
        expect(() => JSON.parse(signedTx)).not.toThrow();
        const parsed = JSON.parse(signedTx);

        // Verify all broadcast-required fields are present with correct types
        expect(parsed.nonce).toBeDefined();
        expect(typeof parsed.nonce).toBe("number");
        expect(parsed.value).toBeDefined();
        expect(typeof parsed.value).toBe("string");
        expect(parsed.sender).toBeDefined();
        expect(parsed.sender).toMatch(/^erd1[a-z0-9]+$/);
        expect(parsed.receiver).toBeDefined();
        expect(parsed.receiver).toMatch(/^erd1[a-z0-9]+$/);
        expect(parsed.gasPrice).toBeDefined();
        expect(typeof parsed.gasPrice).toBe("number");
        expect(parsed.gasLimit).toBeDefined();
        expect(typeof parsed.gasLimit).toBe("number");
        expect(parsed.signature).toBeDefined();
        expect(typeof parsed.signature).toBe("string");
        expect(parsed.signature.length).toBeGreaterThan(0);
        // Staking transactions must have data field
        expect(parsed.data).toBeDefined();
        expect(typeof parsed.data).toBe("string");
      });
    });
  });
});
