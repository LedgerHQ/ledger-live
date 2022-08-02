import invariant from "invariant";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { CryptoOrgAccount } from "./types";

function formatAccountSpecifics(account: CryptoOrgAccount): string {
  const { cryptoOrgResources } = account;
  invariant(cryptoOrgResources, "Crypto.org account expected");
  if (!cryptoOrgResources) throw new Error("Crypto.org account expected");
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

  if (cryptoOrgResources.bondedBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, cryptoOrgResources.bondedBalance, formatConfig) +
      " bonded. ";
  }

  if (cryptoOrgResources.redelegatingBalance.gt(0)) {
    str +=
      formatCurrencyUnit(
        unit,
        cryptoOrgResources.redelegatingBalance,
        formatConfig
      ) + " redelegatingBalance. ";
  }

  if (cryptoOrgResources.unbondingBalance.gt(0)) {
    str +=
      formatCurrencyUnit(
        unit,
        cryptoOrgResources.unbondingBalance,
        formatConfig
      ) + " unbondingBalance. ";
  }

  if (cryptoOrgResources.commissions.gt(0)) {
    str +=
      formatCurrencyUnit(unit, cryptoOrgResources.commissions, formatConfig) +
      " commissions. ";
  }

  return str;
}

export default {
  formatAccountSpecifics,
};
