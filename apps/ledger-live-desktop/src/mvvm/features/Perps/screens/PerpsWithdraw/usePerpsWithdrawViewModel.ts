import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import type { PerpsWithdrawUiParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import {
  usePerpsWithdrawForm,
  type PickedWithdrawAccount,
  type WithdrawFormError,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawForm";
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

/** Snapshot of the form, used to restore it when coming back from the summary. */
export type PerpsWithdrawDraft = Readonly<{
  destinationAccountId: string;
  amountText: string;
}>;

export type PerpsWithdrawData = PerpsWithdrawUiParams & {
  draft?: PerpsWithdrawDraft;
};

const EMPTY_AMOUNT_TEXT = "0";

function toAmountText(amount: number): string {
  return amount ? new BigNumber(amount).toFixed() : EMPTY_AMOUNT_TEXT;
}

export type PerpsWithdrawViewModel = Readonly<{
  headerDescription: string;
  amountText: string;
  amount: number;
  currencyCode: string;
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
  const { draft } = data;
  const walletState = useSelector(walletSelector);
  const accounts = useSelector(flattenAccountsSelector);
  // The store copy stays in sync while the screen is open.
  const sourceAccount =
    accounts.find(({ id }) => id === data.sourceAccount.id) ?? data.sourceAccount;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const dispatch = useDispatch();
  const { openAssetAndAccountPromise } = useOpenAssetAndAccount();
  const counterValueUnit = counterValueCurrency.units[0];

  const [amountText, setAmountText] = useState(draft?.amountText ?? EMPTY_AMOUNT_TEXT);
  const [picked, setPicked] = useState<PickedWithdrawAccount | undefined>(() => {
    const account = accounts.find(({ id }) => id === draft?.destinationAccountId);
    return account ? { account } : undefined;
  });

  const amount = useMemo(() => {
    const parsed = Number(amountText.replace(/[^0-9.]/g, ""));
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
  const { destinationAccount, maxAmount } = form;
  const destinationCurrency = destinationAccount
    ? getAccountCurrency(destinationAccount)
    : undefined;

  const changeAmount = useCallback((formattedValue: string) => {
    setAmountText(formattedValue === "" ? EMPTY_AMOUNT_TEXT : formattedValue);
  }, []);

  const selectAmountRatio = useCallback(
    (ratioAmount: number) => setAmountText(toAmountText(ratioAmount)),
    [],
  );

  const selectMax = useCallback(
    () => setAmountText(toAmountText(applyRatio(maxAmount, 1, counterValueUnit.magnitude))),
    [counterValueUnit, maxAmount],
  );

  const pickDestinationAccount = useCallback(() => {
    dispatch(setFlowValue(PERPS_UI_USE_CASE.withdraw));
    void openAssetAndAccountPromise({
      useCase: "swap",
      uiUseCase: PERPS_UI_USE_CASE.withdraw,
      areCurrenciesFiltered: false,
    })
      .then(({ account, parentAccount }) => setPicked({ account, parentAccount }))
      .catch(() => undefined);
  }, [dispatch, openAssetAndAccountPromise]);

  // TODO(LIVE-39368): open the withdraw summary with the quote and this draft.
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
    changeAmount,
    selectAmountRatio,
    maxAmount,
    selectMax,
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
