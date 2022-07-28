import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { getValidators } from "./validators";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../../generated/types";
import { isAccount } from "../../account/index";
import { getCryptoCurrencyById, formatCurrencyUnit } from "../../currencies";
import {
  SidecarValidatorsParamAddresses,
  SidecarValidatorsParamStatus,
} from "./api/sidecar.types";
import { AccountLike } from "@ledgerhq/types-live";
import { PolkadotAccount } from "./types";
const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, nominate, bond, claimReward, withdrawUnbonded",
  },
  {
    name: "fees",
    type: String,
    desc: "how much fees",
  },
  {
    name: "validator",
    type: String,
    multiple: true,
    desc: "address of recipient validator that will receive the delegate",
  },
  {
    name: "era",
    type: String,
    desc: "Era of when to claim rewards",
  },
  /** Different possible destionation :
  Staked - Pay into the stash account, increasing the amount at stake accordingly.
  Stash - Pay into the stash account, not increasing the amount at stake.
  Account - Pay into a custom account, like so: Account DMTHrNcmA8QbqRS4rBq8LXn8ipyczFoNMb1X4cY2WD9tdBX.
  Controller - Pay into the controller account.
 */
  {
    name: "rewardDestination",
    type: String,
    desc: "Reward destination",
  },
];
const polkadotValidatorsFormatters = {
  json: (list) => JSON.stringify(list),
  csv: (list) => {
    const polkadotUnit = getCryptoCurrencyById("polkadot").units[0];
    const csvHeader =
      "ADDRESS IDENTITY TOTAL_BONDED SELF_BONDED NOMINATORS_COUNT COMMISSION REWARD_POINTS\n";
    const csvList = list
      .map(
        (v) =>
          `${v.address} "${v.identity}" ${formatCurrencyUnit(
            polkadotUnit,
            v.totalBonded,
            {
              showCode: false,
              disableRounding: true,
              useGrouping: false,
            }
          )} ${formatCurrencyUnit(polkadotUnit, v.selfBonded, {
            showCode: false,
            disableRounding: true,
            useGrouping: false,
          })} ${v.nominatorsCount} ${v.commission
            .multipliedBy(100)
            .toFixed(2)} ${v.rewardPoints}`
      )
      .join("\n");
    return csvHeader + csvList;
  },
  default: (list) => {
    const polkadotUnit = getCryptoCurrencyById("polkadot").units[0];
    const tableList = list
      .map(
        (v) =>
          `${v.address} "${v.identity}" ${formatCurrencyUnit(
            polkadotUnit,
            v.totalBonded,
            {
              showCode: true,
              disableRounding: true,
              useGrouping: false,
            }
          )} ${formatCurrencyUnit(polkadotUnit, v.selfBonded, {
            showCode: true,
            disableRounding: true,
            useGrouping: false,
          })} ${v.nominatorsCount} ${
            v.commission.multipliedBy(100).toFixed(2) + "%"
          } ${v.rewardPoints + " PTS"}`
      )
      .join("\n");
    return tableList;
  },
};
const polkadotValidators = {
  args: [
    {
      name: "format",
      desc: Object.keys(polkadotValidatorsFormatters).join("|"),
      type: String,
    },
    {
      name: "status",
      desc: "The status of the validators to fetch (all|elected|waiting)",
      type: String,
    },
    {
      name: "validator",
      type: String,
      multiple: true,
      desc: "address of recipient validator that will receive the delegate",
    },
  ],
  job: ({
    format,
    status,
    validator,
  }: Partial<{
    format: string;
    status: SidecarValidatorsParamStatus | SidecarValidatorsParamAddresses;
    validator: string[];
  }>): Observable<string> =>
    from(
      getValidators(validator && validator.length ? validator : status)
    ).pipe(
      map((validators) => {
        const f =
          (format && polkadotValidatorsFormatters[format]) ||
          polkadotValidatorsFormatters.default;
        return f(validators);
      })
    ),
};

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>,
  { inferAmount }: any
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "polkadot", "polkadot family");

    if (isAccount(account)) {
      invariant(
        (account as PolkadotAccount).polkadotResources,
        "unactivated account"
      );
    }

    const validators: string[] = opts["validator"] || [];
    return {
      ...transaction,
      family: "polkadot",
      fees: opts.fees ? inferAmount(account, opts.fees) : null,
      mode: opts.mode || "send",
      validators,
      era: opts.era || null,
      rewardDestination: opts.rewardDestination || null,
      numSlashingSpans: isAccount(account)
        ? (account as PolkadotAccount).polkadotResources?.numSlashingSpans
        : null,
    };
  });
}

export default {
  options,
  inferTransactions,
  commands: {
    polkadotValidators,
  },
};
