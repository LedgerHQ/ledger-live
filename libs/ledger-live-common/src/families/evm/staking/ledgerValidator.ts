import type { StakingValidatorItem } from "@ledgerhq/types-live";

const LEDGER_VALIDATOR_ADDRESS_BY_CURRENCY: Record<string, string> = {
  monad: "0xf249265d16a9d70f684b0e43863242298c25d81c",
};

export const getLedgerValidatorAddress = (currencyId: string): string | undefined =>
  LEDGER_VALIDATOR_ADDRESS_BY_CURRENCY[currencyId];

export function sortLedgerValidatorFirst(
  validators: StakingValidatorItem[],
  currencyId: string,
): StakingValidatorItem[] {
  const ledgerAddress = getLedgerValidatorAddress(currencyId);
  if (!ledgerAddress) return validators;

  const ledger = validators.find(v => v.validatorAddress.toLowerCase() === ledgerAddress);
  if (!ledger || validators[0] === ledger) return validators;

  return [ledger, ...validators.filter(v => v !== ledger)];
}
