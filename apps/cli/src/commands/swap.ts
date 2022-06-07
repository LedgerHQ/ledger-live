/* eslint-disable no-console */
import { first, tap, filter, map, take } from "rxjs/operators";
import {
  accountWithMandatoryTokens,
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import { getAbandonSeedAddress, findTokenById } from "@ledgerhq/cryptoassets";
import { from } from "rxjs";
import { BigNumber } from "bignumber.js";
import commandLineArgs from "command-line-args";
import { delay } from "@ledgerhq/live-common/lib/promise";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import type {
  Exchange,
  ExchangeRate,
  InitSwapResult,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import { initSwap } from "@ledgerhq/live-common/lib/exchange/swap";
import { getExchangeRates } from "@ledgerhq/live-common/lib/exchange/swap";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import invariant from "invariant";
import {
  Account,
  SignedOperation,
  SubAccount,
} from "@ledgerhq/live-common/lib/types";
type SwapJobOpts = ScanCommonOpts & {
  amount: string;
  useAllAmount: boolean;
  useFloat: boolean;
  wyreUserId?: string;
  _unknown: any;
  deviceId: string;
  tokenId: string;
};

const exec = async (opts: SwapJobOpts) => {
  const {
    amount,
    useAllAmount,
    tokenId,
    useFloat,
    wyreUserId = "",
    deviceId = "",
  } = opts;
  invariant(
    amount || useAllAmount,
    `✖ amount in satoshis is needed or --useAllAmount `
  );
  invariant(opts._unknown, `✖ second account information is missing`);
  invariant(
    !wyreUserId || wyreUserId.length === 14,
    "Provider wyre user id is not valid"
  );

  //Remove suffix from arguments before passing them to sync.
  const secondAccountOpts = commandLineArgs(
    [
      ...scanCommonOpts,
      {
        name: "tokenId",
        alias: "t",
        type: String,
        desc: "use a token account children of the account",
      },
    ],
    {
      argv: opts._unknown.map((a, i) => (i % 2 ? a : a.replace("_2", ""))),
    }
  ) as ScanCommonOpts & { tokenId: string };

  console.log("• Open the source currency app");
  await delay(8000);
  let fromParentAccount: Account | null = null;
  let fromAccount: Account | SubAccount | undefined = await scan(opts)
    .pipe(take(1))
    .toPromise();
  invariant(fromAccount, `✖ No account found, is the right currency app open?`);
  if (!fromAccount) {
    throw new Error(`✖ No account found, is the right currency app open?`);
  }

  //Are we asking for a token account?
  if (tokenId) {
    const token = findTokenById(tokenId);
    invariant(token, `✖ No token currency found with id ${tokenId}`);
    if (!token) throw new Error(`✖ No token currency found with id ${tokenId}`);
    const subAccounts =
      accountWithMandatoryTokens(fromAccount, [token]).subAccounts || [];
    const subAccount = subAccounts.find((t) => {
      const currency = getAccountCurrency(t);
      return tokenId === currency.id;
    });
    // We have a token account, keep track of both now;
    fromParentAccount = fromAccount;
    fromAccount = subAccount;
    invariant(
      fromAccount,
      `✖ No account found, is the right currency app open?`
    );
    if (!fromAccount) {
      throw new Error(`✖ No account found, is the right currency app open?`);
    }
  }

  if (fromParentAccount) {
    console.log("\t:parentId:\t\t", fromParentAccount.id);
  }

  console.log("\t:id:\t\t", fromAccount.id);
  const formattedAmount = formatCurrencyUnit(
    getAccountUnit(fromAccount),
    fromAccount.balance,
    {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    }
  );

  if (fromAccount.type !== "ChildAccount") {
    console.log(
      "\t:balance:\t",
      fromAccount.spendableBalance.toString(),
      ` [ ${formattedAmount} ]`
    );
  }

  invariant(
    fromAccount.balance.gte(new BigNumber(amount)),
    `✖ Not enough balance`
  );
  console.log("• Open the destination currency app");
  await delay(8000);
  let toParentAccount: Account | null = null;
  let toAccount: Account | SubAccount | undefined = await scan(
    secondAccountOpts
  )
    .pipe(take(1))
    .toPromise();
  invariant(toAccount, `✖ No account found`);
  const { tokenId: tokenId2 } = secondAccountOpts;

  //Are we asking for a token account?
  if (tokenId2) {
    const token = findTokenById(tokenId2);
    invariant(token, `✖ No token currency found with id ${tokenId2}`);
    if (!token) {
      throw new Error(`✖ No token currency found with id ${tokenId2}`);
    }
    const subAccounts =
      accountWithMandatoryTokens(toAccount, [token]).subAccounts || [];
    const subAccount = subAccounts.find((t) => {
      const currency = getAccountCurrency(t);
      return tokenId2 === currency.id;
    });
    // We have a token account, keep track of both now;
    toParentAccount = toAccount;
    toAccount = subAccount;
    invariant(fromAccount, `✖ No account found`);
  }

  invariant(toAccount, `✖ No account found`);
  if (!toAccount) throw new Error(`✖ No account found`);

  if (toParentAccount) {
    console.log("\t:parentId:\t\t", toParentAccount.id);
  }

  console.log("\t:id:\t\t", toAccount.id);
  const bridge = getAccountBridge(fromAccount, fromParentAccount);
  let transaction = bridge.createTransaction(
    getMainAccount(fromAccount, fromParentAccount)
  );
  transaction = bridge.updateTransaction(transaction, {
    recipient: getAbandonSeedAddress(
      getAccountCurrency(getMainAccount(fromAccount, fromParentAccount)).id
    ),
    subAccountId: fromParentAccount ? fromAccount.id : undefined,
  });

  if (!useAllAmount) {
    transaction = bridge.updateTransaction(transaction, {
      amount: new BigNumber(amount),
    });
  } else {
    const amount = await bridge.estimateMaxSpendable({
      account: fromAccount,
      parentAccount: fromParentAccount,
      transaction,
    });
    transaction = bridge.updateTransaction(transaction, {
      amount,
    });
  }

  transaction = await bridge.prepareTransaction(
    getMainAccount(fromAccount, fromParentAccount),
    transaction
  );
  const exchange: Exchange = {
    fromAccount,
    fromParentAccount,
    toAccount,
    toParentAccount,
  };

  const exchangeRates = await getExchangeRates(
    exchange,
    transaction,
    wyreUserId
  );

  console.log({ exchangeRates });

  const exchangeRate = exchangeRates.find((er) => {
    if (
      er.tradeMethod === (useFloat ? "float" : "fixed") &&
      (!wyreUserId || er.provider === "wyre")
    ) {
      return true;
    }
    return false;
  });

  invariant(exchangeRate, `✖ No valid rate available`);
  console.log(
    `Using first ${useFloat ? "float" : "fixed"} rate:\n`,
    exchangeRate
  );
  console.log({
    transaction,
    amount: transaction.amount.toString(),
  });
  console.log("• Open the Exchange app");
  await delay(8000);
  const initSwapResult = await initSwap({
    exchange,
    exchangeRate: exchangeRate as ExchangeRate,
    transaction,
    deviceId,
    userId: wyreUserId,
  })
    .pipe(
      tap((e: any) => {
        switch (e.type) {
          case "init-swap-requested":
            console.log("• Confirm swap operation on your device");
            break;

          case "init-swap-error":
            console.log(e);
            invariant(false, "Something went wrong confirming the swap");
            // $FlowFixMe
            break;

          case "init-swap-result":
            console.log(e);
        }

        if (e.type === "init-swap-requested")
          console.log("• Confirm swap operation on your device");
      }),
      filter((e: any) => e.type === "init-swap-result"),
      map((e: any) => {
        if (e.type === "init-swap-result") {
          return e.initSwapResult;
        }
      })
    )
    .toPromise();
  transaction = (initSwapResult as InitSwapResult).transaction;
  console.log("Device app switch & silent signing");
  await delay(8000);
  const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
  const signedOperation = await bridge
    .signOperation({
      account: mainFromAccount,
      deviceId,
      transaction,
    })
    .pipe(
      tap((e) => console.log(e)),
      first((e: any) => e.type === "signed"),
      map((e: any) => {
        if (e.type === "signed") {
          return e.signedOperation;
        }
      })
    )
    .toPromise();
  console.log("Broadcasting");
  const operation = await bridge.broadcast({
    account: mainFromAccount,
    signedOperation: signedOperation as SignedOperation,
  });
  console.log({
    operation,
  });
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
    {
      name: "wyreUserId",
      alias: "w",
      type: String,
      desc: "If provided, will attempt to use Wyre provider with given userId",
    },
    {
      name: "tokenId",
      alias: "t",
      type: String,
      desc: "Use a token account children of the account",
    },
    {
      name: "useFloat",
      alias: "f",
      type: Boolean,
      desc: "Use first floating rate returned. Defaults to false.",
    },
    ...scanCommonOpts,
  ],
  job: (opts: SwapJobOpts) => from(exec(opts)),
};
