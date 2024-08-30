import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { isAccount } from "@ledgerhq/coin-framework/account";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { SidecarValidatorsParamAddresses, SidecarValidatorsParamStatus } from "../network/types";
import { AccountLike } from "@ledgerhq/types-live";
import { PolkadotAccount, PolkadotValidator, Transaction } from "../types";
import polkadotAPI from "../network";

type Options =
  | { name: string; type: StringConstructor; desc: string }
  | { name: string; type: StringConstructor; desc: string; multiple: boolean };
const options: Array<Options> = [
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
type PolkadotValidatorFormatter = (list: PolkadotValidator[]) => string;
const polkadotValidatorsFormatters: Record<string, PolkadotValidatorFormatter> = {
  json: (list: PolkadotValidator[]) => JSON.stringify(list),
  csv: (list: PolkadotValidator[]) => {
    const polkadotUnit = getCryptoCurrencyById("polkadot").units[0];
    const csvHeader =
      "ADDRESS IDENTITY TOTAL_BONDED SELF_BONDED NOMINATORS_COUNT COMMISSION REWARD_POINTS\n";
    const csvList = list
      .map(
        v =>
          `${v.address} "${v.identity}" ${formatCurrencyUnit(polkadotUnit, v.totalBonded, {
            showCode: false,
            disableRounding: true,
            useGrouping: false,
          })} ${formatCurrencyUnit(polkadotUnit, v.selfBonded, {
            showCode: false,
            disableRounding: true,
            useGrouping: false,
          })} ${v.nominatorsCount} ${v.commission.multipliedBy(100).toFixed(2)} ${v.rewardPoints}`,
      )
      .join("\n");
    return csvHeader + csvList;
  },
  default: (list: PolkadotValidator[]) => {
    const polkadotUnit = getCryptoCurrencyById("polkadot").units[0];
    const tableList = list
      .map(
        v =>
          `${v.address} "${v.identity}" ${formatCurrencyUnit(polkadotUnit, v.totalBonded, {
            showCode: true,
            disableRounding: true,
            useGrouping: false,
          })} ${formatCurrencyUnit(polkadotUnit, v.selfBonded, {
            showCode: true,
            disableRounding: true,
            useGrouping: false,
          })} ${v.nominatorsCount} ${v.commission.multipliedBy(100).toFixed(2) + "%"} ${
            v.rewardPoints + " PTS"
          }`,
      )
      .join("\n");
    return tableList;
  },
};
type Validators = {
  args: Array<Options>;
  job: ({
    format,
    status,
    validator,
  }: Partial<{
    format: string;
    status: SidecarValidatorsParamStatus | SidecarValidatorsParamAddresses;
    validator: string[];
  }>) => Observable<string>;
};
function createValidators(): Validators {
  return {
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
      from(polkadotAPI.getValidators(validator && validator.length ? validator : status)).pipe(
        map(validators => {
          const f =
            format && format in polkadotValidatorsFormatters
              ? polkadotValidatorsFormatters[format]
              : polkadotValidatorsFormatters.default;
          return f(validators);
        }),
      ),
  };
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>,
  { inferAmount }: any,
): Transaction[] {
  return flatMap(
    transactions,
    ({ transaction, account }: { account: AccountLike; transaction: Transaction }) => {
      invariant(transaction.family === "polkadot", "polkadot family");

      if (isAccount(account)) {
        invariant((account as PolkadotAccount).polkadotResources, "unactivated account");
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
    },
  );
}

export type CliTools = {
  options: Array<Options>;
  inferTransactions: (
    transactions: Array<{
      account: AccountLike;
      transaction: Transaction;
    }>,
    opts: Record<string, any>,
    { inferAmount }: any,
  ) => Transaction[];
  commands: { polkadotValidators: Validators };
};

export default function makeCliTools(): CliTools {
  return {
    options,
    inferTransactions,
    commands: {
      polkadotValidators: createValidators(),
    },
  };
}
