import type { Account, AccountLike, AccountLikeArray, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { listBakers, fetchAllBakers } from "../network/bakers";
import defaultList from "../network/bakers.whitelist-default";
import type { Transaction, Baker } from "../types";

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
  return opts.subAccount.map((i: number) => {
    const acc = (subAccounts as TokenAccount[])[i];
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
  json: (list: Baker[]) => JSON.stringify(list),
  default: (list: Baker[]) =>
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
    format: "json" | "default";
  }>): Observable<string> =>
    from(whitelist ? listBakers(defaultList) : fetchAllBakers()).pipe(
      map((list: Baker[]) => {
        const f = (format && bakersFormatters[format]) || bakersFormatters.default;
        return f(list);
      }),
    ),
};

export type CliTools = {
  options: typeof options;
  inferTransactions: (
    transactions: Array<{
      account: AccountLike;
      transaction: Transaction;
    }>,
    opts: Record<string, any>,
    { inferAmount }: any,
  ) => Transaction[];
  commands: { tezosListBakers: typeof tezosListBakers };
};

export default function makeCliTools() {
  return {
    options,
    inferAccounts,
    inferTransactions,
    commands: {
      tezosListBakers,
    },
  };
}
