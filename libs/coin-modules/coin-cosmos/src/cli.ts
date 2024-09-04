import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import zipWith from "lodash/zipWith";
import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { AccountLike } from "@ledgerhq/types-live";
import { CosmosValidatorsManager } from "./CosmosValidatorsManager";
import type { CosmosDelegationInfo } from "./types";
import { Transaction as CosmosTransaction } from "./types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, deletage, undelegate",
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
    name: "cosmosValidator",
    type: String,
    multiple: true,
    desc: "address of recipient validator that will receive the delegate",
  },
  {
    name: "cosmosAmountValidator",
    type: String,
    multiple: true,
    desc: "Amount that the validator will receive",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: CosmosTransaction;
  }>,
  opts: Record<string, any>,
  { inferAmount }: any,
): CosmosTransaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "cosmos", "cosmos family");
    const validatorsAddresses: string[] = opts["cosmosValidator"] || [];
    const validatorsAmounts: BigNumber[] = (opts["cosmosAmountValidator"] || []).map(
      (value: any) => {
        return inferAmount(account, value);
      },
    );
    const validators: CosmosDelegationInfo[] = zipWith(
      validatorsAddresses,
      validatorsAmounts,
      (address, amount) => ({
        address,
        amount: amount || new BigNumber(0),
      }),
    );
    return {
      ...transaction,
      family: "cosmos",
      mode: opts.mode || "send",
      memo: opts.memo,
      fees: opts.fees ? inferAmount(account, opts.fees) : null,
      gas: opts.gasLimit ? new BigNumber(opts.gasLimit) : null,
      validators: validators,
      sourceValidator: opts.sourceValidator,
    } as CosmosTransaction;
  });
}

const cosmosValidatorsFormatters = {
  json: (list: any) => JSON.stringify(list),
  default: (list: any) =>
    list
      .map(
        (v: any) =>
          `${v.validatorAddress} "${v.name}" ${v.votingPower} ${v.commission} ${v.estimatedYearlyRewardsRate}`,
      )
      .join("\n"),
};
const cosmosValidatorsManager = new CosmosValidatorsManager(getCryptoCurrencyById("cosmos"));
const cosmosValidators = {
  args: [
    {
      name: "format",
      desc: Object.keys(cosmosValidatorsFormatters).join(" | "),
      type: String,
    },
  ],
  job: ({
    format,
  }: Partial<{
    format: string;
  }>): Observable<string> =>
    from(cosmosValidatorsManager.getValidators()).pipe(
      map(validators => {
        const f =
          (format && (cosmosValidatorsFormatters as any)[format]) ||
          cosmosValidatorsFormatters.default;
        return f(validators);
      }),
    ),
};

export default function makeCliTools() {
  return {
    options,
    inferTransactions,
    commands: {
      cosmosValidators,
    },
  };
}
