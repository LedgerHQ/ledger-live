import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import zipWith from "lodash/zipWith";
import { getAccountCurrency } from "../../account";
import { getTronSuperRepresentativeData } from "./api";
import type { Transaction as TronTransaction, TronAccount } from "./types";
import type { Transaction } from "../../generated/types";
import type { SuperRepresentativeData, Vote } from "./types";
import type { Account, AccountLike, AccountLikeArray } from "@ledgerhq/types-live";
const options = [
  {
    name: "token",
    alias: "t",
    type: String,
    desc: "use an token account children of the account",
  },
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, freeze, unfreeze, withdrawExpireUnfreeze, unDelegateResource, legacyUnfreeze",
  },
  {
    name: "duration",
    type: String,
    desc: "duration in day",
  },
  {
    name: "resource",
    type: String,
    desc: "reward ENERGY or BANDWIDTH",
  },
  {
    name: "tronVoteAddress",
    type: String,
    multiple: true,
    desc: "address of the super representative voting",
  },
  {
    name: "tronVoteCount",
    type: String,
    multiple: true,
    desc: "number of votes for the vote address",
  },
];

function inferAccounts(account: Account, opts: Record<string, any>): AccountLikeArray {
  invariant(account.currency.family === "tron", "tron family");

  if (!opts.token) {
    const accounts: Account[] = [account];
    return accounts;
  }

  return opts.token.map(token => {
    const subAccounts = account.subAccounts || [];

    if (token) {
      const subAccount = subAccounts.find(t => {
        const currency = getAccountCurrency(t);
        return (
          token.toLowerCase() === currency.ticker.toLowerCase() ||
          token.toLowerCase() === currency.id
        );
      });

      if (!subAccount) {
        throw new Error(
          "token account '" +
            token +
            "' not found. Available: " +
            subAccounts.map(t => getAccountCurrency(t).ticker).join(", "),
        );
      }

      return subAccount;
    }
  });
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>,
): Transaction[] {
  const mode = opts.mode || "send";
  invariant(
    [
      "send",
      "freeze",
      "unfreeze",
      "vote",
      "claimReward",
      "withdrawExpireUnfreeze",
      "unDelegateResource",
      "legacyUnfreeze",
    ].includes(mode),
    `Unexpected mode: ${mode}`,
  );
  const resource = opts.resource ? opts.resource.toUpperCase() : undefined;

  if (resource) {
    invariant(["BANDWIDTH", "ENERGY"].includes(resource), `Unexpected resource: ${resource}`);
  }

  const voteAddresses: string[] = opts["tronVoteAddress"] || [];
  const voteCounts: number[] = (opts["tronVoteCount"] || []).map(value => {
    invariant(Number.isInteger(Number(value)), `Invalid integer: ${value}`);
    return parseInt(value);
  });
  const votes: Vote[] = zipWith(voteAddresses, voteCounts, (a, c) => ({
    address: a,
    voteCount: c,
  }));
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "tron", "tron family");

    if (account.type === "Account") {
      invariant((account as TronAccount).tronResources, "unactivated account");
    }

    if (account.type === "TokenAccount") {
      const isDelisted = account.token.delisted === true;
      invariant(!isDelisted, "token is delisted");
    }

    return {
      ...transaction,
      family: "tron",
      subAccountId: account.type === "TokenAccount" ? account.id : null,
      mode,
      resource,
      votes,
    } as TronTransaction;
  });
}

const formatOptStr = (str: string | null | undefined): string => str || "";

const superRepresentativesFormatters = {
  json: (srData): string => JSON.stringify(srData),
  default: (srData): string => {
    const headerList = 'address "name" url voteCount brokerage isJobs';
    const strList = srData.list.map(
      sr =>
        `${sr.address} "${formatOptStr(sr.name)}" ${formatOptStr(sr.url)} ${sr.voteCount} ${
          sr.brokerage
        } ${sr.isJobs}`,
    );
    const metaData = [
      `nextVotingDate: ${srData.nextVotingDate}`,
      `totalVotes: ${srData.totalVotes}`,
    ];
    return [headerList].concat(strList).concat(metaData).join("\n");
  },
};
const tronSuperRepresentative = {
  args: [
    {
      name: "max",
      desc: "max number of super representatives to return",
      type: Number,
    },
    {
      name: "format",
      desc: Object.keys(superRepresentativesFormatters).join(" | "),
      type: String,
    },
  ],
  job: ({
    max,
    format,
  }: Partial<{
    max: number | null | undefined;
    format: string;
  }>): Observable<string> =>
    from(getTronSuperRepresentativeData(max)).pipe(
      map((srData: SuperRepresentativeData) => {
        const f =
          (format && superRepresentativesFormatters[format]) ||
          superRepresentativesFormatters.default;
        return f(srData);
      }),
    ),
};
export default {
  options,
  inferAccounts,
  inferTransactions,
  commands: {
    tronSuperRepresentative,
  },
};
