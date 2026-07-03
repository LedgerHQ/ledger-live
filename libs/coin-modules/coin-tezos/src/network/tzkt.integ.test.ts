import coinConfig, { type TezosCoinConfig } from "../config";
import api from "./tzkt";

/**
 * Mainnet integration tests for multi-asset FA2 support (LIVE-29210).
 *
 * Uses tz1ZB8hpQJZdQeEPc3uG2cL1NXwLTPkqeAD6 which holds multiple tokens
 * on the Wrapped Tokens Contract (KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ).
 *
 * Explorer: https://tzkt.io/tz1ZB8hpQJZdQeEPc3uG2cL1NXwLTPkqeAD6/balances
 */

const MULTI_ASSET_HOLDER = "tz1ZB8hpQJZdQeEPc3uG2cL1NXwLTPkqeAD6";
const WRAPPED_CONTRACT = "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ";

const mainnetConfig = (): TezosCoinConfig =>
  ({
    status: { type: "active" },
    baker: { url: "https://tezos-bakers.api.live.ledger.com" },
    explorer: { url: "https://xtz-tzkt-explorer.api.vault.ledger.com", maxTxQuery: 100 },
    node: { url: "https://xtz-node.api.vault.ledger.com" },
    fees: {
      minGasLimit: 0,
      minRevealGasLimit: 0,
      minStorageLimit: 0,
      minFees: 0,
      minEstimatedFees: 0,
    },
  }) as TezosCoinConfig;

describe("TzKT multi-asset FA2 — mainnet", () => {
  let originalGetCoinConfig: () => TezosCoinConfig;

  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(mainnetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  describe("getTokensBalances", () => {
    it("returns balances for multiple tokenIds on the same contract", async () => {
      const balances = await api.getTokensBalances(MULTI_ASSET_HOLDER);

      const tokenIds = new Set(
        balances
          .filter(b => b.token.contract.address === WRAPPED_CONTRACT)
          .map(b => b.token.tokenId),
      );

      // On-chain fact: this account received tokens with at least tokenIds 1, 2, 7
      expect(tokenIds.has("1")).toBe(true);
      expect(tokenIds.has("2")).toBe(true);
      expect(tokenIds.has("7")).toBe(true);
    });

    it("returns only the requested tokenId when filter is provided", async () => {
      const balances = await api.getTokensBalances(MULTI_ASSET_HOLDER, {
        contractAddress: WRAPPED_CONTRACT,
        tokenId: 1,
      });

      expect(balances).toHaveLength(1);
      expect(balances[0].token.tokenId).toBe("1");
      expect(balances[0].token.contract.address).toBe(WRAPPED_CONTRACT);
      expect(balances[0].token.standard).toBe("fa2");
    });
  });

  describe("getAccountTokenTransfers", () => {
    it("returns a known transfer with tokenId=11 at level 13371040", async () => {
      // Pin to the exact block level so the result set is small and deterministic.
      const transfers = await api.getAccountTokenTransfers(MULTI_ASSET_HOLDER, {
        "level.ge": 13371040,
        "level.lt": 13371041,
        limit: 10,
      });

      const transfer = transfers.find(
        t =>
          t.token.contract.address === WRAPPED_CONTRACT &&
          t.token.tokenId === "11" &&
          t.transactionId === 2655251752550400,
      )!;

      expect(transfer.amount).toBe("18423705864886566");
      expect(transfer.from?.address).toBe(MULTI_ASSET_HOLDER);
      expect(transfer.to?.address).toBe("KT1V5XKmeypanMS9pR65REpqmVejWBZURuuT");
      expect(transfer.hash).toBe("ooMtaw5H7dtrgAyW5ky4jFzhQjayWn6La2h3BadHvZd56p6jm9g");
    });
  });
});
