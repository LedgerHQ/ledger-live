import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  DEPOSIT_FORM_ERROR_ANALYTICS_MESSAGES,
  PERPS_DEPOSIT_ANALYTICS_CONTEXT,
  getDepositBaseError,
  getDepositBuyTarget,
  getDepositFeeAccount,
  resolveDepositFormError,
  type DepositBuyTarget,
  type DepositErrorDetails,
  type DepositFormError,
} from "./formError";
import { readStoredSpendableBalance, type SpendableBalanceReader } from "./coinErrors";
import {
  findDepositParentAccount,
  type PerpsDepositQuote,
  type PerpsDepositQuoteResult,
} from "./quote";
import { cancelDepositRequest } from "./request";
import { usePerpsDepositQuote } from "./useDepositQuote";
import { useWalletApiSpendableBalance } from "./useWalletApiSpendableBalance";

export function toConvertedDepositAmount(converted: number | null | undefined): BigNumber | null {
  return converted === null || converted === undefined ? null : new BigNumber(converted);
}

export type DepositAmountState = Readonly<{
  baseError: DepositFormError | null;
  isFormComplete: boolean;
  sentAmountAtomic: BigNumber | undefined;
}>;

export function getDepositAmountState({
  depositAccount,
  parentAccount,
  depositAmount,
  maxAmount,
  convertedAmount,
  getSpendableBalance = readStoredSpendableBalance,
}: Readonly<{
  depositAccount: AccountLike | undefined;
  parentAccount: Account | undefined;
  depositAmount: number;
  maxAmount: number | null;
  convertedAmount: BigNumber | null;
  getSpendableBalance?: SpendableBalanceReader;
}>): DepositAmountState {
  const baseError = getDepositBaseError({
    depositAccount,
    depositAmount,
    maxAmount,
    hasConversion: convertedAmount !== null,
    parentAccount,
    getSpendableBalance,
  });
  const isFormComplete = depositAmount > 0 && Boolean(depositAccount) && baseError === null;
  const sentAmountAtomic =
    isFormComplete && depositAccount && convertedAmount
      ? BigNumber.min(convertedAmount, getSpendableBalance(depositAccount)).integerValue(
          BigNumber.ROUND_FLOOR,
        )
      : undefined;
  return { baseError, isFormComplete, sentAmountAtomic };
}

const BALANCE_PENDING_STATE: DepositAmountState = {
  baseError: null,
  isFormComplete: false,
  sentAmountAtomic: undefined,
};

export type DepositTrack = (event: string, properties: Record<string, string>) => void;

export type UseDepositFormErrorsParams = Readonly<{
  amountState: DepositAmountState;
  isOffline: boolean;
  depositAccount: AccountLike | undefined;
  parentAccount: Account | undefined;
  depositAmount: number;
  quoteResult: PerpsDepositQuoteResult | undefined;
  isQuoteLoading: boolean;
  locale: string;
  sourceCurrency: string;
  targetCurrency: string;
  getAccountName: (account: AccountLike) => string;
  track: DepositTrack;
  openBuy: (target: DepositBuyTarget) => void;
  openSupportUrl: (url: string) => void;
  getSpendableBalance?: SpendableBalanceReader;
  isBalancePending?: boolean;
}>;

export type DepositFormErrors = Readonly<{
  statusError: DepositFormError | null;
  canReview: boolean;
  exceedsBalance: boolean;
  canLearnMore: boolean;
  isDetailsOpen: boolean;
  details: DepositErrorDetails | null;
  openDetails: () => void;
  closeDetails: () => void;
  buyFromDetails: () => void;
}>;

