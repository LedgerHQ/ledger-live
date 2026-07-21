import type { BigNumber } from "bignumber.js";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { isCryptoCurrency } from "@ledgerhq/live-common/currencies/helpers";
import {
  formatCurrencyUnit,
  type formatCurrencyUnitOptions,
} from "@ledgerhq/live-common/currencies/index";
import { PRIVATE_BALANCE_PLACEHOLDER } from "@ledgerhq/live-common/families/aleo/constants";
import {
  derivePrivateTransactionMode,
  derivePublicTransactionMode,
  isPrivateDestination,
  isPrivateTransaction,
  isSelfTransferTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import type {
  AleoCoinConfig,
  Transaction as AleoTransaction,
} from "@ledgerhq/live-common/families/aleo/types";
import type { CryptoCurrency, TokenCurrency, Unit } from "@ledgerhq/ledger-wallet-framework/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

export {
  isAleoAccount,
  isAleoTransaction,
  getMaxPrivateRecordsForAccount,
} from "@ledgerhq/live-common/families/aleo/utils";

export const getAleoCurrencyConfig = (
  currency: CryptoCurrency | TokenCurrency,
): AleoCoinConfig | undefined => {
  try {
    const cryptoCurrency = isCryptoCurrency(currency)
      ? currency
      : getCryptoCurrencyById(currency.parentCurrencyId);
    return getCurrencyConfiguration<AleoCoinConfig>(cryptoCurrency.id);
  } catch {
    return undefined;
  }
};

export function getAleoAddressBadgeI18nKey(
  transaction: AleoTransaction,
  direction: "from" | "to",
): string {
  const isPrivate =
    direction === "from" ? isPrivateTransaction(transaction) : isPrivateDestination(transaction);

  return isPrivate ? "aleo.operations.type.private" : "aleo.operations.type.public";
}

export function applyAleoBalanceSourceChange(
  transaction: AleoTransaction,
  source: "public" | "private",
): AleoTransaction {
  const isSelfTransfer = isSelfTransferTransaction(transaction);
  const isTokenTx = !!transaction.subAccountId;

  if (source === "public") {
    const { properties: _ignoredProperties, ...txWithoutProperties } = transaction;

    return {
      ...txWithoutProperties,
      mode: derivePublicTransactionMode({ isTokenTx, isSelfTransfer }),
    };
  }

  return {
    ...transaction,
    mode: derivePrivateTransactionMode({ isTokenTx, isSelfTransfer }),
    properties: {
      amountRecordCommitments: [],
      feeRecordCommitment: null,
    },
  };
}

export function formatAleoBalances({
  unit,
  balances,
  formatConfig,
}: {
  unit: Unit;
  formatConfig: formatCurrencyUnitOptions;
  balances: {
    spendableBalance: BigNumber;
    transparentBalance: BigNumber;
    privateBalance: BigNumber | null;
  };
}) {
  return {
    available: formatCurrencyUnit(unit, balances.spendableBalance, formatConfig),
    transparent: formatCurrencyUnit(unit, balances.transparentBalance, formatConfig),
    private: balances.privateBalance
      ? formatCurrencyUnit(unit, balances.privateBalance, formatConfig)
      : PRIVATE_BALANCE_PLACEHOLDER,
  };
}
