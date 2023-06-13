import invariant from "invariant";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { CardanoAccount } from "./types";

export function formatAccountSpecifics(account: CardanoAccount): string {
  const { cardanoResources } = account;
  invariant(cardanoResources, "cardano account expected");

  const unit = getAccountUnit(account);
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
