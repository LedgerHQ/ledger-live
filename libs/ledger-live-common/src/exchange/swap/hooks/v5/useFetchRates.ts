import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useFeature } from "../../../../featureFlags";
import { useAPI } from "../../../../hooks/useAPI";
import { fetchRates } from "../../api/v5/fetchRates";
import { ExchangeRate } from "../../types";

type Props = {
  fromCurrencyAccount: AccountLike | undefined;
  toCurrency: CryptoOrTokenCurrency | undefined;
  fromCurrencyAmount: BigNumber;
  onSuccess?(data: ExchangeRate[]): void;
  isEnabled?: boolean;
};

export function useFetchRates({
  fromCurrencyAccount,
  toCurrency,
  fromCurrencyAmount,
  onSuccess,
  isEnabled = true,
}: Props) {
  const currencyFrom = fromCurrencyAccount ? getAccountCurrency(fromCurrencyAccount).id : undefined;
  const unitFrom = fromCurrencyAccount
    ? getAccountCurrency(fromCurrencyAccount).units[0]
    : undefined;
  const unitTo = toCurrency?.units[0];
  const moonpayFF = useFeature("ptxSwapMoonpayProvider");
  const removeProviders: string[] = [];
  const formattedCurrencyAmount =
    (unitFrom && `${fromCurrencyAmount.shiftedBy(-unitFrom.magnitude)}`) ?? "0";

  if (!moonpayFF?.enabled) {
    removeProviders.push("moonpay");
  }
  const toCurrencyId = toCurrency?.id;
  return useAPI({
    queryFn: fetchRates,
    queryProps: {
      removeProviders: [],
      unitTo: unitTo!,
      unitFrom: unitFrom!,
      currencyFrom,
      toCurrencyId,
      fromCurrencyAmount: formattedCurrencyAmount,
    },
    staleTimeout: 20000,
    enabled:
      !!toCurrencyId &&
      !!currencyFrom &&
      fromCurrencyAmount.gt(0) &&
      !!unitFrom &&
      !!unitTo &&
      isEnabled,
    onSuccess,
  });
}
