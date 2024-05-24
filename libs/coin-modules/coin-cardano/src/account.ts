import invariant from "invariant";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { CardanoAccount } from "./types";

export function formatAccountSpecifics(account: CardanoAccount): string {
  const { cardanoResources } = account;
  invariant(cardanoResources, "cardano account expected");

  const unit = getAccountCurrency(account).units[0];
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  let str = " ";

  if (cardanoResources?.delegation?.poolId) {
    str += formatCurrencyUnit(unit, account.balance, formatConfig) + " delegated to ";
  }

  if (cardanoResources.delegation?.name) str += cardanoResources.delegation.name + " ";

  if (cardanoResources.delegation?.ticker) str += "(" + cardanoResources.delegation.ticker + ") ";

  if (cardanoResources.delegation?.poolId) str += cardanoResources.delegation.poolId + ". ";

  if (cardanoResources.delegation?.rewards)
    str +=
      "Total " +
      formatCurrencyUnit(unit, cardanoResources.delegation.rewards, formatConfig) +
      " rewards available.";

  return str;
}

export default {
  formatAccountSpecifics,
};
