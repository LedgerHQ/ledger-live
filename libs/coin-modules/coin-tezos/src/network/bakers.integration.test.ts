import { DerivationMode } from "@ledgerhq/types-live";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization";
import { TezosAccountRaw } from "../types";
import { loadAccountDelegation, listBakers } from "../network/bakers";
import whitelist from "../network/bakers.whitelist-default";
import coinConfig, { TezosCoinConfig } from "../config";

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
    coinConfig.setCoinConfig(
      (): TezosCoinConfig => ({
        status: { type: "active" },
        baker: {
          url: "https://tezos-bakers.api.live.ledger.com",
        },
        explorer: {
          url: "https://xtz-tzkt-explorer.api.live.ledger.com",
          maxTxQuery: 100,
        },
        node: {
          url: "https://xtz-node.api.live.ledger.com",
        },
      }),
    );
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
    const account = fromAccountRaw(accountTZrevealedDelegating);
    const delegation = await loadAccountDelegation(account);
    expect(delegation).toBe(null);
  });
});
