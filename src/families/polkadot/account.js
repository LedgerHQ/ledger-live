// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Account, Operation, Unit } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

function formatOperationSpecifics(op: Operation, unit: ?Unit): string {
  const {
    validators,
    bondedAmount,
    unbondedAmount,
    validatorStash,
    amount,
  } = op.extra;
  let str = (validators || []).map((v) => `\n    ${v}`).join("");

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  str +=
    bondedAmount && !bondedAmount.isNaN()
      ? `\n    bondedAmount: ${
          unit
            ? formatCurrencyUnit(unit, bondedAmount, formatConfig)
            : bondedAmount
        }`
      : unbondedAmount && !unbondedAmount.isNaN()
      ? `\n    unbondedAmount: ${
          unit
            ? formatCurrencyUnit(unit, unbondedAmount, formatConfig)
            : unbondedAmount
        }`
      : "";

  str += validatorStash ? `\n    validatorStash: ${validatorStash}` : "";

  str += amount
    ? `\n    amount: ${
        unit ? formatCurrencyUnit(unit, amount, formatConfig) : amount
      }`
    : "";

  return str;
}

function formatAccountSpecifics(account: Account): string {
  const { polkadotResources } = account;
  invariant(polkadotResources, "polkadot account expected");
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
  if (polkadotResources.lockedBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, polkadotResources.lockedBalance, formatConfig) +
      " locked. ";
  }
  if (polkadotResources.unlockedBalance.gt(0)) {
    str +=
      formatCurrencyUnit(
        unit,
        polkadotResources.unlockedBalance,
        formatConfig
      ) + " unlocked. ";
  }
  if (polkadotResources.stash) {
    str += "\nstash : " + polkadotResources.stash;
  }
  if (polkadotResources.controller) {
    str += "\ncontroller : " + polkadotResources.controller;
  }

  if (polkadotResources.nominations?.length) {
    str += "\nNominations\n";
    str += polkadotResources.nominations
      .map((v) => `  to ${v.address}`)
      .join("\n");
  }
  return str;
}

export function fromOperationExtraRaw(extra: ?Object) {
  if (extra && extra.transferAmount) {
    extra = {
      ...extra,
      transferAmount: extra.transferAmount.toString(),
    };
  }
  if (extra && extra.bondedAmount) {
    return {
      ...extra,
      bondedAmount: BigNumber(extra.bondedAmount),
    };
  }
  if (extra && extra.unbondedAmount) {
    return {
      ...extra,
      unbondedAmount: BigNumber(extra.unbondedAmount),
    };
  }
  // for subscan reward & slash
  if (extra && extra.amount) {
    return {
      ...extra,
      amount: BigNumber(extra.amount),
    };
  }
  return extra;
}

export function toOperationExtraRaw(extra: ?Object) {
  if (extra && extra.transferAmount) {
    extra = {
      ...extra,
      transferAmount: extra.transferAmount.toString(),
    };
  }
  if (extra && extra.bondedAmount) {
    return {
      ...extra,
      bondedAmount: extra.bondedAmount.toString(),
    };
  }
  if (extra && extra.unbondedAmount) {
    return {
      ...extra,
      unbondedAmount: extra.unbondedAmount.toString(),
    };
  }
  // for subscan reward & slash
  if (extra && extra.amount) {
    return {
      ...extra,
      amount: extra.amount.toString(),
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
