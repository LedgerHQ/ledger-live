// @flow
/* eslint-disable no-console */
import { first, tap, filter, map, take } from "rxjs/operators";
import { from } from "rxjs";
import { BigNumber } from "bignumber.js";
import commandLineArgs from "command-line-args";
import { delay } from "@ledgerhq/live-common/lib/promise";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import type { Exchange } from "@ledgerhq/live-common/lib/swap/types";
import { initSwap } from "@ledgerhq/live-common/lib/swap";
import { getExchangeRates } from "@ledgerhq/live-common/lib/swap";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";

import invariant from "invariant";

type SwapJobOpts = ScanCommonOpts & {
  amount: string,
  useAllAmount: boolean,
  _unknown: any,
  deviceId: string,
};

const exec = async (opts: SwapJobOpts) => {
  const { amount, useAllAmount, deviceId = "" } = opts;

  invariant(amount, "amount in satoshis is needed");
  invariant(opts._unknown, "second account information is missing");

  //Remove suffix from arguments before passing them to sync.
  const secondAccountOpts: ScanCommonOpts = commandLineArgs(scanCommonOpts, {
    argv: opts._unknown.map((a, i) => (i % 2 ? a : a.replace("_2", ""))),
  });

  const fromAccount = await scan(opts).pipe(take(1)).toPromise();
  const formattedAmount = formatCurrencyUnit(
    getAccountUnit(fromAccount),
    fromAccount.balance,
    {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    }
  );

  console.log(
    "total balance ",
    fromAccount.balance.toString(),
    ` [ ${formattedAmount} ]`
  );
  console.log("OPEN RECIPIENT CURRENCY APP");
  await delay(10000);

  const toAccount = await scan(secondAccountOpts).pipe(take(1)).toPromise();
  console.log(toAccount.id);

  const bridge = getAccountBridge(fromAccount);
  let transaction = bridge.createTransaction(fromAccount);

  if (!useAllAmount) {
    transaction = bridge.updateTransaction(transaction, {
      amount: BigNumber(amount),
    });
  } else {
    const amount = await bridge.estimateMaxSpendable({
      account: fromAccount,
      transaction,
    });
    transaction = bridge.updateTransaction(transaction, { amount });
  }

  const exchange: Exchange = {
    fromAccount,
    fromParentAccount: undefined,
    toAccount,
    toParentAccount: undefined,
  };

  const exchangeRates = await getExchangeRates(exchange, transaction);
  console.log("Got rates", exchangeRates[0]);

  console.log("OPEN EXCHANGE APP");
  await delay(10000);

  const initSwapResult = await initSwap(
    exchange,
    exchangeRates[0],
    transaction,
    deviceId,
    true
  )
    .pipe(
      tap((e) => console.log(e)),
      filter((e) => e.type === "init-swap-result"),
      map((e) => e.initSwapResult)
    )
    .toPromise();

  transaction = initSwapResult.transaction;

  console.log(
    "Giving the device some time to switch to the currency app for signing"
  );
  await delay(20000);
  const signedOperation = await bridge
    .signOperation({ account: fromAccount, deviceId, transaction })
    .pipe(
      tap((e) => console.log(e)),
      first((e) => e.type === "signed"),
      map((e) => e.signedOperation)
    )
    .toPromise();
  console.log("broadcasting");
  const operation = await bridge.broadcast({
    account: fromAccount,
    signedOperation,
  });

  console.log({ operation });
};

export default {
  description:
    "Perform an arbitrary swap between two currencies on the same seed",
  args: [
    {
      name: "mock",
      alias: "m",
      type: Boolean,
      desc: "Whether or not to use the real backend or a mocked version",
    },
    {
      name: "amount",
      alias: "a",
      type: Number,
      desc: "Amount in satoshi units to send",
    },
    {
      name: "useAllAmount",
      alias: "u",
      type: Boolean,
      desc: "Attempt to send all using the emulated max amount calculation",
    },
    ...scanCommonOpts,
  ],
  job: (opts: SwapJobOpts) => from(exec(opts)),
};
