import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import zipWith from "lodash/zipWith";
import { BigNumber } from "bignumber.js";
import osmosisValidatorsManager from "./validators";

import type { Transaction } from "../../generated/types";
import type {
  Account,
  AccountLike,
  AccountLikeArray,
} from "@ledgerhq/types-live";
import { CosmosDelegationInfo } from "../cosmos/types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, delegate, undelegate",
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
  {
    name: "memo",
    type: String,
    desc: "add a memo to a transaction",
  },
  {
    name: "sourceValidator",
    type: String,
    desc: "for redelegate, add a source validator",
  },
  {
    name: "osmosisValidator",
    type: String,
    multiple: true,
    desc: "address of recipient validator that will receive the delegate",
  },
  {
    name: "osmosisAmountValidator",
    type: String,
    multiple: true,
    desc: "Amount that the validator will receive",
  },
];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "osmosis", "osmosis family");

  const accounts: Account[] = [account];
  return accounts;
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
    mainAccount: Account;
  }>,
  opts: Record<string, any>,
  { inferAmount }: any
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "osmosis", "osmosis family");
    const validatorsAddresses: string[] = opts["osmosisValidator"] || [];

    const validatorsAmounts: BigNumber[] = (
      opts["osmosisAmountValidator"] || []
    ).map((value) => {
      return inferAmount(account, value);
    });
    const validators: CosmosDelegationInfo[] = zipWith(
      validatorsAddresses,
      validatorsAmounts,
      (address, amount) => ({
        address,
        amount: amount || new BigNumber(0),
      })
    );

    return {
      ...transaction,
      family: "osmosis",
      mode: opts.mode || "send",
      fees: opts.fees ? inferAmount(account, opts.fees) : null,
      gas: opts.gasLimit ? new BigNumber(opts.gasLimit) : null,
      memo: opts.memo,
      validators: validators,
      sourceValidator: opts.sourceValidator,
    } as Transaction;
  });
}

const osmosisValidatorsFormatters = {
  json: (list) => JSON.stringify(list),
  default: (list) =>
    list
      .map(
        (v) =>
          `${v.validatorAddress} "${v.name}" ${v.votingPower} ${v.commission} ${v.estimatedYearlyRewardsRate}`
      )
      .join("\n"),
};

const osmosisValidators = {
  args: [
    {
      name: "format",
      desc: Object.keys(osmosisValidatorsFormatters).join(" | "),
      type: String,
    },
  ],
  job: ({
    format,
  }: Partial<{
    format: string;
  }>): Observable<string> =>
    from(osmosisValidatorsManager.getValidators()).pipe(
      map((validators) => {
        const f =
          (format && osmosisValidatorsFormatters[format]) ||
          osmosisValidatorsFormatters.default;
        return f(validators);
      })
    ),
};

export default {
  options,
  inferAccounts,
  inferTransactions,
  commands: {
    osmosisValidators,
  },
};
