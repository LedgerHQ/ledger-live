import { AccountRaw } from "@ledgerhq/types-live";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import accountModel from "./accountModel";

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

// Accounts stored before the migrations were introduced sit at version 1
// (only the 2018 account-id migration existed at the time).
const decodeLegacy = (data: AccountRaw) => accountModel.decode({ data, version: 1 });

describe("accountModel migrations", () => {
  describe("aptos derivation path hardening", () => {
    it("hardens the 'change' and 'address_index' levels", async () => {
      const [account] = await decodeLegacy(aptosRaw("44'/637'/0'/0/0"));
      expect(account.freshAddressPath).toBe("44'/637'/0'/0'/0'");
    });

    it("hardens non-zero account, change and address_index levels", async () => {
      const [account] = await decodeLegacy(aptosRaw("44'/637'/12'/3/45"));
      expect(account.freshAddressPath).toBe("44'/637'/12'/3'/45'");
    });

    it("leaves an already hardened path untouched", async () => {
      const path = "44'/637'/0'/0'/0'";
      const [account] = await decodeLegacy(aptosRaw(path));
      expect(account.freshAddressPath).toBe(path);
    });

    it("does not touch non-aptos accounts sharing a similar path shape", async () => {
      const path = "44'/60'/0'/0/0";
      const [account] = await decodeLegacy({
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
    const cryptoOrgRaw = (extra: Partial<AccountRaw> = {}): AccountRaw =>
      ({
        ...baseRaw,
        id: "js:2:crypto_org:cosmos1address:",
        freshAddress: "cosmos1address",
        freshAddressPath: "44'/394'/0'/0/0",
        currencyId: "crypto_org",
        ...extra,
      }) as AccountRaw;

    it("initialises cosmosResources when missing", async () => {
      const [account] = await decodeLegacy(cryptoOrgRaw());
      const { cosmosResources } = account as typeof account & {
        cosmosResources: Record<string, unknown>;
      };
      expect(cosmosResources).toBeDefined();
      expect(cosmosResources.delegations).toEqual([]);
      expect(cosmosResources.withdrawAddress).toBe("cosmos1address");
    });
  });

  it("exposes a version matching the number of migrations", () => {
    expect(accountModel.version).toBe(3);
  });
});
