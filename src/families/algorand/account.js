// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Account, Operation, Unit } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

function formatOperationSpecifics(op: Operation, unit: ?Unit): string {
  const { rewards } = op.extra;
  return rewards
    ? " REWARDS : " +
        `${
          unit
            ? formatCurrencyUnit(unit, BigNumber(rewards), {
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
  if (algorandResources.rewards.gt(0)) {
    str +=
      formatCurrencyUnit(unit, algorandResources.rewards, formatConfig) +
      " rewards. ";
  }
  if (algorandResources.rewardsAccumulated.gt(0)) {
    str +=
      formatCurrencyUnit(
        unit,
        algorandResources.rewardsAccumulated,
        formatConfig
      ) + " rewardsAccumulated. ";
  }

  return str;
}

export function fromOperationExtraRaw(extra: ?Object) {
  if (extra && extra.rewards) {
    return {
      ...extra,
      rewards: BigNumber(extra.rewards),
    };
  }
  return extra;
}

export function toOperationExtraRaw(extra: ?Object) {
  if (extra && extra.rewards) {
    return {
      ...extra,
      rewards: extra.rewards.toString(),
    };
  }
  return extra;
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
