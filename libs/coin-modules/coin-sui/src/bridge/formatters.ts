import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { Operation } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { BigNumber } from "bignumber.js";
import type { SuiAccount } from "../types";
import { getAccountUnit } from "./utils";

function formatAccountSpecifics(account: SuiAccount): string {
  const { suiResources } = account;
  if (!suiResources) {
    throw new Error("sui account expected");
  }

  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  let str = " ";

  str += formatCurrencyUnit(unit, account.spendableBalance, formatConfig) + " spendable. ";

  return str;
}

function formatOperationSpecifics(
  op: Operation<{ additionalField: BigNumber }>,
  unit?: Unit,
): string {
  const { additionalField } = op.extra;

  let str = " ";

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  str +=
    additionalField && !additionalField.isNaN()
      ? `\n    additionalField: ${
          unit ? formatCurrencyUnit(unit, additionalField, formatConfig) : additionalField
        }`
      : "";

  return str;
}

export function fromOperationExtraRaw(extra: Record<string, any>) {
  if (extra && extra.additionalField) {
    extra = {
      ...extra,
      additionalField: BigNumber(extra.additionalField),
    };
  }
  return extra;
}

export function toOperationExtraRaw(extra: Record<string, any>) {
  if (extra && extra.additionalField) {
    extra = {
      ...extra,
      additionalField: extra.additionalField.toString(),
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
