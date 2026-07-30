import hederaCoinConfig from "../config";
import { MAINNET_TEST_ACCOUNTS } from "../test/fixtures/account.fixture";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { rpcClient } from "./rpc";
import { apiClient } from "./api";

describe("apiClient", () => {
  const coinConfig = getMockedConfig();

  beforeAll(() => {
    hederaCoinConfig.setCoinConfig(() => coinConfig);
  });

  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  describe("getLatestBlock", () => {
    it("returns a block with a from timestamp", async () => {
      const block = await apiClient.getLatestBlock({ configOrCurrencyId: coinConfig });

      expect(block).not.toBeUndefined();
      expect(typeof block.timestamp.from).toBe("string");
      expect(block.timestamp.from.length).toBeGreaterThan(0);
    });
  });

  describe("getNetworkFees", () => {
    it("returns a fee schedule with entries for known transaction types", async () => {
      const fees = await apiClient.getNetworkFees({ configOrCurrencyId: coinConfig });

      expect(Array.isArray(fees.fees)).toBe(true);
      expect(fees.fees.length).toBeGreaterThan(0);
      expect(typeof fees.timestamp).toBe("string");

      for (const fee of fees.fees) {
        expect(typeof fee.gas).toBe("number");
        expect(typeof fee.transaction_type).toBe("string");
      }

      const contractCallFee = fees.fees.find(f => f.transaction_type === "ContractCall");
      expect(contractCallFee).not.toBeUndefined();
    });
  });

  describe("getNode", () => {
    it("returns node info for a known node id", async () => {
      const node = await apiClient.getNode({ configOrCurrencyId: coinConfig, nodeId: 0 });

      expect(node).toMatchObject({
        node_id: 0,
        node_account_id: expect.stringMatching(/.+/),
        max_stake: expect.any(Number),
        min_stake: expect.any(Number),
      });
    });

    it("returns null for a non-existent node id", async () => {
      const node = await apiClient.getNode({ configOrCurrencyId: coinConfig, nodeId: 999999 });
      expect(node).toBeNull();
    });
  });

  describe("getAccount", () => {
    it("returns account info for a known account", async () => {
      const account = await apiClient.getAccount({
        configOrCurrencyId: coinConfig,
        address: "0.0.12345",
      });

      expect(typeof account.account).toBe("string");
      expect(typeof account.evm_address).toBe("string");
      expect(account.evm_address).toMatch(/^0x[0-9a-f]{40}$/i);
      expect(typeof account.balance.balance).toBe("number");
      expect(Array.isArray(account.balance.tokens)).toBe(true);
    });
  });

  describe("getAccountTransactions", () => {
    it("returns transactions for a known account", async () => {
      const { transactions, nextCursor } = await apiClient.getAccountTransactions({
        configOrCurrencyId: coinConfig,
        address: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
        pagingToken: null,
        limit: 5,
        order: "desc",
        fetchAllPages: false,
      });

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions.length).toBeLessThanOrEqual(5);
      for (const tx of transactions) {
        expect(typeof tx.consensus_timestamp).toBe("string");
        expect(typeof tx.transaction_hash).toBe("string");
        expect(typeof tx.name).toBe("string");
      }
      expect(nextCursor === null || typeof nextCursor === "string").toBe(true);
    });
  });

  describe("getAccountTokens", () => {
    it("returns HTS token holdings for an account with tokens", async () => {
      const tokens = await apiClient.getAccountTokens({
        configOrCurrencyId: coinConfig,
        address: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
      });

      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
      for (const t of tokens) {
        expect(typeof t.token_id).toBe("string");
        expect(typeof t.balance).toBe("number");
      }
    });

    it("returns empty array for an account with no HTS tokens", async () => {
      const tokens = await apiClient.getAccountTokens({
        configOrCurrencyId: coinConfig,
        address: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
      });

      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBe(0);
    });
  });

  describe("getLatestTransaction", () => {
    it("returns the most recent transaction before a given date", async () => {
      const before = new Date();
      const tx = await apiClient.getLatestTransaction({ configOrCurrencyId: coinConfig, before });

      expect(typeof tx.consensus_timestamp).toBe("string");
      expect(typeof tx.transaction_hash).toBe("string");
      expect(typeof tx.name).toBe("string");

      const txSeconds = Number.parseFloat(tx.consensus_timestamp);
      expect(txSeconds).toBeLessThanOrEqual(before.getTime() / 1000);
    });
  });

  describe("getNodes", () => {
    it("returns a list of network nodes", async () => {
      const { nodes, nextCursor } = await apiClient.getNodes({
        configOrCurrencyId: coinConfig,
        limit: 5,
        fetchAllPages: false,
      });

      expect(Array.isArray(nodes)).toBe(true);
      expect(nodes.length).toBeGreaterThan(0);
      for (const node of nodes) {
        expect(typeof node.node_id).toBe("number");
        expect(typeof node.node_account_id).toBe("string");
        expect(typeof node.max_stake).toBe("number");
      }
      expect(nextCursor === null || typeof nextCursor === "string").toBe(true);
    });
  });
});
