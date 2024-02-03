import { getAccountUnit } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import invariant from "invariant";
import type { AlgorandAccount, AlgorandOperation } from "./types";

function formatOperationSpecifics(op: AlgorandOperation, unit: Unit | null | undefined): string {
  const { rewards } = op.extra;
  return rewards
    ? ` REWARDS : ${
        unit
          ? formatCurrencyUnit(unit, rewards, {
              showCode: true,
              disableRounding: true,
            }).padEnd(16)
          : rewards.toString()
      }`
    : "";
}

function formatAccountSpecifics(account: AlgorandAccount): string {
  const { algorandResources } = account;
  invariant(algorandResources, "algorand account expected");
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  let str = " ";
  str += formatCurrencyUnit(unit, account.spendableBalance, formatConfig) + " spendable. ";

  if (algorandResources.rewards.gt(0)) {
    str += formatCurrencyUnit(unit, algorandResources.rewards, formatConfig) + " rewards. ";
  }

  return str;
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
};
