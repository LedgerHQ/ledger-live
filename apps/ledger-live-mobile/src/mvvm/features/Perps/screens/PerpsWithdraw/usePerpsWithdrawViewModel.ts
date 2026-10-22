import { useCallback, useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import type { AccountLike } from "@ledgerhq/types-live";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import {
  getWithdrawMaxAmount,
  validateWithdrawAmount,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/amount";
import { getPerpsAvailableBalance } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/availableBalance";
import { pickDefaultWithdrawAccount } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/defaultAccount";
import {
  WithdrawAddressScreeningError,
  WithdrawLowLiquidityError,
  WithdrawMinimumAmountError,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/errors";
import { cancelWithdrawRequest } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";
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
import { applyAmountKey, toAmountText } from "../../utils/amountKeys";
import { usePerpsWithdrawQuote } from "./usePerpsWithdrawQuote";
import { useWithdrawCurrencies } from "./useWithdrawCurrencies";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsWithdraw>
>;

export type WithdrawFormError = Readonly<{
  labelKey: string;
  values?: Record<string, string>;
}>;

const USD_UNIT = getFiatCurrencyByTicker("USD").units[0];

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
  currencyCode: string;
  quotedAmount: string | null;
  isQuoteLoading: boolean;
  maxDecimalLength: number;
  pressAmountKey: (key: string) => void;
  selectAmountRatio: (amount: number) => void;
  maxAmount: number;
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

export function usePerpsWithdrawViewModel({ route }: NavigationProps): PerpsWithdrawViewModel {
  const walletState = useSelector(walletSelector);
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { openDrawer } = useModularDrawerController();
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const { currencyIds, isError: currenciesUnavailable } = useWithdrawCurrencies();

  // The store copy stays in sync while the screen is open.
  const sourceAccount =
    accounts.find(({ id }) => id === route.params.sourceAccount.id) ?? route.params.sourceAccount;
  const availableBalance = useMemo(() => getPerpsAvailableBalance(sourceAccount), [sourceAccount]);

  const [amountText, setAmountText] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState<string | undefined>();

  // Leaving before the withdrawal is submitted abandons it; after that this is a no-op.
  useEffect(() => cancelWithdrawRequest, []);

  const amount = useMemo(() => {
    const parsed = Number(amountText);
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
    // An amount the fee check rejects is never priced.
    amount: balanceError ? "" : amountText,
    sourceAccount,
    destinationAccount,
    accounts,
    counterValueCurrency: counterValueCurrency.ticker,
  });

  const counterValueUnit = counterValueCurrency.units[0];
  const destinationCounterValue = useMemo(() => {
    const fiat = destinationAccount ? getFiatBalance(destinationAccount) : undefined;
    return fiat
      ? formatCurrencyUnit(counterValueUnit, fiat, { showCode: true, discreet, locale })
      : null;
  }, [counterValueUnit, destinationAccount, discreet, getFiatBalance, locale]);

  const maxAmount = useMemo(
    () =>
      getWithdrawMaxAmount(availableBalance)
        .decimalPlaces(USD_UNIT.magnitude, BigNumber.ROUND_DOWN)
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

  const pressAmountKey = useCallback(
    (key: string) => setAmountText(current => applyAmountKey(current, key, USD_UNIT.magnitude)),
    [],
  );

  const selectAmountRatio = useCallback(
    (ratioAmount: number) => setAmountText(toAmountText(ratioAmount, USD_UNIT.magnitude)),
    [],
  );

  const pickDestinationAccount = useCallback(() => {
    openDrawer({
      enableAccountSelection: true,
      useCase: "swap",
      areCurrenciesFiltered: false,
      uiUseCase: PERPS_UI_USE_CASE.withdraw,
      flow: PERPS_UI_USE_CASE.withdraw,
      onAccountSelected: account => setDestinationAccountId(account.id),
    });
  }, [openDrawer]);

  // TODO(LIVE-39368): open the withdraw summary.
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
    currencyCode: USD_UNIT.code,
    quotedAmount,
    isQuoteLoading,
    maxDecimalLength: USD_UNIT.magnitude,
    pressAmountKey,
    selectAmountRatio,
    maxAmount,
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
