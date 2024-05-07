import { getAvailableProviders } from "../..";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { fetchRates } from "../../api/v5/fetchRates";
import { useAPI } from "../../../../hooks/useAPI";
import { ExchangeRate } from "../../types";
import { useFeature } from "../../../../featureFlags";

type Props = {
  fromCurrencyAccount: AccountLike | undefined;
  toCurrency: CryptoOrTokenCurrency | undefined;
  fromCurrencyAmount: BigNumber;
  onSuccess?(data: ExchangeRate[]): void;
};

export function useFetchRates({
  fromCurrencyAccount,
  toCurrency,
  fromCurrencyAmount,
  onSuccess,
}: Props) {
  const currencyFrom = fromCurrencyAccount ? getAccountCurrency(fromCurrencyAccount).id : undefined;
  const unitFrom = fromCurrencyAccount
    ? getAccountCurrency(fromCurrencyAccount).units[0]
    : undefined;
  const unitTo = toCurrency?.units[0];
  const moonpayFF = useFeature("ptxSwapMoonpayProvider");
  const formattedCurrencyAmount =
    (unitFrom && `${fromCurrencyAmount.shiftedBy(-unitFrom.magnitude)}`) ?? "0";
  const providers = getAvailableProviders();

  if (!moonpayFF?.enabled) {
    providers.splice(providers.indexOf("moonpay"), 1);
  }
  const toCurrencyId = toCurrency?.id;
  return useAPI({
    queryFn: fetchRates,
    queryProps: {
      providers: providers,
      unitTo: unitTo!,
      unitFrom: unitFrom!,
      currencyFrom,
      toCurrencyId,
      fromCurrencyAmount: formattedCurrencyAmount,
    },
    staleTimeout: 20000,
    enabled: !!toCurrencyId && !!currencyFrom && fromCurrencyAmount.gt(0) && !!unitFrom && !!unitTo,
    onSuccess,
  });
}
