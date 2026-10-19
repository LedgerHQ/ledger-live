import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import type { PerpsWithdrawUiParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import {
  getWithdrawMaxAmount,
  validateWithdrawAmount,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/amount";
import { pickDefaultWithdrawAccount } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/defaultAccount";
import {
  WithdrawAddressScreeningError,
  WithdrawLowLiquidityError,
  WithdrawMinimumAmountError,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/errors";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { applyRatio } from "LLD/features/Perps/utils/applyRatio";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { setFlowValue } from "~/renderer/reducers/modularDialog";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { usePerpsWithdrawQuote } from "./usePerpsWithdrawQuote";
import { useWithdrawCurrencies } from "./useWithdrawCurrencies";

/** Snapshot of the form, used to restore it when coming back from the summary. */
export type PerpsWithdrawDraft = Readonly<{
  destinationAccountId: string;
  amountText: string;
}>;

export type PerpsWithdrawData = PerpsWithdrawUiParams & {
  draft?: PerpsWithdrawDraft;
};

export type WithdrawFormError = Readonly<{
  labelKey: string;
  values?: Record<string, string>;
}>;

const EMPTY_AMOUNT_TEXT = "0";
const AMOUNT_DECIMALS = 2;
const USD_UNIT = getFiatCurrencyByTicker("USD").units[0];

function toAmountText(amount: number): string {
  return amount ? new BigNumber(amount).toFixed() : EMPTY_AMOUNT_TEXT;
}

function toQuoteError(error: Error): WithdrawFormError {
  if (error instanceof WithdrawMinimumAmountError) {
    return error.minAmount
      ? {
          labelKey: "perpsWithdraw.formErrors.minimumAmount",
          values: { minAmount: error.minAmount.toFixed() },
        }
      : { labelKey: "perpsWithdraw.formErrors.minimumAmountUnknown" };
  }
  if (error instanceof WithdrawLowLiquidityError) {
    return { labelKey: "perpsWithdraw.formErrors.lowLiquidity" };
  }
  if (error instanceof WithdrawAddressScreeningError) {
    return { labelKey: "perpsWithdraw.formErrors.addressScreening" };
  }
  return { labelKey: "perpsWithdraw.formErrors.quoteUnavailable" };
}

export type PerpsWithdrawViewModel = Readonly<{
  headerDescription: string;
  amountText: string;
  amount: number;
  quotedAmount: string | null;
  isQuoteLoading: boolean;
  maxDecimalLength: number;
  changeAmount: (formattedValue: string) => void;
  selectAmountRatio: (amount: number) => void;
  maxAmount: number;
  selectMax: () => void;
  destinationTicker: string;
  destinationLedgerId: string;
  destinationAccountName: string | null;
  destinationCounterValue: string | null;
  missingAccount: boolean;
  pickDestinationAccount: () => void;
  statusError: WithdrawFormError | null;
  exceedsBalance: boolean;
  canReview: boolean;
  handleReview: () => void;
}>;

export function usePerpsWithdrawViewModel(data: PerpsWithdrawData): PerpsWithdrawViewModel {
  const { sourceAccount, availableBalance, draft } = data;
  const walletState = useSelector(walletSelector);
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const dispatch = useDispatch();
  const { openAssetAndAccountPromise } = useOpenAssetAndAccount();
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const { currencyIds, isError: currenciesUnavailable } = useWithdrawCurrencies();

  const [amountText, setAmountText] = useState(draft?.amountText ?? EMPTY_AMOUNT_TEXT);
  const [destinationAccountId, setDestinationAccountId] = useState(draft?.destinationAccountId);

  const amount = useMemo(() => {
    const parsed = Number(amountText.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountText]);

  const getFiatBalance = useCallback(
    (account: AccountLike) =>
      calculateCountervalue(getAccountCurrency(account), account.spendableBalance) ?? undefined,
    [calculateCountervalue],
  );

  const defaultDestination = useMemo(
    () =>
      currencyIds
        ? pickDefaultWithdrawAccount({
            accounts: accounts.filter(account => account.id !== sourceAccount.id),
            supportedCurrencyIds: currencyIds,
            getFiatBalance,
          })
        : undefined,
    [accounts, currencyIds, getFiatBalance, sourceAccount.id],
  );

  const destinationAccount = useMemo(
    () => accounts.find(account => account.id === destinationAccountId) ?? defaultDestination,
    [accounts, defaultDestination, destinationAccountId],
  );
  const destinationCurrency = destinationAccount
    ? getAccountCurrency(destinationAccount)
    : undefined;

  const balanceError = validateWithdrawAmount({
    amount: new BigNumber(amount),
    availableBalance,
  });

  const {
    quote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = usePerpsWithdrawQuote({
    amount: balanceError ? "" : amountText,
    sourceAccount,
    destinationAccount,
    accounts,
    counterValueCurrency: counterValueCurrency.ticker,
  });

  const counterValueUnit = counterValueCurrency.units[0];
  const formatFiat = useCallback(
    (value: BigNumber) =>
      formatCurrencyUnit(counterValueUnit, value, { showCode: true, discreet, locale }),
    [counterValueUnit, discreet, locale],
  );

  const destinationCounterValue = useMemo(() => {
    const fiat = destinationAccount ? getFiatBalance(destinationAccount) : undefined;
    return fiat ? formatFiat(fiat) : null;
  }, [destinationAccount, formatFiat, getFiatBalance]);

  const maxAmount = useMemo(
    () =>
      getWithdrawMaxAmount(availableBalance)
        .decimalPlaces(AMOUNT_DECIMALS, BigNumber.ROUND_DOWN)
        .toNumber(),
    [availableBalance],
  );

  const statusError = useMemo<WithdrawFormError | null>(() => {
    if (balanceError) return { labelKey: "perpsWithdraw.formErrors.insufficientBalance" };
    if (currenciesUnavailable) {
      return { labelKey: "perpsWithdraw.formErrors.currenciesUnavailable" };
    }
    return quoteError ? toQuoteError(quoteError) : null;
  }, [balanceError, currenciesUnavailable, quoteError]);

  const canReview =
    amount > 0 &&
    destinationAccount !== undefined &&
    statusError === null &&
    !isQuoteLoading &&
    quote !== undefined;

  const quotedAmount = useMemo(() => {
    if (!quote || !destinationCurrency) return null;
    const unit = destinationCurrency.units[0];
    return formatCurrencyUnit(unit, quote.amountTo.shiftedBy(unit.magnitude), {
      showCode: true,
      locale,
    });
  }, [destinationCurrency, locale, quote]);

  const changeAmount = useCallback((formattedValue: string) => {
    setAmountText(formattedValue === "" ? EMPTY_AMOUNT_TEXT : formattedValue);
  }, []);

  const selectAmountRatio = useCallback(
    (ratioAmount: number) => setAmountText(toAmountText(ratioAmount)),
    [],
  );

  const selectMax = useCallback(
    () => setAmountText(toAmountText(applyRatio(maxAmount, 1, AMOUNT_DECIMALS))),
    [maxAmount],
  );

  const pickDestinationAccount = useCallback(() => {
    dispatch(setFlowValue(PERPS_UI_USE_CASE.withdraw));
    void openAssetAndAccountPromise({
      uiUseCase: PERPS_UI_USE_CASE.withdraw,
      currencies: currencyIds ?? [],
      areCurrenciesFiltered: true,
    })
      .then(({ account }) => setDestinationAccountId(account.id))
      .catch(() => undefined);
  }, [currencyIds, dispatch, openAssetAndAccountPromise]);

  // TODO(LIVE-39368): open the withdraw summary with the quote and this draft.
  const handleReview = useCallback(() => undefined, []);

  const sourceName = accountNameWithDefaultSelector(walletState, sourceAccount);
  const formattedAvailable = formatCurrencyUnit(
    USD_UNIT,
    availableBalance.shiftedBy(USD_UNIT.magnitude),
    { showCode: true, discreet, locale },
  );

  return {
    headerDescription: `${sourceName} · ${formattedAvailable}`,
    amountText,
    amount,
    quotedAmount,
    isQuoteLoading,
    maxDecimalLength: AMOUNT_DECIMALS,
    changeAmount,
    selectAmountRatio,
    maxAmount,
    selectMax,
    destinationTicker: destinationCurrency?.ticker ?? "",
    destinationLedgerId: destinationCurrency?.id ?? "",
    destinationAccountName: destinationAccount
      ? accountNameWithDefaultSelector(walletState, destinationAccount)
      : null,
    destinationCounterValue,
    missingAccount: destinationAccount === undefined && amount > 0,
    pickDestinationAccount,
    statusError,
    exceedsBalance: balanceError !== null,
    canReview,
    handleReview,
  };
}
