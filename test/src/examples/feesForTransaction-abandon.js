// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import "../implement-libcore";

import { BigNumber } from "bignumber.js";
import { reduce, mergeMap } from "rxjs/operators";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { getFeesForTransaction } from "@ledgerhq/live-common/lib/libcore/getFeesForTransaction";
import { syncAccount } from "@ledgerhq/live-common/lib/libcore/syncAccount";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";

// TODO use abandon testnet for an interesting example

const accountAbandon: $Exact<Account> = {
  name: "btcAbandon0",
  xpub:
    "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj",
  seedIdentifier: "abandon",
  id:
    "libcore:1:bitcoin:xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj:",
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
      getFeesForTransaction({
        account,
        transaction: {
          amount: new BigNumber(1000),
          recipient: account.freshAddress,
          feePerByte: new BigNumber(1)
        }
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
