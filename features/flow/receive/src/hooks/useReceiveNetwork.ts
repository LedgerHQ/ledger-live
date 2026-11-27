import type { CryptoOrTokenCurrency, CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { useCryptoCurrencyById, useCurrencyById } from "@features/platform-currencies";

type CryptoCurrency = Extract<CryptoOrTokenCurrency, { type: "CryptoCurrency" }>;

export type ReceiveNetwork = Readonly<{
  asset: CryptoOrTokenCurrency | undefined;
  network: CryptoCurrency | undefined;
}>;

/** The asset received and the coin of its network (the coin itself, or a token's parent), once known. */
export function useReceiveNetwork(assetId: CryptoOrTokenCurrencyId): ReceiveNetwork {
  const { currency: asset } = useCurrencyById(assetId);
  const parent = useCryptoCurrencyById(
    asset?.type === "TokenCurrency" ? asset.parentCurrencyId : undefined,
  );
  return { asset, network: asset?.type === "CryptoCurrency" ? asset : parent };
}
