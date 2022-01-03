import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Account, Operation, Unit } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { AlgorandResources } from "./types";

function formatOperationSpecifics(
  op: Operation,
  unit: Unit | null | undefined
): string {
  const { rewards } = op.extra;
  return rewards
    ? " REWARDS : " +
        `${
          unit
            ? formatCurrencyUnit(unit, new BigNumber(rewards), {
                showCode: true,
                disableRounding: true,
              }).padEnd(16)
            : rewards
        }`
    : "";
}

function formatAccountSpecifics(account: Account): string {
  const { algorandResources } = account;
  invariant(algorandResources, "algorand account expected");
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  let str = " ";
  str +=
    formatCurrencyUnit(unit, account.spendableBalance, formatConfig) +
    " spendable. ";

  if ((algorandResources as AlgorandResources).rewards.gt(0)) {
    str +=
      formatCurrencyUnit(
        unit,
        (algorandResources as AlgorandResources).rewards,
        formatConfig
      ) + " rewards. ";
  }

  return str;
}

export function fromOperationExtraRaw(
  extra: Record<string, any> | null | undefined
) {
  if (extra && extra.rewards) {
    return { ...extra, rewards: new BigNumber(extra.rewards) };
  }

  return extra;
}
export function toOperationExtraRaw(
  extra: Record<string, any> | null | undefined
) {
  if (extra && extra.rewards) {
    return { ...extra, rewards: extra.rewards.toString() };
  }

  return extra;
}
export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
