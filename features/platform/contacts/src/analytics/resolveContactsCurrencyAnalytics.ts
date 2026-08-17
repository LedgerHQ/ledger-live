import type { ContactAddress } from "@domain/entity-contact";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

export type ContactsCurrencyAnalytics = Readonly<{
  network: string;
  asset: string;
}>;

export type ResolveContactsCurrencyAnalyticsDependencies = Readonly<{
  findTokenById(currencyId: ContactAddress["currencyId"]): Promise<TokenCurrency | undefined>;
}>;

async function findTokenCurrency(
  currencyId: ContactAddress["currencyId"],
  findTokenById: ResolveContactsCurrencyAnalyticsDependencies["findTokenById"],
) {
  try {
    return await findTokenById(currencyId);
  } catch {
    return undefined;
  }
}

export async function resolveContactsCurrencyAnalytics(
  currencyId: ContactAddress["currencyId"],
  dependencies: ResolveContactsCurrencyAnalyticsDependencies,
): Promise<ContactsCurrencyAnalytics> {
  const cryptoCurrency = findCryptoCurrencyById(currencyId);

  if (cryptoCurrency) {
    return {
      network: cryptoCurrency.name,
      asset: cryptoCurrency.ticker,
    };
  }

  const token = await findTokenCurrency(currencyId, dependencies.findTokenById);

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
