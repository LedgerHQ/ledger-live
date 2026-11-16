import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { resolveChainCurrencyId } from "@ledgerhq/coin-cosmos/chain/chain";
import { getCurrencyConfiguration } from "../config";
import { getLedgerValidatorAddress } from "../families/evm/staking/ledgerValidator";

function cosmosLedgerValidator(currencyId: string): string | undefined {
  try {
    const { ledgerValidator } = getCurrencyConfiguration(resolveChainCurrencyId(currencyId));
    return typeof ledgerValidator === "string" ? ledgerValidator : undefined;
  } catch {
    return undefined;
  }
}

/** Whether Ledger runs the validator at this address, from the currency's static config. Cosmos family and EVM only. */
export function isLedgerValidator(currencyId: string, address: string): boolean {
  if (!address) return false;
  switch (findCryptoCurrencyById(currencyId)?.family) {
    case "cosmos":
      return cosmosLedgerValidator(currencyId) === address;
    case "evm":
      return getLedgerValidatorAddress(currencyId)?.toLowerCase() === address.toLowerCase();
    default:
      return false;
  }
}
