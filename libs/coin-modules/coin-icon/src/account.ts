import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { IconAccount } from "./types";

function formatAccountSpecifics(account: IconAccount): string {
  const { iconResources } = account;
  if (!iconResources) {
    throw new Error("icon account expected");
  }

  const unit = getAccountCurrency(account).units[0];
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  let str = " ";

  str += formatCurrencyUnit(unit, account.spendableBalance, formatConfig) + " spendable. ";

  if (iconResources.nonce) {
    str += "\nonce : " + iconResources.nonce;
  }

  return str;
}
export default {
  formatAccountSpecifics,
};
