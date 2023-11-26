import { getAccountUnit } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import type {
  AlgorandAccount,
  AlgorandOperation,
  AlgorandOperationExtra,
  AlgorandOperationExtraRaw,
} from "./types";

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

export function fromOperationExtraRaw(extraRaw: AlgorandOperationExtraRaw) {
  const extra: AlgorandOperationExtra = {};
  if (extraRaw.rewards) {
    extra.rewards = new BigNumber(extraRaw.rewards);
  }

  if (extraRaw.memo) {
    extra.memo = extraRaw.memo;
  }

  if (extraRaw.assetId) {
    extra.assetId = extraRaw.assetId;
  }

  return extra;
}

export function toOperationExtraRaw(extra: AlgorandOperationExtra) {
  const extraRaw: AlgorandOperationExtraRaw = {};
  if (extra.rewards) {
    extraRaw.rewards = extra.rewards.toString();
  }

  if (extra.memo) {
    extraRaw.memo = extra.memo;
  }

  if (extra.assetId) {
    extraRaw.assetId = extra.assetId;
  }

  return extraRaw;
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