export function useDepositFormErrors({
  amountState: { baseError, isFormComplete, sentAmountAtomic },
  isOffline,
  depositAccount,
  parentAccount,
  depositAmount,
  quoteResult,
  isQuoteLoading,
  locale,
  sourceCurrency,
  targetCurrency,
  getAccountName,
  track,
  openBuy,
  openSupportUrl,
  getSpendableBalance,
  isBalancePending = false,
}: UseDepositFormErrorsParams): DepositFormErrors {
  /** What the user typed comes first; a missing quote only matters once it is valid. */
  const statusError = useMemo(
    () =>
      isBalancePending
        ? null
        : resolveDepositFormError({
            isOffline,
            baseError,
            depositAccount,
            parentAccount,
            depositAmount,
            sentAmountAtomic,
            quoteResult,
            locale,
            getSpendableBalance,
          }),
    [
      isBalancePending,
      getSpendableBalance,
      baseError,
      depositAccount,
      depositAmount,
      isOffline,
      locale,
      parentAccount,
      quoteResult,
      sentAmountAtomic,
    ],
  );

  const analyticsProperties = useMemo(
    () => ({ ...PERPS_DEPOSIT_ANALYTICS_CONTEXT, sourceCurrency, targetCurrency }),
    [sourceCurrency, targetCurrency],
  );

  const trackedErrorKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (isQuoteLoading || isBalancePending) return;
    const code = statusError?.code ?? null;
    const key = code && [code, sourceCurrency, targetCurrency].join("|");
    if (key === trackedErrorKeyRef.current) return;
    trackedErrorKeyRef.current = key;
    if (!code) return;
    track("swap error message", {
      message: DEPOSIT_FORM_ERROR_ANALYTICS_MESSAGES[code],
      ...analyticsProperties,
    });
  }, [
    analyticsProperties,
    isBalancePending,
    isQuoteLoading,
    sourceCurrency,
    statusError?.code,
    targetCurrency,
    track,
  ]);

  const buyTarget = useMemo(
    () => getDepositBuyTarget({ statusError, depositAccount, parentAccount, getAccountName }),
    [depositAccount, getAccountName, parentAccount, statusError],
  );

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [openedBuyTarget, setOpenedBuyTarget] = useState<DepositBuyTarget | null>(null);

  const supportUrl = statusError?.supportUrl;

  const openDetails = useCallback(() => {
    if (!buyTarget && !supportUrl) return;
    track("button_clicked", { button: "learn more", ...analyticsProperties });
    if (supportUrl) {
      openSupportUrl(supportUrl);
      return;
    }
    setOpenedBuyTarget(buyTarget);
    setIsDetailsOpen(true);
  }, [analyticsProperties, buyTarget, openSupportUrl, supportUrl, track]);

  const closeDetails = useCallback(() => setIsDetailsOpen(false), []);

  const buyFromDetails = useCallback(() => {
    if (!openedBuyTarget) return;
    track("button_clicked", {
      button: "buy more crypto",
      currency: openedBuyTarget.details.buyTicker,
      ...analyticsProperties,
    });
    setIsDetailsOpen(false);
    cancelDepositRequest();
    openBuy(openedBuyTarget);
  }, [analyticsProperties, openBuy, openedBuyTarget, track]);

  return {
    statusError,
    canReview: isFormComplete && quoteResult?.quote !== undefined && statusError === null,
    exceedsBalance: statusError?.code === "insufficientBalance",
    canLearnMore: buyTarget !== null || Boolean(supportUrl),
    isDetailsOpen,
    details: openedBuyTarget?.details ?? null,
    openDetails,
    closeDetails,
    buyFromDetails,
  };
}

export type UsePerpsDepositFormParams = Readonly<{
  accounts: AccountLike[];
  receiverAccount: AccountLike;
  depositAccount: AccountLike | undefined;
  depositAmount: number;
  toCurrencyAmount: (currency: ReturnType<typeof getAccountCurrency>) => BigNumber | null;
  toFiatAmount: (
    currency: ReturnType<typeof getAccountCurrency>,
    atomicAmount: BigNumber,
  ) => number | null;
  isOffline: boolean;
  counterValueCurrency: string;
  locale: string;
  sourceCurrency: string;
  getAccountName: (account: AccountLike) => string;
  track: DepositTrack;
  openBuy: (target: DepositBuyTarget) => void;
  openSupportUrl: (url: string) => void;
}>;

export type PerpsDepositForm = DepositFormErrors &
  Readonly<{
    sentAmount: string;
    quote: PerpsDepositQuote | undefined;
    isQuoteLoading: boolean;
    refreshQuote: () => void;
    maxAmount: number | null;
    depositSpendableBalance: BigNumber | undefined;
  }>;

