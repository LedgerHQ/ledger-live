import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  DEPOSIT_FORM_ERROR_ANALYTICS_MESSAGES,
  PERPS_DEPOSIT_ANALYTICS_CONTEXT,
  findDepositParentAccount,
  getDepositBaseError,
  getDepositBuyTarget,
  resolveDepositFormError,
  type DepositBuyTarget,
  type DepositErrorDetails,
  type DepositFormError,
} from "./formError";
import { getDepositSpendableBalance } from "./coinErrors";
import type { PerpsDepositQuote, PerpsDepositQuoteResult } from "./quote";
import { cancelDepositRequest } from "./request";
import { usePerpsDepositQuote } from "./useDepositQuote";

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
}: Readonly<{
  depositAccount: AccountLike | undefined;
  parentAccount: Account | undefined;
  depositAmount: number;
  maxAmount: number | null;
  convertedAmount: BigNumber | null;
}>): DepositAmountState {
  const baseError = getDepositBaseError({
    depositAccount,
    depositAmount,
    maxAmount,
    hasConversion: convertedAmount !== null,
    parentAccount,
  });
  const isFormComplete = depositAmount > 0 && Boolean(depositAccount) && baseError === null;
  const sentAmountAtomic =
    isFormComplete && depositAccount && convertedAmount
      ? BigNumber.min(convertedAmount, getDepositSpendableBalance(depositAccount)).integerValue(
          BigNumber.ROUND_FLOOR,
        )
      : undefined;
  return { baseError, isFormComplete, sentAmountAtomic };
}

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
}: UseDepositFormErrorsParams): DepositFormErrors {
  /** What the user typed comes first; a missing quote only matters once it is valid. */
  const statusError = useMemo(
    () =>
      resolveDepositFormError({
        isOffline,
        baseError,
        depositAccount,
        parentAccount,
        depositAmount,
        sentAmountAtomic,
        quoteResult,
        locale,
      }),
    [
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

  const trackedErrorCodeRef = useRef<string | null>(null);
  useEffect(() => {
    if (isQuoteLoading) return;
    const code = statusError?.code ?? null;
    if (code === trackedErrorCodeRef.current) return;
    trackedErrorCodeRef.current = code;
    if (!code) return;
    track("swap error message", {
      message: DEPOSIT_FORM_ERROR_ANALYTICS_MESSAGES[code],
      ...analyticsProperties,
    });
  }, [analyticsProperties, isQuoteLoading, statusError?.code, track]);

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
    canLearnMore: buyTarget !== null || supportUrl !== undefined,
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
  maxAmount: number | null;
  toCurrencyAmount: (currency: ReturnType<typeof getAccountCurrency>) => BigNumber | null;
  isOffline: boolean;
  refreshGeneration: number;
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
  }>;

export function usePerpsDepositForm({
  accounts,
  receiverAccount,
  depositAccount,
  depositAmount,
  maxAmount,
  toCurrencyAmount,
  isOffline,
  refreshGeneration,
  counterValueCurrency,
  locale,
  sourceCurrency,
  getAccountName,
  track,
  openBuy,
  openSupportUrl,
}: UsePerpsDepositFormParams): PerpsDepositForm {
  const parentAccount = useMemo(
    () => (depositAccount ? findDepositParentAccount(depositAccount, accounts) : undefined),
    [accounts, depositAccount],
  );

  const convertedAmount = useMemo(
    () => (depositAccount ? toCurrencyAmount(getAccountCurrency(depositAccount)) : null),
    [depositAccount, toCurrencyAmount],
  );

  const amountState = useMemo(
    () =>
      getDepositAmountState({
        depositAccount,
        parentAccount,
        depositAmount,
        maxAmount,
        convertedAmount,
      }),
    [convertedAmount, depositAccount, depositAmount, maxAmount, parentAccount],
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
  });

  return { ...formErrors, sentAmount, quote: quoteResult?.quote, isQuoteLoading };
}
