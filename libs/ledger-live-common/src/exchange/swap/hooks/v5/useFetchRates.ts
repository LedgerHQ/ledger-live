import { getAvailableProviders } from "../..";
import { useAPI } from "../common/useAPI";
import { fetchRates } from "../../api/v5/fetchRates";
import { areAllItemsDefined } from "../../utils/areAllItemsDefined";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/coin-framework/account/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";

type Props = {
  accountFrom: AccountLike | undefined;
  toCurrency: CryptoOrTokenCurrency | undefined;
  fromCurrencyAmount: BigNumber;
};

export function useFetchRates({ accountFrom, toCurrency, fromCurrencyAmount }: Props) {
  const currencyFrom = accountFrom ? getAccountCurrency(accountFrom).id : undefined;
  const unit = accountFrom ? getAccountUnit(accountFrom) : undefined;

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
    enabled: areAllItemsDefined(toCurrencyId, currencyFrom) && fromCurrencyAmount.gt(0),
  });
}
