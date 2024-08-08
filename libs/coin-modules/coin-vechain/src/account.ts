import { getAccountCurrency } from "@ledgerhq/coin-framework/lib/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib/currencies/index";
import type { Account } from "@ledgerhq/types-live";

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
