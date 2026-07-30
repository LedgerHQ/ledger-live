import BigNumber from "bignumber.js";
import hederaCoinConfig from "../config";
import { MAINNET_TEST_ACCOUNTS } from "../test/fixtures/account.fixture";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { hgraphClient } from "./hgraph";

describe("hgraphClient", () => {
  const coinConfig = getMockedConfig();

  beforeAll(() => {
    hederaCoinConfig.setCoinConfig(() => coinConfig);
  });

  describe("getLatestIndexedConsensusTimestamp", () => {
    it("returns a positive BigNumber", async () => {
      const ts = await hgraphClient.getLatestIndexedConsensusTimestamp({
        configOrCurrencyId: coinConfig,
      });
      expect(BigNumber.isBigNumber(ts)).toBe(true);
      expect(ts.isPositive()).toBe(true);
    });
  });

  describe("getERC20Balances", () => {
    it("returns entries with all required fields for an account with ERC20 tokens", async () => {
      const balances = await hgraphClient.getERC20Balances({
        configOrCurrencyId: coinConfig,
        address: MAINNET_TEST_ACCOUNTS.withTokens.accountIdWithErc20,
      });
      expect(balances.length).toBeGreaterThan(0);
      for (const b of balances) {
        expect(typeof b.token_id).toBe("number");
        expect(typeof b.balance).toBe("number");
        expect(typeof b.balance_timestamp).toBe("number");
        expect(typeof b.created_timestamp).toBe("number");
      }
    });

    it("returns empty array for account with no ERC20 tokens", async () => {
      const balances = await hgraphClient.getERC20Balances({
        configOrCurrencyId: coinConfig,
        address: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
      });
      expect(balances).toEqual([]);
    });
  });

  describe("getERC20Transfers", () => {
    const address = MAINNET_TEST_ACCOUNTS.withTokens.accountIdWithErc20;
    // Must come from live balances: the fixture's erc20Token belongs to
    // withTokens.accountId, and pairing it with this address returns zero transfers.
    let tokenEvmAddresses: string[];

    beforeAll(async () => {
      const balances = await hgraphClient.getERC20Balances({
        configOrCurrencyId: coinConfig,
        address,
      });
      tokenEvmAddresses = balances
        .map(b => b.token_evm_address)
        .filter((addr): addr is string => addr !== null);
    });

    it("returns transfers with required fields for a known ERC20 account", async () => {
      expect(tokenEvmAddresses.length).toBeGreaterThan(0);

      const transfers = await hgraphClient.getERC20Transfers({
        configOrCurrencyId: coinConfig,
        address,
        tokenEvmAddresses,
        fetchAllPages: false,
        limit: 5,
      });
      expect(transfers.length).toBeGreaterThan(0);
      expect(transfers.length).toBeLessThanOrEqual(5);
      for (const t of transfers) {
        expect(typeof t.token_id).toBe("number");
        expect(typeof t.token_evm_address).toBe("string");
        expect(["transfer", "mint", "burn"]).toContain(t.transfer_type);
        expect(typeof t.transaction_hash).toBe("string");
      }
    });

    it("continues from the same cursor when paging past the limit with fetchAllPages", async () => {
      const limit = 2;
      const [paged, all] = await Promise.all([
        hgraphClient.getERC20Transfers({
          configOrCurrencyId: coinConfig,
          address,
          tokenEvmAddresses,
          fetchAllPages: false,
          limit,
        }),
        hgraphClient.getERC20Transfers({
          configOrCurrencyId: coinConfig,
          address,
          tokenEvmAddresses,
          fetchAllPages: true,
          limit,
        }),
      ]);

      expect(paged.length).toBe(limit);
      // depends on this account holding more than `limit` transfers
      expect(all.length).toBeGreaterThan(limit);
      // position-wise, not by uniqueness: one transaction can carry several transfers,
      // so transaction_hash legitimately repeats across rows
      expect(all.slice(0, limit).map(t => t.transaction_hash)).toEqual(
        paged.map(t => t.transaction_hash),
      );
    });
  });

  describe("getERC20TransfersByTimestampRange", () => {
    // Range around the mint/burn cursor from api/index.integ.test.ts
    const START_TS = "1749584380.000000000";
    const END_TS = "1749784382.000000000";

    it("returns transfers within the specified timestamp range", async () => {
      const transfers = await hgraphClient.getERC20TransfersByTimestampRange({
        configOrCurrencyId: coinConfig,
        startTimestamp: START_TS,
        endTimestamp: END_TS,
        limit: 10,
      });

      // guard: this window is known to contain mint/burn activity
      expect(transfers.length).toBeGreaterThan(0);

      const normalizedStart = BigInt(START_TS.replace(".", ""));
      const normalizedEnd = BigInt(END_TS.replace(".", ""));
      for (const t of transfers) {
        expect(BigInt(t.consensus_timestamp)).toBeGreaterThanOrEqual(normalizedStart);
        expect(BigInt(t.consensus_timestamp)).toBeLessThan(normalizedEnd);
      }
    });
  });
});
