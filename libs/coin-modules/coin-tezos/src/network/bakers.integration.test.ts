import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { DerivationMode, type CryptoAssetsStore } from "@ledgerhq/types-live";
import coinConfig, { TezosCoinConfig } from "../config";
import { loadAccountDelegation, listBakers } from "../network/bakers";
import whitelist from "../network/bakers.whitelist-default";
import { mockConfig } from "../test/config";
import { TezosAccountRaw } from "../types";

function makeAccountRaw(
  name: string,
  pubkey: string,
  address: string,
  derivationMode: DerivationMode,
): TezosAccountRaw {
  return {
    id: `js:2:tezos:${pubkey}:${derivationMode}`,
    seedIdentifier: address,
    name: "Tezos " + name,
    derivationMode,
    index: 0,
    freshAddress: address,
    freshAddressPath: "",
    blockHeight: 0,
    operations: [],
    pendingOperations: [],
    currencyId: "tezos",
    lastSyncDate: "",
    balance: "0",
    xpub: pubkey,
    subAccounts: [],
    tezosResources: { revealed: true, counter: 0 },
  };
}

const accountTZrevealedDelegating = makeAccountRaw(
  "TZrevealedDelegating",
  "02389ffd73423626894cb151416e51c72ec285376673daf83545eb5edb45b261ce",
  "tz1boBHAVpwcvKkNFAQHYr7mjxAz1PpVgKq7",
  "tezbox",
);

describe("tezos bakers", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
    // Initialize CryptoAssetsStore for integration tests
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "0",
    } as CryptoAssetsStore);
  });

  test("atleast 10 whitelisted bakers are online", async () => {
    const bakers = await listBakers(whitelist);
    const retrievedAddresses = bakers.map(o => o.address);
    let available = 0;
    for (const whitelisted of whitelist) {
      if (retrievedAddresses.includes(whitelisted)) {
        available++;
      } else {
        console.warn(`Baker ${whitelisted} no longer online !`);
      }
    }
    expect(available).toBeGreaterThan(10);
  });

  // TODO we'll need two accounts to test diff cases
  test("load account baker info", async () => {
    const account = await fromAccountRaw(accountTZrevealedDelegating);
    const delegation = await loadAccountDelegation(account);
    expect(delegation).toBe(null);
  });
});
