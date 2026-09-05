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
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
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
import { applyRatio } from "./utils/applyRatio";
import { toAmountValue } from "./utils/toAmountValue";
import { validateDepositFlow, type DepositFormError } from "./utils/validateDepositFlow";

/** Snapshot of the amount-entry form, used to restore it when re-opened. */
export type PerpsDepositDraft = Readonly<{
  depositAccount: AccountLike;
  depositAmount: number;
}>;

export type PerpsDepositData = PerpsDepositUiParams & {
  draft?: PerpsDepositDraft;
};

const EMPTY_AMOUNT_TEXT = "0";

const QUOTE_UNAVAILABLE_ERROR: DepositFormError = {
  labelKey: "perpsDeposit.formErrors.quoteUnavailable",
};

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
  selectMax: () => void;
  statusError: DepositFormError | null;
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

  const [depositAccountId, setDepositAccountId] = useState(data.draft?.depositAccount.id);
  const [amountText, setAmountText] = useState(() => toAmountText(data.draft?.depositAmount));

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

  /** Read from the store so balances stay live while the form is open. */
  const depositAccount = useMemo(
    () => accounts.find(account => account.id === depositAccountId),
    [accounts, depositAccountId],
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
    setAmountText(toAmountText(applyRatio(maxAmount, 1, maxDecimalLength)));
  }, [maxAmount, maxDecimalLength]);

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

  const changeDepositAmount = useCallback((formattedValue: string) => {
    setAmountText(formattedValue === "" ? EMPTY_AMOUNT_TEXT : formattedValue);
  }, []);

  const pickDepositAccount = useCallback(() => {
    void openAssetAndAccountPromise({
      uiUseCase: PERPS_UI_USE_CASE.fund,
      areCurrenciesFiltered: false,
    })
      .then(({ account }) => {
        setDepositAccountId(account.id);
        setAmountText(EMPTY_AMOUNT_TEXT);
      })
      .catch(() => undefined);
  }, [openAssetAndAccountPromise]);

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
    selectMax,
    statusError,
    canReview,
    exceedsBalance,
    missingAccount,
    pickDepositAccount,
    handleReview,
  };
}
