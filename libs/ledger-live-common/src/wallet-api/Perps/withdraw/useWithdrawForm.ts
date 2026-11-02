import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { calculate } from "@domain/entity-market-countervalues";
import {
  useCalculateCountervalueCallback,
  useCountervaluesCache,
} from "@features/platform-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";
import { formatCurrencyUnit } from "../../../currencies";
import { getWithdrawMaxAmount, validateWithdrawAmount } from "./amount";
import { getPerpsAvailableBalance } from "./availableBalance";
import { pickDefaultWithdrawAccount } from "./defaultAccount";
import {
  WithdrawAddressScreeningError,
  WithdrawLowLiquidityError,
  WithdrawMinimumAmountError,
} from "./errors";
import type { WithdrawQuote } from "./quote";
import { useWithdrawCurrencies } from "./useWithdrawCurrencies";
import { usePerpsWithdrawQuote } from "./useWithdrawQuote";

export type WithdrawFormError = Readonly<{
  labelKey: string;
  values?: Record<string, string>;
}>;

/** An account picked as the destination, with its parent when it is a token account. */
export type PickedWithdrawAccount = Readonly<{
  account: AccountLike;
  parentAccount?: AccountLike;
}>;

export type PerpsWithdrawFormParams = Readonly<{
  sourceAccount: AccountLike;
  accounts: AccountLike[];
  /** The amount typed, in the counter value. */
  amount: number;
  picked: PickedWithdrawAccount | undefined;
  counterValueCurrency: Currency;
  locale: string;
  discreet: boolean;
}>;

export type PerpsWithdrawForm = Readonly<{
  destinationAccount: AccountLike | undefined;
  quote: WithdrawQuote | undefined;
  isQuoteLoading: boolean;
  quotedAmount: string | null;
  destinationCounterValue: string | null;
  /** Max withdrawable amount, in the counter value. */
  maxAmount: number;
  formattedAvailable: string;
  statusError: WithdrawFormError | null;
  exceedsBalance: boolean;
  canReview: boolean;
}>;

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