export function usePerpsDepositForm({
  accounts,
  receiverAccount,
  depositAccount,
  depositAmount,
  toCurrencyAmount,
  toFiatAmount,
  isOffline,
  counterValueCurrency,
  locale,
  sourceCurrency,
  getAccountName,
  track,
  openBuy,
  openSupportUrl,
}: UsePerpsDepositFormParams): PerpsDepositForm {
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const refreshQuote = useCallback(() => setRefreshGeneration(generation => generation + 1), []);

  const parentAccount = useMemo(
    () => (depositAccount ? findDepositParentAccount(depositAccount, accounts) : undefined),
    [accounts, depositAccount],
  );

  const feeAccount = depositAccount
    ? getDepositFeeAccount(depositAccount, parentAccount)
    : undefined;
  const depositBalanceState = useWalletApiSpendableBalance(depositAccount, parentAccount);
  const needsFeeBalance = feeAccount !== undefined && feeAccount !== depositAccount;
  const feeBalanceState = useWalletApiSpendableBalance(
    needsFeeBalance ? feeAccount : undefined,
    undefined,
  );
  const depositWalletApiBalance = depositBalanceState.balance;
  const feeWalletApiBalance = feeBalanceState.balance;
  const isBalanceRefreshing = depositBalanceState.isRefreshing || feeBalanceState.isRefreshing;
  const isBalancePending =
    (depositAccount !== undefined && depositWalletApiBalance === undefined) ||
    (needsFeeBalance && feeWalletApiBalance === undefined);
  const getSpendableBalance = useCallback<SpendableBalanceReader>(
    account => {
      if (account === depositAccount) return depositWalletApiBalance ?? account.spendableBalance;
      if (account === feeAccount) return feeWalletApiBalance ?? account.spendableBalance;
      return account.spendableBalance;
    },
    [depositAccount, depositWalletApiBalance, feeAccount, feeWalletApiBalance],
  );
  const depositSpendableBalance = depositWalletApiBalance;
  const maxAmount = useMemo(
    () =>
      depositAccount && depositSpendableBalance
        ? toFiatAmount(getAccountCurrency(depositAccount), depositSpendableBalance)
        : null,
    [depositAccount, depositSpendableBalance, toFiatAmount],
  );

  const convertedAmount = useMemo(
    () => (depositAccount ? toCurrencyAmount(getAccountCurrency(depositAccount)) : null),
    [depositAccount, toCurrencyAmount],
  );

  const amountState = useMemo(
    () =>
      isBalancePending
        ? BALANCE_PENDING_STATE
        : getDepositAmountState({
            depositAccount,
            parentAccount,
            depositAmount,
            maxAmount,
            convertedAmount,
            getSpendableBalance,
          }),
    [
      convertedAmount,
      depositAccount,
      depositAmount,
      getSpendableBalance,
      isBalancePending,
      maxAmount,
      parentAccount,
    ],
  );

  const { sentAmountAtomic } = amountState;
  const sentAmount =
    sentAmountAtomic && depositAccount
      ? sentAmountAtomic.shiftedBy(-getAccountCurrency(depositAccount).units[0].magnitude).toFixed()
      : "";

  const { result: quoteResult, isLoading: isQuoteLoading } = usePerpsDepositQuote({
    accounts,
    depositAccount,
    receiverAccount,
    amount: sentAmount,
    isOffline,
    refreshGeneration,
    counterValueCurrency,
    locale,
    feeAccountBalance: feeAccount?.spendableBalance.toFixed(),
  });

  const formErrors = useDepositFormErrors({
    amountState,
    isOffline,
    depositAccount,
    parentAccount,
    depositAmount,
    quoteResult,
    isQuoteLoading,
    locale,
    sourceCurrency,
    targetCurrency: getAccountCurrency(receiverAccount).ticker,
    getAccountName,
    track,
    openBuy,
    openSupportUrl,
    getSpendableBalance,
    isBalancePending,
  });

  return {
    ...formErrors,
    canReview: formErrors.canReview && !isBalanceRefreshing,
    sentAmount,
    quote: quoteResult?.quote,
    isQuoteLoading,
    refreshQuote,
    maxAmount,
    depositSpendableBalance,
  };
}
