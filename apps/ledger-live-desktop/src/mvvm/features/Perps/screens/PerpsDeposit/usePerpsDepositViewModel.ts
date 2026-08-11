import { useCallback, useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  useCalculateCountervalueCallback,
  useCountervaluesState,
} from "@ledgerhq/live-countervalues-react";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { formatCurrencyUnit, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import type { PerpsDepositUiParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import {
  PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
  PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
} from "../../constants/depositFunding";
import { openPerpsReview } from "../PerpsReview/PerpsReviewDialog";
import { usePerpsDepositQuote } from "./usePerpsDepositQuote";
import { applyRatio } from "./utils/applyRatio";
import { toAmountValue } from "./utils/toAmountValue";
import { validateDepositFlow } from "./utils/validateDepositFlow";

/** Snapshot of the amount-entry form, used to restore it when re-opened. */
export type PerpsDepositDraft = Readonly<{
  depositAccount: AccountLike;
  depositAmount: number;
}>;

export type PerpsDepositData = PerpsDepositUiParams & {
  draft?: PerpsDepositDraft;
};

export type PerpsDepositViewModel = Readonly<{
  headerDescription: string | undefined;
  depositAmount: number;
  formattedDepositAmount: string;
  depositAmountTicker: string;
  isQuoteLoading: boolean;
  counterValueCode: string;
  maxDecimalLength: number;
  changeDepositAmount: (formattedValue: string) => void;
  setDepositAmount: (amount: number) => void;
  depositCurrencyTicker: string;
  depositCurrencyLedgerId: string;
  depositAccountName: string | null;
  depositAccountCounterValue: string | null;
  maxAmount: number;
  selectMax: () => void;
  submitError: ReturnType<typeof validateDepositFlow>;
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
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const { openAssetAndAccountPromise } = useOpenAssetAndAccount();

  const [depositAccount, setDepositAccount] = useState<AccountLike | undefined>(
    data.draft?.depositAccount,
  );
  const [depositAmount, setDepositAmount] = useState(data.draft?.depositAmount ?? 0);

  useEffect(() => {
    setDepositAccount(data.draft?.depositAccount);
    setDepositAmount(data.draft?.depositAmount ?? 0);
  }, [data]);

  const receiverAccount = data.receiverAccount;
  const receiverCurrency = useMemo(() => getAccountCurrency(receiverAccount), [receiverAccount]);
  const depositCurrency = useMemo(
    () => (depositAccount ? getAccountCurrency(depositAccount) : undefined),
    [depositAccount],
  );

  const counterValueUnit = counterValueCurrency.units[0];
  const maxDecimalLength = Math.max(0, counterValueUnit.magnitude);
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
    return formatCurrencyUnit(counterValueUnit, counterValue, { showCode: false, locale });
  }, [
    calculateCountervalue,
    counterValueUnit,
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
      showCode: false,
      locale,
    });
  }, [counterValueUnit, depositAccountBalanceCounterValue, locale]);

  const maxAmount = useMemo(
    () => depositAccountBalanceCounterValue?.shiftedBy(-counterValueUnit.magnitude).toNumber() ?? 0,
    [counterValueUnit.magnitude, depositAccountBalanceCounterValue],
  );

  const selectMax = useCallback(
    () => setDepositAmount(applyRatio(maxAmount, 1, maxDecimalLength)),
    [maxAmount, maxDecimalLength],
  );

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
  const isFormComplete = depositAmount > 0 && Boolean(depositAccount) && submitError === null;

  const sentAmount = useMemo(() => {
    if (!isFormComplete || !depositAccount || !depositCurrency) return "";
    const atomicAmount = BigNumber.min(
      toCurrencyAmount(depositCurrency),
      depositAccount.spendableBalance,
    ).integerValue(BigNumber.ROUND_FLOOR);
    return toAmountValue(atomicAmount, depositCurrency.units[0].magnitude);
  }, [isFormComplete, depositAccount, depositCurrency, toCurrencyAmount]);

  const { quote, isLoading: isQuoteLoading } = usePerpsDepositQuote({
    depositAccount,
    receiverAccount,
    amount: sentAmount,
  });

  const canReview = isFormComplete && quote !== undefined;

  const receiverUnit = receiverCurrency.units[0];

  const formattedDepositAmount = useMemo(
    () =>
      quote
        ? formatCurrencyUnit(receiverUnit, valueFromUnit(quote.amountTo, receiverUnit), {
            showCode: false,
            locale,
          })
        : "",
    [locale, quote, receiverUnit],
  );

  const changeDepositAmount = useCallback((formattedValue: string) => {
    const parsed = Number(formattedValue.replace(/[^0-9.]/g, ""));
    setDepositAmount(Number.isFinite(parsed) ? parsed : 0);
  }, []);

  const pickDepositAccount = useCallback(() => {
    void openAssetAndAccountPromise({
      uiUseCase: PERPS_UI_USE_CASE.fund,
      areCurrenciesFiltered: false,
    })
      .then(({ account }) => {
        setDepositAccount(account);
        setDepositAmount(0);
      })
      .catch(() => undefined);
  }, [openAssetAndAccountPromise]);

  const handleReview = useCallback(() => {
    if (!canReview || !depositAccount || !depositCurrency) return;

    openPerpsReview({
      receiverAccount,
      depositAccount,
      amountSent: {
        value: sentAmount,
        currencyId: depositCurrency.id,
      },
      amountReceived: quote && {
        value: quote.amountTo.toFixed(),
        currencyId: receiverCurrency.id,
      },
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
    receiverCurrency,
    sentAmount,
  ]);

  const headerDescription = `${receiverAccountName} · ${receiverAccountCounterValue}`;

  return {
    headerDescription,
    depositAmount,
    formattedDepositAmount,
    depositAmountTicker: receiverCurrency.ticker,
    isQuoteLoading,
    counterValueCode: counterValueUnit.code,
    maxDecimalLength,
    changeDepositAmount,
    setDepositAmount,
    depositCurrencyTicker: depositCurrency?.ticker ?? PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
    depositCurrencyLedgerId: depositCurrency?.id ?? PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
    depositAccountName: depositAccount
      ? accountNameWithDefaultSelector(walletState, depositAccount)
      : null,
    depositAccountCounterValue,
    maxAmount,
    selectMax,
    submitError,
    canReview,
    exceedsBalance,
    missingAccount,
    pickDepositAccount,
    handleReview,
  };
}
