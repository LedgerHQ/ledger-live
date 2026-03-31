import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { isCryptoCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
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

export const getAleoAddressBadgeI18nKey = (
  transaction: Transaction,
  direction: "from" | "to",
): string => {
  if (direction === "from") {
    return isPrivateTransaction(transaction)
      ? "aleo.operations.type.private"
      : "aleo.operations.type.public";
  }

  return transaction.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
    ? "aleo.operations.type.private"
    : "aleo.operations.type.public";
};
