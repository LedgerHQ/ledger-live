import { PAY_CARD_BALANCE_FILTER_ALL, type BalanceFilter } from "../state";

export function resolveSelection(
  persisted: BalanceFilter,
  optionIds: readonly BalanceFilter[],
): BalanceFilter {
  if (persisted === PAY_CARD_BALANCE_FILTER_ALL) {
    return PAY_CARD_BALANCE_FILTER_ALL;
  }
  return optionIds.includes(persisted) ? persisted : PAY_CARD_BALANCE_FILTER_ALL;
}
