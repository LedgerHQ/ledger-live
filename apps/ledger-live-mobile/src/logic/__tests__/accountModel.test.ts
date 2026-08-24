import type { AccountRaw } from "@ledgerhq/types-live";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import accountModel from "../accountModel";

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

const baseRaw = {
  seedIdentifier: "test-seed",
  derivationMode: "" as AccountRaw["derivationMode"],
  index: 0,
  balance: "0",
  blockHeight: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date().toISOString(),
};

const aptosRaw = (freshAddressPath: string): AccountRaw =>
  ({
    ...baseRaw,
    id: "js:2:aptos:0x1234567890abcdef:",
    freshAddress: "0x1234567890abcdef",
    freshAddressPath,
    currencyId: "aptos",
  }) as AccountRaw;

// Mobile hardcodes the stored version to 0 (see actions/accounts.ts), so every
// migration replays on each load. Both are idempotent, which the tests below cover.
const decodeStored = (data: AccountRaw) => accountModel.decode({ data, version: 0 });

describe("accountModel migrations", () => {
  describe("aptos derivation path hardening", () => {
    it("hardens the 'change' and 'address_index' levels", async () => {
      const [account] = await decodeStored(aptosRaw("44'/637'/0'/0/0"));
      expect(account.freshAddressPath).toBe("44'/637'/0'/0'/0'");
    });

    it("hardens non-zero account, change and address_index levels", async () => {
      const [account] = await decodeStored(aptosRaw("44'/637'/12'/3/45"));
      expect(account.freshAddressPath).toBe("44'/637'/12'/3'/45'");
    });

    it("leaves an already hardened path untouched", async () => {
      const path = "44'/637'/0'/0'/0'";
      const [account] = await decodeStored(aptosRaw(path));
      expect(account.freshAddressPath).toBe(path);
    });

    it("does not touch non-aptos accounts sharing a similar path shape", async () => {
      const path = "44'/60'/0'/0/0";
      const [account] = await decodeStored({
        ...baseRaw,
        id: "js:2:ethereum:0xabc:",
        freshAddress: "0xabc",
        freshAddressPath: path,
        currencyId: "ethereum",
      } as AccountRaw);
      expect(account.freshAddressPath).toBe(path);
    });
  });

  describe("crypto_org cosmosResources fallback", () => {
    it("initialises cosmosResources when missing", async () => {
      const [account] = await decodeStored({
        ...baseRaw,
        id: "js:2:crypto_org:cosmos1address:",
        freshAddress: "cosmos1address",
        freshAddressPath: "44'/394'/0'/0/0",
        currencyId: "crypto_org",
      } as AccountRaw);
      const { cosmosResources } = account as typeof account & {
        cosmosResources: Record<string, unknown>;
      };
      expect(cosmosResources).toBeDefined();
      expect(cosmosResources.delegations).toEqual([]);
      expect(cosmosResources.withdrawAddress).toBe("cosmos1address");
    });
  });

  it("exposes a version matching the number of migrations", () => {
    expect(accountModel.version).toBe(2);
  });
});
