import { FEE_CURRENCY_BY_ADAPTER, FEE_CURRENCY_BY_CONTRACT } from "../constants";

/**
 * Resolves a user-selected fee currency to the address that must be set on a
 * CIP-64 transaction's `feeCurrency` field.
 *
 * The selection may be either a token contract address or an adapter address.
 * Celo prices gas in the fee currency; tokens with fewer than 18 decimals
 * (USDC, USDT) are referenced through an adapter contract that normalizes to 18
 * decimals, while 18-decimal tokens use their own address as the adapter.
 *
 * Returns `undefined` for native CELO gas (nothing selected) or for any address
 * that is not on the fee-currency allowlist — in which case gas is paid in CELO.
 */
export const resolveFeeCurrency = (selection?: string): `0x${string}` | undefined => {
  if (!selection) return undefined;
  const key = selection.toLowerCase();
  const option = FEE_CURRENCY_BY_ADAPTER.get(key) ?? FEE_CURRENCY_BY_CONTRACT.get(key);
  return option?.adapterAddress ?? undefined;
};
