import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
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
import type { CardTopUpRatio } from "@features/flow-pay-card-top-up";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { openURL } from "~/renderer/linking";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { BAANX_LEGAL_URL } from "../../constants";
import { useCardTopUpExecution } from "../../hooks/useCardTopUpExecution";
import { useCardTopUpMaxAmount } from "../../hooks/useCardTopUpMaxAmount";
import type { CardTopUpData, CardTopUpInputMode, CardTopUpViewModel } from "./types";

const KEY_PREFIX = "payTab.cardTopUp";

const RATIOS = [
  { id: "25", ratio: 0.25 },
  { id: "50", ratio: 0.5 },
  { id: "75", ratio: 0.75 },
  { id: "max", ratio: 1 },
] as const;

export function useCardTopUpViewModel(
  data: CardTopUpData,
  onClose: () => void,
): CardTopUpViewModel {
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
        ? formatFiatForInput(fiatUnit, calculateFiat(currency, value) ?? new BigNumber(0), locale)
        : formatAmountForInput(unit, value, locale),
    [calculateFiat, currency, fiatUnit, locale, unit],
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
        const processed = processRawInput(text, unit, locale);
        setAmountText(processed.display);
        setAmount(processed.value.integerValue(BigNumber.ROUND_DOWN));
        return;
      }

      const processed = processFiatInput(text, fiatUnit, locale);
      setAmountText(processed.clampedDisplay);
      if (processed.isOverLimit) return;
      setAmount(calculateCryptoAmount(processed.value).integerValue(BigNumber.ROUND_DOWN));
    },
    [calculateCryptoAmount, fiatUnit, inputMode, locale, unit],
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
    if (canSubmit) void execute(amount);
  }, [amount, canSubmit, execute]);

  const onOpenLegal = useCallback(() => openURL(BAANX_LEGAL_URL), []);

  return {
    title: t(`${KEY_PREFIX}.title`, { asset: data.asset.ticker }),
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
    deviceStep,
    onAmountChange,
    onToggleInputMode,
    onSubmit,
    onOpenLegal,
    onRetry: reset,
    onDeviceError,
    onClose,
  };
}
