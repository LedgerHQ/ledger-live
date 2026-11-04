import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  useCalculateCountervalueCallback,
  useCountervaluesCache,
} from "@features/platform-market-countervalues";
import { calculate } from "@domain/entity-market-countervalues";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { formatCurrencyUnit, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import type { PerpsDepositUiParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { getDepositMaxBuffer } from "@ledgerhq/live-common/wallet-api/Perps/deposit/maxBuffer";
import { useFeature } from "@features/platform-feature-flags";
import { track } from "@shared/analytics";
import { useNetworkState } from "@shared/network-status";
import { cancelDepositRequest } from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";
import {
  DEPOSIT_FORM_ERROR_ANALYTICS_MESSAGES,
  getDepositBaseError,
  getDepositFeeAccount,
  resolveDepositFormError,
  type DepositFormError,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/formError";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { setFlowValue } from "~/renderer/reducers/modularDialog";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import {
  PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
  PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
} from "../../constants/depositFunding";
import { openPerpsReview } from "../PerpsReview/PerpsReviewDialog";
import { usePerpsDepositQuote } from "./usePerpsDepositQuote";
import { applyRatio } from "LLD/features/Perps/utils/applyRatio";
import { toAmountValue } from "LLD/features/Perps/utils/toAmountValue";
import { buildBuyNavigationState } from "LLD/features/Market/utils/buyNavigation";

/** Snapshot of the amount-entry form, used to restore it when re-opened. */
export type PerpsDepositDraft = Readonly<{
  depositAccount: AccountLike;
  depositAmount: number;
}>;

export type PerpsDepositData = PerpsDepositUiParams & {
  draft?: PerpsDepositDraft;
};

const EMPTY_AMOUNT_TEXT = "0";

const DEPOSIT_PAGE = "perps_deposit";
const PERPS_FLOW = "perps";

export type PerpsDepositDetails = Readonly<{
  titleKey: string;
  descriptionKey: string;
  values: Record<string, string>;
  buyTicker: string;
}>;

type BuyTarget = Readonly<{
  account: AccountLike;
  parentAccount: Account | undefined;
  details: PerpsDepositDetails;
}>;

/** Serializes a computed amount (ratio, max, draft) as input text. */
function toAmountText(amount: number | undefined): string {
  return amount ? new BigNumber(amount).toFixed() : EMPTY_AMOUNT_TEXT;
}

export type PerpsDepositViewModel = Readonly<{
  headerDescription: string | undefined;
  amountText: string;
  depositAmount: number;
  formattedQuotedAmount: string;
  isQuoteLoading: boolean;
  counterValueCode: string;
  maxDecimalLength: number;
  changeDepositAmount: (formattedValue: string) => void;
  selectAmountRatio: (amount: number) => void;
  depositCurrencyTicker: string;
  depositCurrencyLedgerId: string;
  depositAccountName: string | null;
  depositAccountCounterValue: string | null;
  maxAmount: number;
  maxBuffer: number;
  selectMax: () => void;
  statusError: DepositFormError | null;
  canLearnMore: boolean;
  details: PerpsDepositDetails | null;
  openDetails: () => void;
  closeDetails: () => void;
  buyFromDetails: () => void;
  canReview: boolean;
  exceedsBalance: boolean;
  missingAccount: boolean;
  pickDepositAccount: () => void;
  handleReview: () => void;
}>;

export function usePerpsDepositViewModel(
  data: PerpsDepositData,
  onClose: () => void,
): PerpsDepositViewModel {
  const walletState = useSelector(walletSelector);
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { openAssetAndAccountPromise } = useOpenAssetAndAccount();
  const navigate = useNavigate();
  const { isConnected, isInternetReachable } = useNetworkState();
  const isOffline = isConnected === false || isInternetReachable === false;

  const [depositAccountId, setDepositAccountId] = useState(data.draft?.depositAccount.id);
  const [amountText, setAmountText] = useState(() => toAmountText(data.draft?.depositAmount));
  const dispatch = useDispatch();

  useEffect(() => {
    setDepositAccountId(data.draft?.depositAccount.id);
    setAmountText(toAmountText(data.draft?.depositAmount));
  }, [data]);

  /** The input owns the text it displays; the number is derived for quoting and validation. */
  const depositAmount = useMemo(() => {
    const parsed = Number(amountText.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountText]);

  /** Fills the input with the amount a ratio pill resolved to. */
  const selectAmountRatio = useCallback(
    (amount: number) => setAmountText(toAmountText(amount)),
    [],
  );

  /** The USDC funding account with the highest spendable balance, used as the default. */
  const defaultDepositAccount = useMemo(
    () =>
      accounts
        .filter(
          (acc): acc is TokenAccount =>
            acc.type === "TokenAccount" &&
            acc.token.id === PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID &&
            acc.spendableBalance.gt(0),
        )
        .reduce<TokenAccount | undefined>(
          (best, acc) => (!best || acc.spendableBalance.gt(best.spendableBalance) ? acc : best),
          undefined,
        ),
    [accounts],
  );

  /** Read from the store so balances stay live while the form is open. */
  const depositAccount = useMemo(
    () => accounts.find(account => account.id === depositAccountId) ?? defaultDepositAccount,
    [accounts, depositAccountId, defaultDepositAccount],
  );

  const parentAccount = useMemo(
    () =>
      depositAccount?.type === "TokenAccount"
        ? accounts.find((account): account is Account => account.id === depositAccount.parentId)
        : undefined,
    [accounts, depositAccount],
  );

  const receiverAccount = data.receiverAccount;
  const receiverCurrency = useMemo(() => getAccountCurrency(receiverAccount), [receiverAccount]);
  const depositCurrency = useMemo(
    () => (depositAccount ? getAccountCurrency(depositAccount) : undefined),
    [depositAccount],
  );

  const counterValueUnit = counterValueCurrency.units[0];
  const maxDecimalLength = Math.max(0, counterValueUnit.magnitude);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const countervaluesState = useCountervaluesCache();

  /** Prices the typed amount back into `currency`, in its smallest unit. */
  const toCurrencyAmount = useCallback(
    (currency: CryptoOrTokenCurrency): BigNumber | null => {
      const converted = calculate(countervaluesState, {
        from: currency,
        to: counterValueCurrency,
        value: new BigNumber(depositAmount).shiftedBy(counterValueUnit.magnitude).toNumber(),
        reverse: true,
        disableRounding: true,
      });
      return converted === null || converted === undefined ? null : new BigNumber(converted);
    },
    [counterValueCurrency, counterValueUnit.magnitude, countervaluesState, depositAmount],
  );

  const receiverAccountName = useMemo(
    () => accountNameWithDefaultSelector(walletState, receiverAccount),
    [receiverAccount, walletState],
  );

  const receiverAccountCounterValue = useMemo(() => {
    const counterValue =
      calculateCountervalue(receiverCurrency, receiverAccount.spendableBalance) ?? new BigNumber(0);
    return formatCurrencyUnit(counterValueUnit, counterValue, {
      showCode: true,
      discreet,
      locale,
    });
  }, [
    calculateCountervalue,
    counterValueUnit,
    discreet,
    locale,
    receiverAccount.spendableBalance,
    receiverCurrency,
  ]);

  const depositAccountBalanceCounterValue = useMemo(() => {
    if (!depositAccount || !depositCurrency) return null;
    return calculateCountervalue(depositCurrency, depositAccount.spendableBalance) ?? null;
  }, [calculateCountervalue, depositAccount, depositCurrency]);

  const depositAccountCounterValue = useMemo(() => {
    if (!depositAccountBalanceCounterValue) return null;
    return formatCurrencyUnit(counterValueUnit, depositAccountBalanceCounterValue, {
      showCode: true,
      discreet,
      locale,
    });
  }, [counterValueUnit, depositAccountBalanceCounterValue, discreet, locale]);

  const maxAmount = useMemo(
    () =>
      depositAccountBalanceCounterValue?.shiftedBy(-counterValueUnit.magnitude).toNumber() ?? null,
    [counterValueUnit.magnitude, depositAccountBalanceCounterValue],
  );

  const tradeMaxConstant = useFeature("ptxTradeMaxConstant");
  const maxBuffer = useMemo(() => {
    if (!tradeMaxConstant?.enabled || !depositAccount || !depositCurrency) return 0;
    const buffer = getDepositMaxBuffer(depositAccount, tradeMaxConstant.params?.constants);
    if (buffer.isZero()) return 0;
    return (
      calculateCountervalue(depositCurrency, buffer)
        ?.shiftedBy(-counterValueUnit.magnitude)
        .toNumber() ?? 0
    );
  }, [
    calculateCountervalue,
    counterValueUnit.magnitude,
    depositAccount,
    depositCurrency,
    tradeMaxConstant,
  ]);

  const selectMax = useCallback(() => {
    if (maxAmount === null) return;
    setAmountText(toAmountText(applyRatio(maxAmount, 1, maxDecimalLength, maxBuffer)));
  }, [maxAmount, maxBuffer, maxDecimalLength]);

  const convertedAmount = useMemo(
    () => (depositCurrency ? toCurrencyAmount(depositCurrency) : null),
    [depositCurrency, toCurrencyAmount],
  );

  const baseError = useMemo(
    () =>
      getDepositBaseError({
        depositAccount,
        depositAmount,
        maxAmount,
        hasConversion: convertedAmount !== null,
      }),
    [convertedAmount, depositAccount, depositAmount, maxAmount],
  );

  const missingAccount = !depositAccount && depositAmount > 0;

  const isFormComplete = depositAmount > 0 && Boolean(depositAccount) && baseError === null;

  const sentAmountAtomic = useMemo(() => {
    if (!isFormComplete || !depositAccount || !convertedAmount) return undefined;
    return BigNumber.min(convertedAmount, depositAccount.spendableBalance).integerValue(
      BigNumber.ROUND_FLOOR,
    );
  }, [convertedAmount, depositAccount, isFormComplete]);

  const sentAmount =
    sentAmountAtomic && depositCurrency
      ? toAmountValue(sentAmountAtomic, depositCurrency.units[0].magnitude)
      : "";

  const { result: quoteResult, isLoading: isQuoteLoading } = usePerpsDepositQuote({
    depositAccount,
    receiverAccount,
    amount: sentAmount,
    isOffline,
  });
  const quote = quoteResult?.quote;

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
      }),
    [
      baseError,
      depositAccount,
      depositAmount,
      isOffline,
      parentAccount,
      quoteResult,
      sentAmountAtomic,
    ],
  );

  const canReview = isFormComplete && quote !== undefined && statusError === null;
  const exceedsBalance = statusError?.code === "insufficientBalance";

  const analyticsCurrencies = useMemo(
    () => ({
      sourceCurrency: depositCurrency?.ticker ?? PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
      targetCurrency: receiverCurrency.ticker,
    }),
    [depositCurrency, receiverCurrency.ticker],
  );

  const trackedErrorCodeRef = useRef<string | null>(null);
  useEffect(() => {
    const code = statusError?.code ?? null;
    if (code === trackedErrorCodeRef.current) return;
    trackedErrorCodeRef.current = code;
    if (!code) return;
    track("swap error message", {
      message: DEPOSIT_FORM_ERROR_ANALYTICS_MESSAGES[code],
      page: DEPOSIT_PAGE,
      flow: PERPS_FLOW,
      ...analyticsCurrencies,
    });
  }, [analyticsCurrencies, statusError?.code]);

  const buyTarget = useMemo((): BuyTarget | null => {
    if (!depositAccount || !depositCurrency) return null;
    if (statusError?.code === "notEnoughFees") {
      const feeAccount = getDepositFeeAccount(depositAccount, parentAccount);
      if (!feeAccount) return null;
      const ticker = getAccountCurrency(feeAccount).ticker;
      return {
        account: feeAccount,
        parentAccount: undefined,
        details: {
          titleKey: "perpsDeposit.details.notEnoughFees.title",
          descriptionKey: "perpsDeposit.details.notEnoughFees.description",
          values: { ticker, account: accountNameWithDefaultSelector(walletState, feeAccount) },
          buyTicker: ticker,
        },
      };
    }
    if (statusError?.code === "amountTooLow") {
      return {
        account: depositAccount,
        parentAccount,
        details: {
          titleKey: "perpsDeposit.details.amountTooLow.title",
          descriptionKey: "perpsDeposit.details.amountTooLow.description",
          values: { ticker: depositCurrency.ticker, amount: statusError.values?.amount ?? "" },
          buyTicker: depositCurrency.ticker,
        },
      };
    }
    return null;
  }, [depositAccount, depositCurrency, parentAccount, statusError, walletState]);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  if (isDetailsOpen && !buyTarget) setIsDetailsOpen(false);

  const openDetails = useCallback(() => {
    track("button_clicked", {
      button: "learn more",
      page: DEPOSIT_PAGE,
      flow: PERPS_FLOW,
      ...analyticsCurrencies,
    });
    setIsDetailsOpen(true);
  }, [analyticsCurrencies]);

  const closeDetails = useCallback(() => setIsDetailsOpen(false), []);

  const buyFromDetails = useCallback(() => {
    if (!buyTarget) return;
    const { account, parentAccount: buyParentAccount, details } = buyTarget;
    track("button_clicked", {
      button: "buy more crypto",
      page: DEPOSIT_PAGE,
      flow: PERPS_FLOW,
      currency: details.buyTicker,
      ...analyticsCurrencies,
    });
    cancelDepositRequest();
    navigate("/exchange", {
      state: buildBuyNavigationState({
        ledgerCurrency: getAccountCurrency(account),
        account,
        parentAccount: buyParentAccount,
      }),
    });
    onClose();
  }, [analyticsCurrencies, buyTarget, navigate, onClose]);

  const receiverUnit = receiverCurrency.units[0];

  const formattedQuotedAmount = useMemo(
    () =>
      quote
        ? formatCurrencyUnit(receiverUnit, valueFromUnit(quote.amountTo, receiverUnit), {
            showCode: true,
            locale,
          })
        : "",
    [locale, quote, receiverUnit],
  );

  const changeDepositAmount = useCallback((formattedValue: string) => {
    setAmountText(formattedValue === "" ? EMPTY_AMOUNT_TEXT : formattedValue);
  }, []);

  const pickDepositAccount = useCallback(() => {
    dispatch(setFlowValue(PERPS_UI_USE_CASE.fund));
    void openAssetAndAccountPromise({
      uiUseCase: PERPS_UI_USE_CASE.fund,
      areCurrenciesFiltered: false,
    })
      .then(({ account }) => {
        setDepositAccountId(account.id);
      })
      .catch(() => undefined);
  }, [dispatch, openAssetAndAccountPromise]);

  const handleReview = useCallback(() => {
    if (!canReview || !depositAccount || !depositCurrency || !quote) return;

    openPerpsReview({
      receiverAccount,
      depositAccount,
      amountSent: sentAmount,
      amountTo: quote.amountTo.toFixed(),
      quoteId: quote.quoteId,
      draft: { depositAccount, depositAmount },
    });
    onClose();
  }, [
    canReview,
    depositAccount,
    depositAmount,
    depositCurrency,
    onClose,
    quote,
    receiverAccount,
    sentAmount,
  ]);

  const headerDescription = `${receiverAccountName} · ${receiverAccountCounterValue}`;

  return {
    headerDescription,
    amountText,
    depositAmount,
    formattedQuotedAmount,
    isQuoteLoading,
    counterValueCode: counterValueUnit.code,
    maxDecimalLength,
    changeDepositAmount,
    selectAmountRatio,
    depositCurrencyTicker: depositCurrency?.ticker ?? PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
    depositCurrencyLedgerId: depositCurrency?.id ?? PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
    depositAccountName: depositAccount
      ? accountNameWithDefaultSelector(walletState, depositAccount)
      : null,
    depositAccountCounterValue,
    maxAmount: maxAmount ?? 0,
    maxBuffer,
    selectMax,
    statusError,
    canLearnMore: buyTarget !== null,
    details: isDetailsOpen && buyTarget ? buyTarget.details : null,
    openDetails,
    closeDetails,
    buyFromDetails,
    canReview,
    exceedsBalance,
    missingAccount,
    pickDepositAccount,
    handleReview,
  };
}
