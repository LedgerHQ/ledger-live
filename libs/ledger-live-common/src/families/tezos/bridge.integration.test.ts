import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { fromAccountRaw } from "../../account";
import { loadAccountDelegation, listBakers } from "./bakers";
import whitelist from "./bakers.whitelist-default";

import { AmountRequired, NotEnoughBalance } from "@ledgerhq/errors";
import type { DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

import tezosScanAccounts1 from "./datasets/tezos.scanAccounts.1";

export const accountTZrevealedDelegating = makeAccount(
  "TZrevealedDelegating",
  "02389ffd73423626894cb151416e51c72ec285376673daf83545eb5edb45b261ce",
  "tz1boBHAVpwcvKkNFAQHYr7mjxAz1PpVgKq7",
  "tezbox"
);
const accountTZnew = makeAccount(
  "TZnew",
  "02a9ae8b0ff5f9a43565793ad78e10db6f12177d904d208ada591b8a5b9999e3fd",
  "tz1VSichevvJSNkSSntgwKDKikWNB6iqNJii",
  "tezbox"
);
const accountTZnotRevealed = makeAccount(
  "TZnotRevealed",
  "020162dc75ad3c2b6e097d15a1513033c60d8a033f2312ff5a6ead812228d9d653",
  "tz1PWFt4Ym6HedY78MgUP2kVDtSampGwprs5",
  "tezosbip44h"
);
const accountTZRevealedNoDelegate = makeAccount(
  "TZRevealedNoDelegate",
  "029bfe70b3e94ff23623f6c42f6e081a9ca8cc78f74b0d8da58f0d4cdc41c33c1a",
  "tz1YkAjh5mm5gJ5u3VbFLEtpAG7cFo7PfCux",
  "tezosbip44h"
);

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    tezos: {
      FIXME_ignoreOperationFields: ["blockHeight"],
      scanAccounts: [tezosScanAccounts1],
      accounts: [
        {
          raw: accountTZrevealedDelegating,
          transactions: [
            {
              name: "No amount",
              transaction: (t) => ({
                ...t,
                recipient: "tz1VSichevvJSNkSSntgwKDKikWNB6iqNJii",
              }),
              expectedStatus: {
                errors: { amount: new AmountRequired() },
                warnings: {},
              },
            },
          ],
        },
        {
          raw: accountTZRevealedNoDelegate,
          transactions: [],
        },
        {
          raw: accountTZnotRevealed,
          transactions: [
            {
              name: "send more than min allowed",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance.minus("100"),
                recipient: "tz1VSichevvJSNkSSntgwKDKikWNB6iqNJii",
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
            {
              name: "Send max",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance,
                useAllAmount: true,
                recipient: "tz1VSichevvJSNkSSntgwKDKikWNB6iqNJii",
              }),
              expectedStatus: (account) => {
                return {
                  amount: account.balance,
                };
              },
            },
            {
              name: "Amount > spendablebalance",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance,
                recipient: accountTZnew.freshAddress,
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
          ],
        },
        {
          raw: accountTZnew,
          test: (expect, account) => {
            expect(account.operations).toEqual([]);
          },
          transactions: [],
        },
      ],
    },
  },
};

function makeAccount(name, pubkey, address, derivationMode) {
  return {
    id: `js:2:tezos:${pubkey}:${derivationMode}`,
    seedIdentifier: address,
    name: "Tezos " + name,
    derivationMode,
    index: 0,
    freshAddress: address,
    freshAddressPath: "",
    freshAddresses: [],
    blockHeight: 0,
    operations: [],
    pendingOperations: [],
    currencyId: "tezos",
    unitMagnitude: 6,
    lastSyncDate: "",
    balance: "0",
    xpub: pubkey,
    subAccounts: [],
  };
}

testBridge(dataset);

describe("tezos bakers", () => {
  // FIXME Flaky test that will fail every time a Tezos baker is discontinued
  test("getting the bakers", async () => {
    const list = await listBakers(whitelist);
    expect(list.map((o) => o.address)).toEqual(whitelist);
  });
  // TODO we'll need two accounts to test diff cases
  test("load account baker info", async () => {
    const account = fromAccountRaw(accountTZrevealedDelegating);
    const delegation = await loadAccountDelegation(account);
    expect(delegation).toBe(null);
  });
});
