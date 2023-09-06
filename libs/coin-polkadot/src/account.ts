import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { getAccountUnit } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  PolkadotAccount,
  PolkadotOperation,
  PolkadotOperationExtra,
  PolkadotOperationExtraRaw,
  PolkadotResources,
} from "./types";
import type { Unit } from "@ledgerhq/types-cryptoassets";

function formatOperationSpecifics(op: Operation, unit: Unit | null | undefined): string {
  const { validators, bondedAmount, unbondedAmount, withdrawUnbondedAmount, validatorStash } = (
    op as PolkadotOperation
  ).extra;
  let str = (validators || []).map((v: any) => `\n    ${v}`).join("");
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  str +=
    bondedAmount && !bondedAmount.isNaN()
      ? `\n    bondedAmount: ${
          unit ? formatCurrencyUnit(unit, bondedAmount, formatConfig) : bondedAmount
        }`
      : unbondedAmount && !unbondedAmount.isNaN()
      ? `\n    unbondedAmount: ${
          unit ? formatCurrencyUnit(unit, unbondedAmount, formatConfig) : unbondedAmount
        }`
      : withdrawUnbondedAmount && !withdrawUnbondedAmount.isNaN()
      ? `\n    withdrawUnbondedAmount: ${
          unit
            ? formatCurrencyUnit(unit, withdrawUnbondedAmount, formatConfig)
            : withdrawUnbondedAmount
        }`
      : "";
  str += validatorStash ? `\n    validatorStash: ${validatorStash}` : "";
  return str;
}

function formatAccountSpecifics(account: PolkadotAccount): string {
  const polkadotResources = account.polkadotResources as PolkadotResources;
  invariant(polkadotResources, "polkadot account expected");
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  let str = " ";
  str += formatCurrencyUnit(unit, account.spendableBalance, formatConfig) + " spendable. ";

  if (polkadotResources.lockedBalance.gt(0)) {
    str += formatCurrencyUnit(unit, polkadotResources.lockedBalance, formatConfig) + " locked. ";
  }

  if (polkadotResources.unlockedBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, polkadotResources.unlockedBalance, formatConfig) + " unlocked. ";
  }

  if (polkadotResources.stash) {
    str += "\nstash : " + polkadotResources.stash;
  }

  if (polkadotResources.controller) {
    str += "\ncontroller : " + polkadotResources.controller;
  }

  if (polkadotResources.nominations?.length) {
    str += "\nNominations\n";
    str += (polkadotResources.nominations as any[]).map(v => `  to ${v.address}`).join("\n");
  }

  return str;
}

export function fromOperationExtraRaw(extraRaw: PolkadotOperationExtraRaw): PolkadotOperationExtra {
  const extra: PolkadotOperationExtra = {
    palletMethod: extraRaw.palletMethod,
    validatorStash: extraRaw.validatorStash,
    validators: extraRaw.validators,
  };

  if (extraRaw.transferAmount) {
    extra.transferAmount = new BigNumber(extraRaw.transferAmount);
  }

  if (extraRaw.bondedAmount) {
    extra.bondedAmount = new BigNumber(extraRaw.bondedAmount);
  }

  if (extraRaw.unbondedAmount) {
    extra.unbondedAmount = new BigNumber(extraRaw.unbondedAmount);
  }

  if (extraRaw.withdrawUnbondedAmount) {
    extra.withdrawUnbondedAmount = new BigNumber(extraRaw.withdrawUnbondedAmount);
  }

  return extra;
}

export function toOperationExtraRaw(extra: PolkadotOperationExtra): PolkadotOperationExtraRaw {
  const extraRaw: PolkadotOperationExtraRaw = {
    palletMethod: extra.palletMethod,
    validatorStash: extra.validatorStash,
    validators: extra.validators,
  };

  if (extra.transferAmount) {
    extraRaw.transferAmount = extra.transferAmount.toString();
  }

  if (extra.bondedAmount) {
    extraRaw.bondedAmount = extra.bondedAmount.toString();
  }

  if (extra.unbondedAmount) {
    extraRaw.unbondedAmount = extra.unbondedAmount.toString();
  }

  if (extra.withdrawUnbondedAmount) {
    extraRaw.withdrawUnbondedAmount = extra.withdrawUnbondedAmount.toString();
  }

  return extraRaw;
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
