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
  const { destinationAccount } = form;
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

  // TODO(LIVE-39368): open the withdraw summary.
  const handleReview = useCallback(() => undefined, []);

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
  };
}
