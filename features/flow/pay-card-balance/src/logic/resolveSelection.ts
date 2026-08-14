import { PAY_CARD_BALANCE_FILTER_ALL, type PayCardBalanceFilter } from "../state";

export function resolveSelection(
  persisted: PayCardBalanceFilter,
  optionIds: readonly PayCardBalanceFilter[],
): PayCardBalanceFilter {
  if (persisted === PAY_CARD_BALANCE_FILTER_ALL) {
    return PAY_CARD_BALANCE_FILTER_ALL;
  }
  return optionIds.includes(persisted) ? persisted : PAY_CARD_BALANCE_FILTER_ALL;
}
