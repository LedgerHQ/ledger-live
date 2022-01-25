import invariant from "invariant";
import type { Account, Operation, Unit } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

function formatAccountSpecifics(account: Account): string {
  const { elrondResources } = account;
  invariant(elrondResources, "elrond account expected");
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  let str = " ";

  if (account.spendableBalance) {
    str +=
      formatCurrencyUnit(unit, account.spendableBalance, formatConfig) +
      " spendable. ";
  } else {
    str += " 0 spendable.";
  }

  if (elrondResources && elrondResources.nonce) {
    str += "\n nonce : " + elrondResources.nonce;
  }

  return str;
}

function formatOperationSpecifics(
  _op: Operation,
  _unit: Unit | null | undefined
): string {
  return "";
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
};
