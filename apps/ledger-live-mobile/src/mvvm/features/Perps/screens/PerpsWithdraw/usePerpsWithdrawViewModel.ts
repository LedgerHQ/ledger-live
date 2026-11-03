import { useCallback, useEffect, useMemo, useState } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { cancelWithdrawRequest } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";
import {
  usePerpsWithdrawForm,
  type PickedWithdrawAccount,
  type WithdrawFormError,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawForm";
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
import type { PerpsWithdrawSummaryParams } from "./components/PerpsWithdrawSummary";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsWithdraw>
>;

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
  isSummaryOpen: boolean;
  /** Changes on every Review, so the summary starts again from the latest quote. */
  summaryKey: number;
  summaryParams: PerpsWithdrawSummaryParams | null;
  closeSummary: () => void;
}>;

export function usePerpsWithdrawViewModel({ route }: NavigationProps): PerpsWithdrawViewModel {
  const walletState = useSelector(walletSelector);
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { openDrawer } = useModularDrawerController();
  const counterValueUnit = counterValueCurrency.units[0];

  // The store copy stays in sync while the screen is open.
  const sourceAccount =
    accounts.find(({ id }) => id === route.params.sourceAccount.id) ?? route.params.sourceAccount;

  const [amountText, setAmountText] = useState("");
  const [picked, setPicked] = useState<PickedWithdrawAccount | undefined>();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryKey, setSummaryKey] = useState(0);
  const [summaryParams, setSummaryParams] = useState<PerpsWithdrawSummaryParams | null>(null);

  // Leaving before the withdrawal is submitted abandons it; after that this is a no-op.
  useEffect(() => cancelWithdrawRequest, []);

  const amount = useMemo(() => {
    const parsed = Number(amountText);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountText]);

  const form = usePerpsWithdrawForm({
    sourceAccount,
    accounts,
    amount,
    picked,
    counterValueCurrency,
    locale,
    discreet,
  });
  const { destinationAccount, usdcAmount, quote, quoteAccounts } = form;
  const destinationCurrency = destinationAccount
    ? getAccountCurrency(destinationAccount)
    : undefined;

  const pressAmountKey = useCallback(
    (key: string) =>
      setAmountText(current => applyAmountKey(current, key, counterValueUnit.magnitude)),
    [counterValueUnit],
  );

  const selectAmountRatio = useCallback(
    (ratioAmount: number) => setAmountText(toAmountText(ratioAmount, counterValueUnit.magnitude)),
    [counterValueUnit],
  );

  const pickDestinationAccount = useCallback(() => {
    openDrawer({
      enableAccountSelection: true,
      useCase: "swap",
      areCurrenciesFiltered: false,
      uiUseCase: PERPS_UI_USE_CASE.withdraw,
      flow: PERPS_UI_USE_CASE.withdraw,
      onAccountSelected: (account, parentAccount) => setPicked({ account, parentAccount }),
    });
  }, [openDrawer]);

  const handleReview = useCallback(() => {
    if (!form.canReview || !destinationAccount || !usdcAmount || !quote) return;

    setSummaryParams({
      sourceAccount,
      destinationAccount,
      quote,
      quoteParams: {
        amount: usdcAmount.toFixed(),
        sourceAccount,
        destinationAccount,
        accounts: quoteAccounts,
        counterValueCurrency: counterValueCurrency.ticker,
      },
    });
    // Pinned so closing the sheet shows the reviewed receiver, not a recomputed default.
    if (!picked) setPicked({ account: destinationAccount });
    setSummaryKey(key => key + 1);
    setIsSummaryOpen(true);
  }, [
    picked,
    counterValueCurrency.ticker,
    destinationAccount,
    form.canReview,
    quote,
    quoteAccounts,
    sourceAccount,
    usdcAmount,
  ]);

  // The form stays mounted under the summary, so closing it keeps the amount and destination.
  const closeSummary = useCallback(() => setIsSummaryOpen(false), []);

  const sourceName = accountNameWithDefaultSelector(walletState, sourceAccount);

  return {
    headerDescription: `${sourceName} · ${form.formattedAvailable}`,
    amountText,
    amount,
    currencyCode: counterValueUnit.code,
    quotedAmount: form.quotedAmount,
    isQuoteLoading: form.isQuoteLoading,
    maxDecimalLength: counterValueUnit.magnitude,
    pressAmountKey,
    selectAmountRatio,
    maxAmount: form.maxAmount,
    destinationTicker: destinationCurrency?.ticker ?? "",
    destinationLedgerId: destinationCurrency?.id ?? "",
    destinationAccountName: destinationAccount
      ? accountNameWithDefaultSelector(walletState, destinationAccount)
      : null,
    destinationCounterValue: form.destinationCounterValue,
    missingAccount: destinationAccount === undefined && amount > 0,
    pickDestinationAccount,
    statusError: form.statusError,
    exceedsBalance: form.exceedsBalance,
    canReview: form.canReview,
    handleReview,
    isSummaryOpen,
    summaryKey,
    summaryParams,
    closeSummary,
  };
}
