import { useCallback, useMemo } from "react";
import { listCryptoCurrencies, listTokens } from "@ledgerhq/live-common/currencies/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { RampCatalogEntry } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/types";
import { getAllSupportedCryptoCurrencyIds } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import coinifyIcon from "~/renderer/images/coinifyLogo.png";
export const useRampCatalogCurrencies = (entries: RampCatalogEntry[]) => {
  const devMode = useEnv("MANAGER_DEV_MODE");

  // fetching all live supported currencies including tokens
  const cryptoCurrencies = useMemo(() => listCryptoCurrencies(devMode).concat(listTokens()), [
    devMode,
  ]);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  // cherry picking only those available in coinify

  const supportedCurrenciesIds = getAllSupportedCryptoCurrencyIds(entries);
  /** $FlowFixMe */
  const supportedCryptoCurrencies = cryptoCurrencies.filter(
    currency =>
      supportedCurrenciesIds.includes(currency.id) && !blacklistedTokenIds.includes(currency.id),
  );
  return supportedCryptoCurrencies;
};
export const getAccountsForCurrency = (
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: AccountLike[],
): AccountLike[] => {
  return allAccounts.filter(
    account =>
      (account.type === "TokenAccount" ? account.token.id : account.currency.id) === currency.id,
  );
};
const PROVIDERS = {
  COINIFY: {
    id: "Coinify",
    iconResource: coinifyIcon,
  },
};
let exchangeProvider = PROVIDERS.COINIFY;

// @TODO move this switch logic in settings maybe
export const useExchangeProvider = () => {
  const setProvider = useCallback(
    (p: { id: string; iconResource: any }) => (exchangeProvider = p),
    [],
  );
  return [exchangeProvider, setProvider];
};
