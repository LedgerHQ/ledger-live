import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { fromAccountRaw } from "@ledgerhq/ledger-wallet-framework/serialization";
import type { DerivationMode, CryptoAssetsStore } from "@ledgerhq/types-live";
import { loadAccountDelegation } from "./bakers";
import type { TezosAccountRaw } from "./types";

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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "0",
    } as CryptoAssetsStore);
  });

  test("load account baker info", async () => {
    const account = await fromAccountRaw(accountTZrevealedDelegating);
    const delegation = await loadAccountDelegation(account);
    expect(delegation).toBe(null);
  });
});
