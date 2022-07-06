import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { PolkadotAccount, PolkadotResources } from "./types";
import type { Unit } from "@ledgerhq/types-cryptoassets";

function formatOperationSpecifics(
  op: Operation,
  unit: Unit | null | undefined
): string {
  const {
    validators,
    bondedAmount,
    unbondedAmount,
    withdrawUnbondedAmount,
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
      : withdrawUnbondedAmount && !withdrawUnbondedAmount.isNaN()
      ? `\n    withdrawUnbondedAmount: ${
          unit
            ? formatCurrencyUnit(unit, withdrawUnbondedAmount, formatConfig)
            : withdrawUnbondedAmount
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

function formatAccountSpecifics(account: PolkadotAccount): string {
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

  if ((polkadotResources as PolkadotResources).lockedBalance.gt(0)) {
    str +=
      formatCurrencyUnit(
        unit,
        (polkadotResources as PolkadotResources).lockedBalance,
        formatConfig
      ) + " locked. ";
  }

  if ((polkadotResources as PolkadotResources).unlockedBalance.gt(0)) {
    str +=
      formatCurrencyUnit(
        unit,
        (polkadotResources as PolkadotResources).unlockedBalance,
        formatConfig
      ) + " unlocked. ";
  }

  if ((polkadotResources as PolkadotResources).stash) {
    str += "\nstash : " + (polkadotResources as PolkadotResources).stash;
  }

  if ((polkadotResources as PolkadotResources).controller) {
    str +=
      "\ncontroller : " + (polkadotResources as PolkadotResources).controller;
  }

  if ((polkadotResources as PolkadotResources).nominations?.length) {
    str += "\nNominations\n";
    str += ((polkadotResources as PolkadotResources).nominations as any[])
      .map((v) => `  to ${v.address}`)
      .join("\n");
  }

  return str;
}

export function fromOperationExtraRaw(
  extra: Record<string, any> | null | undefined
) {
  if (extra && extra.transferAmount) {
    extra = { ...extra, transferAmount: extra.transferAmount.toString() };
  }

  if (extra && extra.bondedAmount) {
    return { ...extra, bondedAmount: new BigNumber(extra.bondedAmount) };
  }

  if (extra && extra.unbondedAmount) {
    return { ...extra, unbondedAmount: new BigNumber(extra.unbondedAmount) };
  }

  if (extra && extra.withdrawUnbondedAmount) {
    return {
      ...extra,
      withdrawUnbondedAmount: new BigNumber(extra.withdrawUnbondedAmount),
    };
  }

  // for subscan reward & slash
  if (extra && extra.amount) {
    return { ...extra, amount: new BigNumber(extra.amount) };
  }

  return extra;
}
export function toOperationExtraRaw(
  extra: Record<string, any> | null | undefined
) {
  if (extra && extra.transferAmount) {
    extra = { ...extra, transferAmount: extra.transferAmount.toString() };
  }

  if (extra && extra.bondedAmount) {
    return { ...extra, bondedAmount: extra.bondedAmount.toString() };
  }

  if (extra && extra.unbondedAmount) {
    return { ...extra, unbondedAmount: extra.unbondedAmount.toString() };
  }

  if (extra && extra.withdrawUnbondedAmount) {
    return {
      ...extra,
      withdrawUnbondedAmount: extra.withdrawUnbondedAmount.toString(),
    };
  }

  // for subscan reward & slash
  if (extra && extra.amount) {
    return { ...extra, amount: extra.amount.toString() };
  }

  return extra;
}
export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
