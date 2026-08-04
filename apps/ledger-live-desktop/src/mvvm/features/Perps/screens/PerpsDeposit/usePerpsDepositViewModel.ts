import { useCallback, useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { formatCurrencyUnit, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import type { PerpsDepositUiParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import {
  PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
  PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
  PERPS_DEPOSIT_FUNDING_UI_USE_CASE,
} from "../../constants/depositFunding";
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
  counterValueCode: string;
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
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const receiverAccountName = useMemo(
    () => accountNameWithDefaultSelector(walletState, receiverAccount),
    [receiverAccount, walletState],
  );

  const receiverAccountCounterValue = useMemo(() => {
    const counterValue =
      calculateCountervalue(receiverCurrency, receiverAccount.spendableBalance) ?? new BigNumber(0);
    return formatCurrencyUnit(counterValueUnit, counterValue, { showCode: true, locale });
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
      showCode: true,
      locale,
    });
  }, [counterValueUnit, depositAccountBalanceCounterValue, locale]);

  const maxAmount = useMemo(
    () => depositAccountBalanceCounterValue?.shiftedBy(-counterValueUnit.magnitude).toNumber() ?? 0,
    [counterValueUnit.magnitude, depositAccountBalanceCounterValue],
  );

  const selectMax = useCallback(() => setDepositAmount(maxAmount), [maxAmount]);

  const formattedDepositAmount = useMemo(
    () =>
      formatCurrencyUnit(
        counterValueUnit,
        valueFromUnit(new BigNumber(depositAmount), counterValueUnit),
        { showCode: true, locale },
      ),
    [counterValueUnit, depositAmount, locale],
  );

  const submitError = useMemo(
    () => validateDepositFlow({ amount: depositAmount, maxAmount }),
    [depositAmount, maxAmount],
  );

  const exceedsBalance = Boolean(depositAccount) && depositAmount > maxAmount;
  const missingAccount = !depositAccount && depositAmount > 0;
  const canReview = depositAmount > 0 && Boolean(depositAccount) && submitError === null;

  const changeDepositAmount = useCallback((formattedValue: string) => {
    const parsed = Number(formattedValue.replace(/[^0-9.]/g, ""));
    setDepositAmount(Number.isFinite(parsed) ? parsed : 0);
  }, []);

  const pickDepositAccount = useCallback(() => {
    void openAssetAndAccountPromise({
      uiUseCase: PERPS_DEPOSIT_FUNDING_UI_USE_CASE,
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
    onClose();
  }, [canReview, depositAccount, depositCurrency, onClose]);

  const headerDescription = `${receiverAccountName} · ${receiverAccountCounterValue}`;

  return {
    headerDescription,
    depositAmount,
    formattedDepositAmount,
    counterValueCode: counterValueUnit.code,
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
