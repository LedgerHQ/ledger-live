import { Currency } from "../enum/Currency";
import { Team } from "../enum/Team";

const BST_DELEGATE_CURRENCIES = new Set([
  Currency.ADA.id,
  Currency.CELO.id,
  Currency.NEAR.id,
  Currency.SUI.id,
  Currency.XTZ.id,
]);

export function delegateTeamOwner(currencyId: string): Team {
  return BST_DELEGATE_CURRENCIES.has(currencyId) ? Team.BST : Team.COIN_INTEGRATION;
}
