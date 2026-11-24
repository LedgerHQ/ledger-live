import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnit, sanitizeValueString } from "@ledgerhq/live-common/currencies/index";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import {
  formatTrustLimit,
  getLimitError,
  isLimitBelowBalance,
} from "@ledgerhq/live-common/families/xrp/tokens";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Unit } from "@domain/entity-currency-unit";
import { useSelector } from "LLD/hooks/redux";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { localeSelector } from "~/renderer/reducers/settings";

const ZERO = new BigNumber(0);

type Params = Readonly<{
  bridge: AccountBridge<Transaction>;
  transaction: Transaction | null | undefined;
  updateTransaction: (updater: (transaction: Transaction) => Transaction) => void;
  status: TransactionStatus;
  bridgePending: boolean;
  unit: Unit;
  balance: BigNumber;
}>;

export function useTrustSettings({
  bridge,
  transaction,
  updateTransaction,
  status,
  bridgePending,
  unit,
  balance,
}: Params) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const discreet = useDiscreetMode();
  const [isLimitStep, setIsLimitStep] = useState(false);
  const [limitText, setLimitText] = useState("");
  const [limitBeforeEdit, setLimitBeforeEdit] = useState(ZERO);

  const limit = transaction?.amount ?? ZERO;
  const isRippling = transaction?.noRipple === false;

  const toLimitText = useCallback(
    (value: BigNumber) => {
      return formatCurrencyUnit(unit, value, { locale, useGrouping: false, disableRounding: true });
    },
    [locale, unit],
  );

  const setLimit = useCallback(
    (value: BigNumber) => {
      updateTransaction(tx => bridge.updateTransaction(tx, { amount: value }));
    },
    [bridge, updateTransaction],
  );

  const onOpenLimit = useCallback(() => {
    setLimitBeforeEdit(limit);
    setLimitText(toLimitText(limit));
    setIsLimitStep(true);
  }, [limit, toLimitText]);

  const onChangeLimitText = useCallback(
    (text: string) => {
      const sanitized = sanitizeValueString(unit, text, locale);
      setLimitText(sanitized.display);
      setLimit(new BigNumber(sanitized.value || 0));
    },
    [locale, setLimit, unit],
  );

  const onSetMaxLimit = useCallback(() => {
    setLimit(MAX_TRUST_LIMIT);
    setLimitText(toLimitText(MAX_TRUST_LIMIT));
  }, [setLimit, toLimitText]);

  const onLimitBack = useCallback(() => {
    setLimit(limitBeforeEdit);
    setIsLimitStep(false);
  }, [limitBeforeEdit, setLimit]);

  const onLimitConfirm = useCallback(() => setIsLimitStep(false), []);

  const onChangeRippling = useCallback(
    (value: boolean) => {
      updateTransaction(tx => bridge.updateTransaction(tx, { noRipple: !value }));
    },
    [bridge, updateTransaction],
  );

  const isLimitEmpty = limitText === "";
  const isStatusShown = !isLimitEmpty && !bridgePending;
  const limitError = isStatusShown ? getLimitError(status) : undefined;
  const isBelowBalance = isLimitBelowBalance(limit, balance);

  const getLimitErrorText = () => {
    if (limitError) return t(`errors.${limitError.name}.title`);
    if (!isBelowBalance) return undefined;

    const formattedBalance = formatCurrencyUnit(unit, balance, {
      discreet,
      locale,
      showCode: true,
    });

    return t("xrp.tokenSettings.limitBelowBalance", { balance: formattedBalance });
  };

  return {
    limit,
    isRippling,
    isLimitStep,
    limitText,
    onOpenLimit,
    onChangeLimitText,
    onSetMaxLimit,
    onLimitBack,
    onLimitConfirm,
    onChangeRippling,
    bridgePending,
    unitCode: unit.code,
    limitErrorText: getLimitErrorText(),
    isLimitConfirmDisabled: isLimitEmpty || Boolean(limitError) || isBelowBalance || bridgePending,
    limitLabel: formatTrustLimit({
      limit,
      unit,
      locale,
      discreet: false,
      maximumLabel: t("xrp.addToken.steps.settings.maximum"),
    }),
  };
}

export type TrustSettings = ReturnType<typeof useTrustSettings>;
