import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const getProvider = (
  currency: CryptoCurrency | TokenCurrency,
  currenciesByProvider: CurrenciesByProviderId[],
) =>
  currency &&
  currenciesByProvider.find(elem =>
    elem.currenciesByNetwork.some(
      currencyByNetwork => (currencyByNetwork as CryptoCurrency | TokenCurrency).id === currency.id,
    ),
  );
