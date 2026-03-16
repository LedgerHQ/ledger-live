import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { Transaction as CommonTransaction } from "@ledgerhq/live-common/generated/types";
import type {
  AleoCoinConfig,
  AleoTransactionType,
  Transaction,
} from "@ledgerhq/live-common/families/aleo/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

const getCryptoCurrency = (currency: CryptoCurrency | TokenCurrency): CryptoCurrency => {
  if (currency.type === "CryptoCurrency") {
    return currency;
  }

  return currency.parentCurrency;
};

export const getAleoCurrencyConfig = (
  currency: CryptoCurrency | TokenCurrency,
): AleoCoinConfig | undefined => {
  try {
    return getCurrencyConfiguration<AleoCoinConfig>(getCryptoCurrency(currency));
  } catch {
    return undefined;
  }
};

const TRANSACTION_TYPE_LABEL_KEYS: Record<AleoTransactionType, string> = {
  private: "aleo.operations.type.private",
  public: "aleo.operations.type.public",
};

export const getAleoTransactionTypeLabelKey = (
  transaction: Transaction | CommonTransaction,
): string =>
  transaction.family === "aleo" && isPrivateTransaction(transaction)
    ? TRANSACTION_TYPE_LABEL_KEYS.private
    : TRANSACTION_TYPE_LABEL_KEYS.public;
