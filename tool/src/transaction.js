// @flow

import "lodash.product";
import { product } from "lodash";
import uniqBy from "lodash/uniqBy";
import shuffle from "lodash/shuffle";
import flatMap from "lodash/flatMap";
import { BigNumber } from "bignumber.js";
import type {
  Transaction,
  AccountLike,
  Account
} from "@ledgerhq/live-common/lib/types";
import perFamily from "@ledgerhq/live-common/lib/generated/cli-transaction";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import { parseCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";

const inferAmount = (account: AccountLike, str: string): BigNumber => {
  const currency = getAccountCurrency(account);
  const { units } = currency;
  if (str.endsWith("%")) {
    return account.balance.times(0.01 * parseFloat(str.replace("%", "")));
  }
  const lowerCase = str.toLowerCase();
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const code = unit.code.toLowerCase();
    if (lowerCase.includes(code)) {
      return parseCurrencyUnit(unit, lowerCase.replace(code, ""));
    }
  }
  return parseCurrencyUnit(units[0], str);
};

export type InferTransactionsOpts = $Shape<{
  "self-transaction": boolean,
  "use-all-amount": boolean,
  recipient: string[],
  amount: string,
  shuffle: boolean
}>;

export const inferTransactionsOpts = uniqBy(
  [
    {
      name: "self-transaction",
      type: Boolean,
      desc: "Pre-fill the transaction for the account to send to itself"
    },
    {
      name: "use-all-amount",
      type: Boolean,
      desc: "Send MAX of the account balance"
    },
    {
      name: "recipient",
      type: String,
      desc: "the address to send funds to",
      multiple: true
    },
    {
      name: "amount",
      type: String,
      desc: "how much to send in the main currency unit"
    },
    {
      name: "shuffle",
      type: Boolean,
      desc: "if using multiple token or recipient, order will be randomized"
    }
  ].concat(flatMap(Object.values(perFamily), m => (m && m.options) || [])),
  "name"
);

export async function inferTransactions(
  mainAccount: Account,
  opts: InferTransactionsOpts
): Promise<Transaction[]> {
  const bridge = getAccountBridge(mainAccount, null);

  const specific = perFamily[mainAccount.currency.family];

  const inferAccounts =
    (specific && specific.inferAccounts) || ((account, _opts) => [account]);

  const inferTransactions =
    (specific && specific.inferTransactions) ||
    ((transactions, _opts, _r) => transactions);

  let all = await Promise.all(
    product(
      inferAccounts(mainAccount, opts),
      opts.recipient || [
        opts["self-transaction"] ? mainAccount.freshAddress : ""
      ]
    ).map(async ([account, recipient]) => {
      let transaction = bridge.createTransaction(mainAccount);

      transaction.recipient = recipient;

      transaction.useAllAmount = !!opts["use-all-amount"];

      transaction.amount = transaction.useAllAmount
        ? BigNumber(0)
        : inferAmount(account, opts.amount || "0.001");

      transaction = await bridge.prepareTransaction(mainAccount, transaction);

      return { account, transaction };
    })
  );

  if (opts.shuffle) {
    all = shuffle(all);
  }

  const transactions = await Promise.all(
    inferTransactions(all, opts, { inferAmount }).map(transaction =>
      bridge.prepareTransaction(mainAccount, transaction)
    )
  );

  return transactions;
}
