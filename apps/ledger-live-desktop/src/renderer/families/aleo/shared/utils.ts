import type { BigNumber } from "bignumber.js";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { isCryptoCurrency } from "@ledgerhq/live-common/currencies/helpers";
import {
  formatCurrencyUnit,
  type formatCurrencyUnitOptions,
} from "@ledgerhq/live-common/currencies/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import {
  derivePrivateTransactionMode,
  derivePublicTransactionMode,
  isPrivateTransaction,
  isSelfTransferTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import type {
  AleoAccount,
  AleoCoinConfig,
  AleoTokenAccount,
  Transaction as AleoTransaction,
} from "@ledgerhq/live-common/families/aleo/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency, TokenCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";
import { PRIVATE_BALANCE_PLACEHOLDER } from "../constants";

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

export function isAleoAccount(acc: AccountLike): acc is AleoAccount | AleoTokenAccount {
  const currency =
    acc.type === "Account" ? acc.currency : getCryptoCurrencyById(acc.token.parentCurrencyId);
  return currency.family === "aleo";
}

export function isAleoTransaction(tx: Transaction): tx is AleoTransaction {
  return tx.family === "aleo";
}

function isPrivateDestination(transaction: AleoTransaction): boolean {
  return (
    transaction.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE
  );
}

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
