import { getAvailableProviders } from "../..";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/coin-framework/account/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { fetchRates } from "../../api/v5/fetchRates";
import { useAPI } from "../../../../hooks/useAPI";

type Props = {
  fromCurrencyAccount: AccountLike | undefined;
  toCurrency: CryptoOrTokenCurrency | undefined;
  fromCurrencyAmount: BigNumber;
};

export function useFetchRates({ fromCurrencyAccount, toCurrency, fromCurrencyAmount }: Props) {
  const currencyFrom = fromCurrencyAccount ? getAccountCurrency(fromCurrencyAccount).id : undefined;
  const unit = fromCurrencyAccount ? getAccountUnit(fromCurrencyAccount) : undefined;

  const formattedCurrencyAmount = (unit && formatCurrencyUnit(unit, fromCurrencyAmount)) ?? "0";

  const toCurrencyId = toCurrency?.id;
  return useAPI({
    queryFn: fetchRates,
    queryProps: {
      providers: getAvailableProviders(),
      currencyFrom,
      toCurrencyId,
      fromCurrencyAmount: formattedCurrencyAmount,
    },
    enabled: !!toCurrencyId && !!currencyFrom && fromCurrencyAmount.gt(0),
  });
}
