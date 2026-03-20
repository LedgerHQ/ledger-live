import type { CryptoAssetState, CurrencyId, Timestamp } from "./schema";

export function mockCryptoAssetState(
  overrides?: Partial<CryptoAssetState>,
): CryptoAssetState {
  return {
    supportedCurrencyIds: [
      "bitcoin" as CurrencyId,
      "ethereum" as CurrencyId,
      "solana" as CurrencyId,
    ],
    lastSync: 1700000000000 as Timestamp,
    ...overrides,
  };
}
