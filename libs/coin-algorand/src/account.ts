import { getAccountUnit } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { Account, Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import type {
  AlgorandAccount,
  AlgorandOperation,
  AlgorandOperationExtra,
  AlgorandOperationExtraRaw,
  AlgorandResources,
} from "./types";

function formatOperationSpecifics(op: Operation, unit: Unit | null | undefined): string {
  const { rewards } = (op as AlgorandOperation).extra;
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
  const { algorandResources } = account as AlgorandAccount;
  invariant(algorandResources, "algorand account expected");
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  let str = " ";
  str += formatCurrencyUnit(unit, account.spendableBalance, formatConfig) + " spendable. ";

  if ((algorandResources as AlgorandResources).rewards.gt(0)) {
    str +=
      formatCurrencyUnit(unit, (algorandResources as AlgorandResources).rewards, formatConfig) +
      " rewards. ";
  }

  return str;
}

export function fromOperationExtraRaw(extraRaw: AlgorandOperationExtraRaw) {
  const extra: AlgorandOperationExtra = {};
  if (extraRaw.rewards) {
    extra.rewards = new BigNumber(extraRaw.rewards);
  }
  return extra;
}

export function toOperationExtraRaw(extra: AlgorandOperationExtra) {
  const extraRaw: AlgorandOperationExtraRaw = {};
  if (extra.rewards) {
    extraRaw.rewards = extra.rewards.toString();
  }
  return extraRaw;
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
