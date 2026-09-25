import { useCallback, useMemo, useState } from "react";
import { Linking } from "react-native";
import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  formatAmountForInput,
  formatFiatForInput,
  processFiatInput,
  processRawInput,
} from "@ledgerhq/live-common/flows/send/amount/utils/amountInput";
import {
  useCalculateCountervalueCallback,
  useSendAmount,
} from "@ledgerhq/live-countervalues-react";
import type { CardTopUpAmountViewProps, CardTopUpRatio } from "@features/flow-pay-card-top-up";
import { useTranslation } from "@shared/i18n";
import { useSelector } from "~/context/hooks";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/reducers/settings";
import { useMaybeAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { BAANX_LEGAL_URL } from "../../constants";
import { useCardTopUpExecution, type CardTopUpDeviceStep } from "../../hooks/useCardTopUpExecution";
import { useCardTopUpMaxAmount } from "../../hooks/useCardTopUpMaxAmount";
import type { CardTopUpDestination } from "../../types";

const KEY_PREFIX = "payTab.cardTopUp";

/** The in-app keypad always types "." as the decimal separator, whatever the app locale. */
const INPUT_LOCALE = "en";

const RATIOS = [
  { id: "25", ratio: 0.25 },
  { id: "50", ratio: 0.5 },
  { id: "75", ratio: 0.75 },
  { id: "max", ratio: 1 },
] as const;

type CardTopUpInputMode = "fiat" | "crypto";

export type CardTopUpData = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  destination: CardTopUpDestination;
}>;

export type CardTopUpSignViewModel = Readonly<{
  isOpen: boolean;
  device: Device | undefined;
  deviceStep: CardTopUpDeviceStep;
  onSelectDevice: (device: Device) => void;
  onRetry: () => void;
  onDeviceError: (error: Error) => void;
  onCancel: () => void;
  onDone: () => void;
}>;

export type CardTopUpViewModel = CardTopUpAmountViewProps &
  Readonly<{
    sign: CardTopUpSignViewModel;
  }>;

