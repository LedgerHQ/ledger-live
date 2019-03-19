// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import "../implement-libcore";

import { BigNumber } from "bignumber.js";
import { first, mergeMap } from "rxjs/operators";
import type { Account } from "@ledgerhq/live-common/lib/types";

import signAndBroadcast from "@ledgerhq/live-common/lib/libcore/signAndBroadcast";
import { scanAccountsOnDevice } from "@ledgerhq/live-common/lib/libcore/scanAccountsOnDevice";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";

scanAccountsOnDevice(getCryptoCurrencyById("bitcoin"), "")
  .pipe(
    first(),
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
