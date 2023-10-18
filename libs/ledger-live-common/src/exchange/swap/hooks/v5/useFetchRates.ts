import { getAvailableProviders } from "../..";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/coin-framework/account/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { fetchRates } from "../../api/v5/fetchRates";
import { useAPI } from "../../../../hooks/useAPI";
import { ExchangeRate } from "../../types";

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
  const unitFrom = fromCurrencyAccount ? getAccountUnit(fromCurrencyAccount) : undefined;
  const unitTo = toCurrency?.units[0];

  const formattedCurrencyAmount =
    (unitFrom && formatCurrencyUnit(unitFrom, fromCurrencyAmount)) ?? "0";

  const toCurrencyId = toCurrency?.id;
  return useAPI({
    queryFn: fetchRates,
    queryProps: {
      providers: getAvailableProviders(),
      unitTo: unitTo!,
      unitFrom: unitFrom!,
      currencyFrom,
      toCurrencyId,
      fromCurrencyAmount: formattedCurrencyAmount,
    },
    staleTimeout: 50000,
    enabled: !!toCurrencyId && !!currencyFrom && fromCurrencyAmount.gt(0) && !!unitFrom && !!unitTo,
    onSuccess,
  });
}
