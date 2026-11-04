import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { PERPS_SWAPKIT_PROVIDER } from "@ledgerhq/live-common/wallet-api/Perps/constants";
import { getDepositMaxBuffer } from "@ledgerhq/live-common/wallet-api/Perps/deposit/maxBuffer";
import { useFeature } from "@features/platform-feature-flags";
import { track } from "@shared/analytics";
import { useNetworkState } from "@shared/network-status";
import {
  DEPOSIT_FORM_ERROR_ANALYTICS_MESSAGES,
  getDepositBaseError,
  getDepositFeeAccount,
  resolveDepositFormError,
  type DepositFormError,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/formError";
import {
  useCalculateCountervalueCallback,
  useCountervaluesCache,
} from "@features/platform-market-countervalues";
import { calculate } from "@domain/entity-market-countervalues";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { useOpenBuySell } from "LLM/features/Buy";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import {
  PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
  PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
} from "../../constants/depositFunding";
import type { PerpsDepositOutcome } from "../../hooks/usePerpsDepositExecution";
import { cancelDepositRequest } from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";
import type { PerpsReviewParams } from "./components/PerpsReview";
import { usePerpsDepositQuote } from "./usePerpsDepositQuote";
import { applyAmountKey, toAmountText } from "../../utils/amountKeys";
import { toAmountValue } from "./utils/toAmountValue";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsDeposit>
>;

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

export type PerpsDepositViewModel = Readonly<{
  headerDescription: string;
  amountText: string;
  depositAmount: number;
  formattedQuotedAmount: string;
  isQuoteLoading: boolean;
  counterValueCode: string;
  maxDecimalLength: number;
  pressAmountKey: (key: string) => void;
  selectAmountRatio: (amount: number) => void;
  depositCurrencyTicker: string;
  depositCurrencyLedgerId: string;
  depositAccountName: string | null;
  depositAccountCounterValue: string | null;
  maxAmount: number;
  maxBuffer: number;
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
  isReviewOpen: boolean;
  reviewParams: PerpsReviewParams | null;
  closeReview: () => void;
  isSignOpen: boolean;
  signingDevice: Device | null | undefined;
  selectSigningDevice: (device: Device | null | undefined) => void;
  handOverToDevice: () => void;
  /** The device declined, which is not a failure: the summary takes over again. */
  returnToReview: () => void;
  /** The sign step failed in a way the same deposit cannot fix, so the form takes over again. */
  returnToForm: () => void;
  /** Signed and broadcast, so the form gives way to the receipt. */
  endSigning: (outcome: PerpsDepositOutcome) => void;
}>;

export function usePerpsDepositViewModel({
  navigation,
  route,
}: NavigationProps): PerpsDepositViewModel {
  const { receiverAccount } = route.params;

  const walletState = useSelector(walletSelector);
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { openDrawer } = useModularDrawerController();
  const { openBuySellForAccount } = useOpenBuySell({ sourceScreenName: ScreenName.PerpsDeposit });
  const { isConnected, isInternetReachable } = useNetworkState();
  const isOffline = isConnected === false || isInternetReachable === false;

  const [depositAccountId, setDepositAccountId] = useState<string | undefined>(undefined);
  const [amountText, setAmountText] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [signingDevice, setSigningDevice] = useState<Device | null | undefined>();
  const [reviewParams, setReviewParams] = useState<PerpsReviewParams | null>(null);
  const [quoteRefreshGeneration, setQuoteRefreshGeneration] = useState(0);

  // Leaving the screen before the deposit settles abandons it; after it settles this is a no-op.
  useEffect(() => cancelDepositRequest, []);

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

  const depositAmount = useMemo(() => {
    const parsed = Number(amountText.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountText]);

  const counterValueUnit = counterValueCurrency.units[0];

  const maxDecimalLength = Math.max(0, counterValueUnit.magnitude);

  /** Fills the input with the amount a ratio pill resolved to. */
  const selectAmountRatio = useCallback(
    (amount: number) => {
      setAmountText(toAmountText(amount, maxDecimalLength));
    },
    [maxDecimalLength],
  );

  const pressAmountKey = useCallback(
    (key: string) => {
      setAmountText(current => applyAmountKey(current, key, maxDecimalLength));
    },
    [maxDecimalLength],
  );

  const receiverCurrency = useMemo(() => getAccountCurrency(receiverAccount), [receiverAccount]);
  const depositCurrency = useMemo(
    () => (depositAccount ? getAccountCurrency(depositAccount) : undefined),
    [depositAccount],
  );

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
    refreshGeneration: quoteRefreshGeneration,
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
    setIsDetailsOpen(false);
    cancelDepositRequest();
    openBuySellForAccount("buy", account, buyParentAccount);
  }, [analyticsCurrencies, buyTarget, openBuySellForAccount]);

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

  const pickDepositAccount = useCallback(() => {
    openDrawer({
      enableAccountSelection: true,
      areCurrenciesFiltered: false,
      uiUseCase: PERPS_UI_USE_CASE.fund,
      flow: PERPS_UI_USE_CASE.fund,
      onAccountSelected: account => {
        setDepositAccountId(account.id);
      },
    });
  }, [openDrawer]);

  const handleReview = useCallback(() => {
    if (!canReview || !depositAccount || !sentAmount || !quote) return;
    setReviewParams({
      depositAccount,
      receiverAccount,
      amountSent: sentAmount,
      amountTo: quote.amountTo.toFixed(),
      quoteId: quote.quoteId,
    });
    setIsReviewOpen(true);
  }, [canReview, depositAccount, quote, receiverAccount, sentAmount]);

  const closeReview = useCallback(() => setIsReviewOpen(false), []);

  const handOverToDevice = useCallback(() => {
    setIsReviewOpen(false);
    setIsSignOpen(true);
  }, []);

  const returnToReview = useCallback(() => {
    setIsSignOpen(false);
    setIsReviewOpen(true);
  }, []);

  const returnToForm = useCallback(() => {
    setQuoteRefreshGeneration(generation => generation + 1);
    setIsSignOpen(false);
  }, []);

  const endSigning = useCallback(
    ({ swapId }: PerpsDepositOutcome) => {
      setIsSignOpen(false);
      setSigningDevice(undefined);
      navigation.replace(ScreenName.PerpsTransactionSigned, {
        receiveCurrencyTicker: receiverCurrency.ticker,
        swapId,
        provider: PERPS_SWAPKIT_PROVIDER,
      });
    },
    [navigation, receiverCurrency.ticker],
  );

  return {
    headerDescription: `${receiverAccountName} · ${receiverAccountCounterValue}`,
    amountText,
    depositAmount,
    formattedQuotedAmount,
    isQuoteLoading,
    counterValueCode: counterValueUnit.code,
    maxDecimalLength,
    pressAmountKey,
    selectAmountRatio,
    depositCurrencyTicker: depositCurrency?.ticker ?? PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
    depositCurrencyLedgerId: depositCurrency?.id ?? PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
    depositAccountName: depositAccount
      ? accountNameWithDefaultSelector(walletState, depositAccount)
      : null,
    depositAccountCounterValue,
    maxAmount: maxAmount ?? 0,
    maxBuffer,
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
    isReviewOpen,
    reviewParams,
    closeReview,
    isSignOpen,
    signingDevice,
    selectSigningDevice: setSigningDevice,
    handOverToDevice,
    returnToReview,
    returnToForm,
    endSigning,
  };
}
