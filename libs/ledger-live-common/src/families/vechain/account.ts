import type { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

function formatAccountSpecifics(account: Account): string {
  const unit = getAccountCurrency(account).units[0];
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  let str = " ";

  str += formatCurrencyUnit(unit, account.spendableBalance, formatConfig) + " spendable. ";

  return str;
}

export default {
  formatAccountSpecifics,
};
