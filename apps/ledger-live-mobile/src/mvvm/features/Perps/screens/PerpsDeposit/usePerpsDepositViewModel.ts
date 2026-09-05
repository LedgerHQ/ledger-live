import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import {
  useCalculateCountervalueCallback,
  useCountervaluesState,
} from "@ledgerhq/live-countervalues-react";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import {
  PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
  PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
} from "../../constants/depositFunding";
import type { PerpsReviewParams } from "./components/PerpsReview";
import { usePerpsDepositQuote } from "./usePerpsDepositQuote";
import { applyAmountKey, toAmountText } from "./utils/amountKeys";
import { toAmountValue } from "./utils/toAmountValue";
import { validateDepositFlow, type DepositFormError } from "./utils/validateDepositFlow";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsDeposit>
>;

const QUOTE_UNAVAILABLE_ERROR: DepositFormError = {
  labelKey: "perpsDeposit.formErrors.quoteUnavailable",
};

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
  selectMax: () => void;
  statusError: DepositFormError | null;
  canReview: boolean;
  exceedsBalance: boolean;
  missingAccount: boolean;
  pickDepositAccount: () => void;
  handleReview: () => void;
  isReviewOpen: boolean;
  reviewParams: PerpsReviewParams | null;
  closeReview: () => void;
}>;

export function usePerpsDepositViewModel({ route }: NavigationProps): PerpsDepositViewModel {
  const { receiverAccount } = route.params;

  const walletState = useSelector(walletSelector);
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { openDrawer } = useModularDrawerController();

  const [depositAccountId, setDepositAccountId] = useState<string | undefined>(undefined);
  const [amountText, setAmountText] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewParams, setReviewParams] = useState<PerpsReviewParams | null>(null);

  /** Read from the store so balances stay live while the form is open. */
  const depositAccount = useMemo(
    () => accounts.find(account => account.id === depositAccountId),
    [accounts, depositAccountId],
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
  const countervaluesState = useCountervaluesState();

  /** Prices the typed amount back into `currency`, in its smallest unit. */
  const toCurrencyAmount = useCallback(
    (currency: CryptoOrTokenCurrency) =>
      new BigNumber(
        calculate(countervaluesState, {
          from: currency,
          to: counterValueCurrency,
          value: new BigNumber(depositAmount).shiftedBy(counterValueUnit.magnitude).toNumber(),
          reverse: true,
          disableRounding: true,
        }) ?? 0,
      ),
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

  const selectMax = useCallback(() => {
    if (maxAmount === null) return;
    selectAmountRatio(maxAmount);
  }, [maxAmount, selectAmountRatio]);

  const submitError = useMemo(
    () =>
      validateDepositFlow({
        amount: depositAmount,
        maxAmount,
        hasFundingAccount: Boolean(depositAccount),
      }),
    [depositAccount, depositAmount, maxAmount],
  );

  const exceedsBalance = submitError !== null;
  const missingAccount = !depositAccount && depositAmount > 0;

  const isFormComplete =
    depositAmount > 0 && Boolean(depositAccount) && submitError === null && maxAmount !== null;

  const sentAmount = useMemo(() => {
    if (!isFormComplete || !depositAccount || !depositCurrency) return "";
    const atomicAmount = BigNumber.min(
      toCurrencyAmount(depositCurrency),
      depositAccount.spendableBalance,
    ).integerValue(BigNumber.ROUND_FLOOR);
    return toAmountValue(atomicAmount, depositCurrency.units[0].magnitude);
  }, [isFormComplete, depositAccount, depositCurrency, toCurrencyAmount]);

  const {
    quote,
    isLoading: isQuoteLoading,
    isUnavailable: isQuoteUnavailable,
  } = usePerpsDepositQuote({
    depositAccount,
    receiverAccount,
    amount: sentAmount,
  });

  const canReview = isFormComplete && quote !== undefined;

  /** What the user typed comes first; a missing quote only matters once it is valid. */
  const statusError = submitError ?? (isQuoteUnavailable ? QUOTE_UNAVAILABLE_ERROR : null);

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
      onAccountSelected: account => {
        setDepositAccountId(account.id);
        setAmountText("");
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
    selectMax,
    statusError,
    canReview,
    exceedsBalance,
    missingAccount,
    pickDepositAccount,
    handleReview,
    isReviewOpen,
    reviewParams,
    closeReview,
  };
}
