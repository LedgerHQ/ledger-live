import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import zipWith from "lodash/zipWith";
import { BigNumber } from "bignumber.js";
import { Transaction as CosmosTransaction } from "./types";
import type { CosmosDelegationInfo } from "./types";
import { AccountLike } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "../../currencies";
import { CosmosValidatorsManager } from "./CosmosValidatorsManager";

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
  { inferAmount }: any
): CosmosTransaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "cosmos", "cosmos family");
    const validatorsAddresses: string[] = opts["cosmosValidator"] || [];
    const validatorsAmounts: BigNumber[] = (
      opts["cosmosAmountValidator"] || []
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
  json: (list) => JSON.stringify(list),
  default: (list) =>
    list
      .map(
        (v) =>
          `${v.validatorAddress} "${v.name}" ${v.votingPower} ${v.commission} ${v.estimatedYearlyRewardsRate}`
      )
      .join("\n"),
};
const cosmosValidatorsManager = new CosmosValidatorsManager(
  getCryptoCurrencyById("cosmos")
);
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
      map((validators) => {
        const f =
          (format && cosmosValidatorsFormatters[format]) ||
          cosmosValidatorsFormatters.default;
        return f(validators);
      })
    ),
};
export default {
  options,
  inferTransactions,
  commands: {
    cosmosValidators,
  },
};