/** The withdraw form's state, shared by desktop and mobile: amounts, destination and quote. */
export function usePerpsWithdrawForm({
  sourceAccount,
  accounts,
  amount,
  picked,
  counterValueCurrency,
  locale,
  discreet,
}: PerpsWithdrawFormParams): PerpsWithdrawForm {
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const countervaluesState = useCountervaluesCache();
  const { currencyIds, isError: currenciesUnavailable } = useWithdrawCurrencies();

  const availableBalance = useMemo(() => getPerpsAvailableBalance(sourceAccount), [sourceAccount]);
  const counterValueUnit = counterValueCurrency.units[0];
  const sourceCurrency = getAccountCurrency(sourceAccount);
  const sourceUnit = sourceCurrency.units[0];

  /** The typed counter value priced back into USDC; null when there is no rate. */
  const usdcAmount = useMemo(() => {
    if (!amount) return new BigNumber(0);
    const atomic = calculate(countervaluesState, {
      from: sourceCurrency,
      to: counterValueCurrency,
      value: new BigNumber(amount).shiftedBy(counterValueUnit.magnitude).toNumber(),
      reverse: true,
      disableRounding: true,
    });
    return atomic == null
      ? null
      : new BigNumber(atomic)
          .shiftedBy(-sourceUnit.magnitude)
          .decimalPlaces(sourceUnit.magnitude, BigNumber.ROUND_DOWN);
  }, [
    amount,
    counterValueCurrency,
    counterValueUnit,
    countervaluesState,
    sourceCurrency,
    sourceUnit,
  ]);

  const toCounterValue = useCallback(
    (usdc: BigNumber) =>
      calculateCountervalue(sourceCurrency, usdc.shiftedBy(sourceUnit.magnitude)) ?? undefined,
    [calculateCountervalue, sourceCurrency, sourceUnit],
  );

  const getFiatBalance = useCallback(
    (account: AccountLike) =>
      calculateCountervalue(getAccountCurrency(account), account.spendableBalance) ?? undefined,
    [calculateCountervalue],
  );

  const formatFiat = useCallback(
    (value: BigNumber) =>
      formatCurrencyUnit(counterValueUnit, value, { showCode: true, discreet, locale }),
    [counterValueUnit, discreet, locale],
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

  // A picked token account the user never held is not in the store yet, so keep it as picked.
  const destinationAccount = useMemo(() => {
    if (!picked) return defaultDestination;
    return accounts.find(({ id }) => id === picked.account.id) ?? picked.account;
  }, [accounts, defaultDestination, picked]);
  const destinationCurrency = destinationAccount
    ? getAccountCurrency(destinationAccount)
    : undefined;

  const quoteAccounts = useMemo(() => {
    const missing = [picked?.account, picked?.parentAccount].filter(
      (account): account is AccountLike =>
        account !== undefined && !accounts.some(({ id }) => id === account.id),
    );
    return missing.length ? [...accounts, ...missing] : accounts;
  }, [accounts, picked]);

  const balanceError = validateWithdrawAmount({
    amount: usdcAmount ?? new BigNumber(0),
    availableBalance,
  });
  const rateUnavailable = amount > 0 && usdcAmount === null;

  const {
    quote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = usePerpsWithdrawQuote({
    amount: balanceError || !usdcAmount ? "" : usdcAmount.toFixed(),
    sourceAccount,
    destinationAccount,
    accounts: quoteAccounts,
    counterValueCurrency: counterValueCurrency.ticker,
  });

  const destinationCounterValue = useMemo(() => {
    const fiat = destinationAccount ? getFiatBalance(destinationAccount) : undefined;
    return fiat ? formatFiat(fiat) : null;
  }, [destinationAccount, formatFiat, getFiatBalance]);

  const maxAmount = useMemo(() => {
    const fiat = toCounterValue(getWithdrawMaxAmount(availableBalance));
    return fiat
      ? fiat
          .shiftedBy(-counterValueUnit.magnitude)
          .decimalPlaces(counterValueUnit.magnitude, BigNumber.ROUND_DOWN)
          .toNumber()
      : 0;
  }, [availableBalance, counterValueUnit, toCounterValue]);

  const statusError = useMemo<WithdrawFormError | null>(() => {
    if (balanceError) return { labelKey: "perpsWithdraw.formErrors.insufficientBalance" };
    if (currenciesUnavailable) {
      return { labelKey: "perpsWithdraw.formErrors.currenciesUnavailable" };
    }
    if (rateUnavailable) return { labelKey: "perpsWithdraw.formErrors.quoteUnavailable" };
    return quoteError ? toQuoteError(quoteError) : null;
  }, [balanceError, currenciesUnavailable, quoteError, rateUnavailable]);

  const quotedAmount = useMemo(() => {
    if (!quote || !destinationCurrency) return null;
    const unit = destinationCurrency.units[0];
    return formatCurrencyUnit(unit, quote.amountTo.shiftedBy(unit.magnitude), {
      showCode: true,
      locale,
    });
  }, [destinationCurrency, locale, quote]);

  const fiatAvailable = toCounterValue(availableBalance);
  const formattedAvailable = fiatAvailable
    ? formatFiat(fiatAvailable)
    : formatCurrencyUnit(sourceUnit, sourceAccount.spendableBalance, {
        showCode: true,
        discreet,
        locale,
      });

  return {
    destinationAccount,
    quote,
    isQuoteLoading,
    quotedAmount,
    destinationCounterValue,
    maxAmount,
    formattedAvailable,
    statusError,
    exceedsBalance: balanceError !== null,
    canReview:
      amount > 0 &&
      destinationAccount !== undefined &&
      statusError === null &&
      !isQuoteLoading &&
      quote !== undefined,
  };
}
