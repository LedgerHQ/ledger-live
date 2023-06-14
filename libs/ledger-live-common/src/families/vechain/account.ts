import type { Account, Operation } from "@ledgerhq/types-live";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { Unit } from "@ledgerhq/types-cryptoassets";

function formatAccountSpecifics(account: Account): string {
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

function formatOperationSpecifics(op: Operation, unit: Unit): string {
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

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
};
