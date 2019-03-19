// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import "../implement-libcore";

import { BigNumber } from "bignumber.js";
import { reduce, mergeMap } from "rxjs/operators";
import type { Account } from "@ledgerhq/live-common/lib/types";

import signAndBroadcast from "@ledgerhq/live-common/lib/libcore/signAndBroadcast";
import { syncAccount } from "@ledgerhq/live-common/lib/libcore/syncAccount";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";

const xpub = process.argv[2];

if (!xpub) {
  console.error("usage: node script.js <xpub>");
  process.exit(1);
}

const accountAbandon: $Exact<Account> = {
  name: xpub,
  xpub,
  seedIdentifier: xpub,
  id: "libcore:1:bitcoin:" + xpub + ":",
  derivationMode: "",
  currency: getCryptoCurrencyById("bitcoin"),
  unit: getCryptoCurrencyById("bitcoin").units[0],
  index: 0,
  freshAddress: "",
  freshAddressPath: "44'/0'/0'/0/0",
  lastSyncDate: new Date(0),
  blockHeight: 0,
  balance: new BigNumber(0),
  operations: [],
  pendingOperations: []
};

syncAccount(accountAbandon)
  .pipe(
    reduce(
      (account: Account, f: Account => Account) => f(account),
      accountAbandon
    ),
    mergeMap((account: Account) =>
      signAndBroadcast({
        accountId: account.id,
        blockHeight: account.blockHeight,
        currencyId: account.currency.id,
        derivationMode: account.derivationMode,
        seedIdentifier: account.seedIdentifier,
        xpub: account.xpub || "",
        index: account.index,
        transaction: {
          amount: new BigNumber(1000),
          recipient: account.freshAddress,
          feePerByte: new BigNumber(1)
        },
        deviceId: ""
      })
    )
  )
  .subscribe({
    next: e => {
      console.log(e);
    },
    error: e => {
      console.error(e);
      process.exit(1);
    },
    complete: () => {}
  });