export function useCardTopUpViewModel(data: CardTopUpData, onDone: () => void): CardTopUpViewModel {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const currency = useMemo(() => getAccountCurrency(data.account), [data.account]);
  const unit = useAccountUnit(data.account);
  const fiatUnit = counterValueCurrency.units[0];
  const sourceAccountName = useMaybeAccountName(data.account) ?? currency.name;
  const maxAmount = useCardTopUpMaxAmount(data.account, data.parentAccount);

  /** The crypto amount in its smallest unit is what gets signed; the input text only mirrors it. */
  const [amount, setAmount] = useState(() => new BigNumber(0));
  const [amountText, setAmountText] = useState("");
  const [chosenMode, setChosenMode] = useState<CardTopUpInputMode | null>(null);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [device, setDevice] = useState<Device | undefined>();

  const calculateFiat = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const { fiatAmount, calculateCryptoAmount } = useSendAmount({
    account: data.account,
    fiatCurrency: counterValueCurrency,
    cryptoAmount: amount,
  });

  const hasRate = Boolean(
    calculateFiat(currency, new BigNumber(10).pow(unit.magnitude))?.isGreaterThan(0),
  );
  const inputMode: CardTopUpInputMode = hasRate ? (chosenMode ?? "fiat") : "crypto";

  const toInputText = useCallback(
    (mode: CardTopUpInputMode, value: BigNumber) =>
      mode === "fiat"
        ? formatFiatForInput(
            fiatUnit,
            calculateFiat(currency, value) ?? new BigNumber(0),
            INPUT_LOCALE,
          )
        : formatAmountForInput(unit, value, INPUT_LOCALE),
    [calculateFiat, currency, fiatUnit, unit],
  );

  const selectAmount = useCallback(
    (value: BigNumber) => {
      setChosenMode(inputMode);
      setAmount(value);
      setAmountText(toInputText(inputMode, value));
    },
    [inputMode, toInputText],
  );

  const onAmountChange = useCallback(
    (text: string) => {
      setChosenMode(inputMode);

      if (inputMode === "crypto") {
        const processed = processRawInput(text, unit, INPUT_LOCALE);
        setAmountText(processed.display);
        setAmount(processed.value.integerValue(BigNumber.ROUND_DOWN));
        return;
      }

      const processed = processFiatInput(text, fiatUnit, INPUT_LOCALE);
      setAmountText(processed.clampedDisplay);
      if (processed.isOverLimit) return;
      setAmount(calculateCryptoAmount(processed.value).integerValue(BigNumber.ROUND_DOWN));
    },
    [calculateCryptoAmount, fiatUnit, inputMode, unit],
  );

  const onToggleInputMode = useCallback(() => {
    const next: CardTopUpInputMode = inputMode === "fiat" ? "crypto" : "fiat";
    setChosenMode(next);
    setAmountText(toInputText(next, amount));
  }, [amount, inputMode, toInputText]);

  const ratios = useMemo<CardTopUpRatio[]>(
    () =>
      RATIOS.map(({ id, ratio }) => ({
        id,
        label: id === "max" ? t(`${KEY_PREFIX}.max`) : `${id}%`,
        disabled: !maxAmount?.isGreaterThan(0),
        onSelect: () => {
          if (maxAmount) selectAmount(maxAmount.times(ratio).integerValue(BigNumber.ROUND_DOWN));
        },
      })),
    [maxAmount, selectAmount, t],
  );

  const amountError = amount.isGreaterThan(maxAmount ?? data.account.spendableBalance)
    ? t(`${KEY_PREFIX}.insufficientBalance`)
    : null;
  const canSubmit = amount.isGreaterThan(0) && amountError === null;

  let secondaryValue: string | null = null;
  if (inputMode === "fiat") {
    secondaryValue = formatCurrencyUnit(unit, amount, {
      showCode: true,
      disableRounding: true,
      locale,
    });
  } else if (hasRate) {
    secondaryValue = formatCurrencyUnit(fiatUnit, fiatAmount, { showCode: true, locale });
  }

  const balanceCountervalue = hasRate
    ? calculateFiat(currency, data.account.spendableBalance)
    : null;
  const balance = formatCurrencyUnit(
    balanceCountervalue ? fiatUnit : unit,
    balanceCountervalue ?? data.account.spendableBalance,
    { showCode: true, discreet, locale },
  );

  const { deviceStep, execute, reset, onDeviceError } = useCardTopUpExecution(data);

  const onSubmit = useCallback(() => {
    if (canSubmit) setIsSignOpen(true);
  }, [canSubmit]);

  const onSelectDevice = useCallback(
    (selected: Device) => {
      setDevice(selected);
      void execute(amount);
    },
    [amount, execute],
  );

  const onRetry = useCallback(() => void execute(amount), [amount, execute]);

  const onCancel = useCallback(() => {
    reset();
    setIsSignOpen(false);
    setDevice(undefined);
  }, [reset]);

  const onOpenLegal = useCallback(() => void Linking.openURL(BAANX_LEGAL_URL), []);

  return {
    title: t(`${KEY_PREFIX}.title`, { asset: data.destination.ticker }),
    headerDescription: t(`${KEY_PREFIX}.source`, { account: sourceAccountName, balance }),
    amountText,
    currencyText:
      inputMode === "fiat"
        ? (("symbol" in counterValueCurrency ? counterValueCurrency.symbol : undefined) ??
          fiatUnit.code)
        : unit.code,
    currencyPosition: inputMode === "fiat" ? "left" : "right",
    maxDecimalLength: Math.max(0, (inputMode === "fiat" ? fiatUnit : unit).magnitude),
    secondaryValue,
    canToggleInputMode: hasRate,
    amountError,
    ratios,
    canSubmit,
    onAmountChange,
    onToggleInputMode,
    onSubmit,
    onOpenLegal,
    sign: {
      isOpen: isSignOpen,
      device,
      deviceStep,
      onSelectDevice,
      onRetry,
      onDeviceError,
      onCancel,
      onDone,
    },
  };
}
