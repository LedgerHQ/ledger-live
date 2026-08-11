import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector, localeSelector } from "~/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import {
  PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
  PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
} from "../../constants/depositFunding";
import { AMOUNT_MAX_INTEGER_DIGITS, applyAmountKey, toAmountText } from "./utils/amountKeys";
import { validateDepositFlow } from "./utils/validateDepositFlow";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsDeposit>
>;

export type PerpsDepositViewModel = Readonly<{
  headerDescription: string;
  amountText: string;
  depositAmount: number;
  formattedDepositAmount: string;
  counterValueCode: string;
  maxIntegerLength: number;
  maxDecimalLength: number;
  pressAmountKey: (key: string) => void;
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

export function usePerpsDepositViewModel({ route }: NavigationProps): PerpsDepositViewModel {
  const { receiverAccount } = route.params;

  const walletState = useSelector(walletSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const { openDrawer } = useModularDrawerController();

  const [depositAccount, setDepositAccount] = useState<AccountLike | undefined>(undefined);
  const [amountText, setAmountText] = useState("");

  const depositAmount = useMemo(() => {
    const parsed = Number(amountText.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountText]);

  const counterValueUnit = counterValueCurrency.units[0];

  const maxDecimalLength = Math.max(0, counterValueUnit.magnitude);

  const setDepositAmount = useCallback(
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

  // Balance of the funding account, in the smallest unit of the counter value currency.
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

  const selectMax = useCallback(() => setDepositAmount(maxAmount), [maxAmount, setDepositAmount]);

  const formattedDepositAmount = useMemo(
    () =>
      formatCurrencyUnit(
        counterValueUnit,
        valueFromUnit(new BigNumber(depositAmount), counterValueUnit),
        { showCode: false, locale },
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

  const pickDepositAccount = useCallback(() => {
    openDrawer({
      enableAccountSelection: true,
      areCurrenciesFiltered: false,
      uiUseCase: PERPS_UI_USE_CASE.fund,
      onAccountSelected: account => {
        setDepositAccount(account);
        setAmountText("");
      },
    });
  }, [openDrawer]);

  const handleReview = useCallback(() => undefined, []);

  return {
    headerDescription: `${receiverAccountName} · ${receiverAccountCounterValue}`,
    amountText,
    depositAmount,
    formattedDepositAmount,
    counterValueCode: counterValueUnit.code,
    maxIntegerLength: AMOUNT_MAX_INTEGER_DIGITS,
    maxDecimalLength,
    pressAmountKey,
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
