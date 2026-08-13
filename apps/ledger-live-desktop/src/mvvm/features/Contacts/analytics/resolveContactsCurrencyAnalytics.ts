import type { ContactAddress } from "@domain/entity-contact";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

export type ContactsCurrencyAnalytics = Readonly<{
  network: string;
  asset: string;
}>;

async function findTokenCurrency(currencyId: ContactAddress["currencyId"]) {
  try {
    return await getCryptoAssetsStore().findTokenById(currencyId);
  } catch {
    return undefined;
  }
}

export async function resolveContactsCurrencyAnalytics(
  currencyId: ContactAddress["currencyId"],
): Promise<ContactsCurrencyAnalytics> {
  const cryptoCurrency = findCryptoCurrencyById(currencyId);

  if (cryptoCurrency) {
    return {
      network: cryptoCurrency.name,
      asset: cryptoCurrency.ticker,
    };
  }

  const token = await findTokenCurrency(currencyId);

  if (token) {
    const parentCurrency = findCryptoCurrencyById(token.parentCurrencyId);

    return {
      network: parentCurrency?.name ?? token.parentCurrencyId,
      asset: token.ticker,
    };
  }

  const parentCurrency = findCryptoCurrencyById(currencyId.split("/")[0]);

  return {
    network: parentCurrency?.name ?? currencyId,
    asset: currencyId,
  };
}
