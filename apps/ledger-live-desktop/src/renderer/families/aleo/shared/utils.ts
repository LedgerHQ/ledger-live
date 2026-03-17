import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { isCryptoCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoCoinConfig, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const getAleoCurrencyConfig = (
  currency: CryptoCurrency | TokenCurrency,
): AleoCoinConfig | undefined => {
  try {
    const cryptoCurrency = isCryptoCurrency(currency) ? currency : currency.parentCurrency;
    return getCurrencyConfiguration<AleoCoinConfig>(cryptoCurrency);
  } catch {
    return undefined;
  }
};

export const getAleoTransactionTypeLabelKey = (transaction: Transaction): string => {
  return isPrivateTransaction(transaction)
    ? "aleo.operations.type.private"
    : "aleo.operations.type.public";
};
