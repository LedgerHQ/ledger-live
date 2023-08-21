import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import type { Account, AccountLike, AccountLikeArray, SubAccount } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import type { Baker } from "./bakers";
import { listBakers, fetchAllBakers } from "./bakers";
import defaultList from "./bakers.whitelist-default";
const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction",
  },
  {
    name: "storageLimit",
    type: String,
    desc: "how much storageLimit. default is estimated with the recipient",
  },
  {
    name: "subAccount",
    type: String,
    desc: "use a sub account instead of the parent by index",
    multiple: true,
  },
  {
    name: "fees",
    type: String,
    desc: "how much fees",
  },
  {
    name: "gasLimit",
    type: String,
    desc: "how much gasLimit. default is estimated with the recipient",
  },
];

function inferAccounts(account: Account, opts: Record<string, any>): AccountLikeArray {
  invariant(account.currency.family === "tezos", "tezos family");

  if (!opts.subAccount) {
    const accounts: Account[] = [account];
    return accounts;
  }

  const { subAccounts } = account;
  invariant(subAccounts, "no sub accounts");
  return opts.subAccount.map(i => {
    const acc = (subAccounts as SubAccount[])[i];
    invariant(acc, "sub account not found (index %s)", i);
    return acc;
  });
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>,
  { inferAmount }: any,
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "tezos", "tezos family");
    let subAccountId;

    if (account.type === "ChildAccount") {
      subAccountId = account.id;
    }

    return {
      ...transaction,
      mode: opts.mode || "send",
      subAccountId,
      fees: opts.fees ? inferAmount(account, opts.fees) : null,
      gasLimit: opts.gasLimit ? new BigNumber(opts.gasLimit) : null,
      storageLimit: opts.storageLimit ? new BigNumber(opts.storageLimit) : null,
    };
  });
}

const bakersFormatters = {
  json: list => JSON.stringify(list),
  default: list =>
    list
      .map(b => `${b.address} "${b.name}" ${b.nominalYield} ${b.capacityStatus} ${b.logoURL}`)
      .join("\n"),
};
const tezosListBakers = {
  args: [
    {
      name: "whitelist",
      desc: "filter whitelist",
      type: Boolean,
    },
    {
      name: "format",
      desc: Object.keys(bakersFormatters).join(" | "),
      type: String,
    },
  ],
  job: ({
    whitelist,
    format,
  }: Partial<{
    whitelist: boolean;
    format: string;
  }>): Observable<string> =>
    from(whitelist ? listBakers(defaultList) : fetchAllBakers()).pipe(
      map((list: Baker[]) => {
        const f = (format && bakersFormatters[format]) || bakersFormatters.default;
        return f(list);
      }),
    ),
};
export default {
  options,
  inferAccounts,
  inferTransactions,
  commands: {
    tezosListBakers,
  },
};
