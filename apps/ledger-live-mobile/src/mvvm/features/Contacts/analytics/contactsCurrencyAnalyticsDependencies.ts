import type { ResolveContactsCurrencyAnalyticsDependencies } from "@features/platform-contacts";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

export const contactsCurrencyAnalyticsDependencies: ResolveContactsCurrencyAnalyticsDependencies = {
  findTokenById: currencyId => getCryptoAssetsStore().findTokenById(currencyId),
};
