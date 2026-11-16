import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnit, sanitizeValueString } from "@ledgerhq/live-common/currencies/index";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Unit } from "@domain/entity-currency-unit";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { formatTrustLimit } from "../../utils";

const ZERO = new BigNumber(0);

function getLimitError(status: TransactionStatus): Error | undefined {
  const amountError = status.errors.amount;

  return amountError?.name === "XrpAccountNotActivated" ? undefined : amountError;
}

export function useTrustSettings({
  bridge,
  transaction,
  updateTransaction,
  status,
  unit,
  balance,
  currentLimit,
}: {
  bridge: AccountBridge<Transaction>;
  transaction: Transaction | null | undefined;
  updateTransaction: (updater: (transaction: Transaction) => Transaction) => void;
  status: TransactionStatus;
  unit: Unit;
  balance: BigNumber;
  currentLimit?: BigNumber;
}) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
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

  const limitError = getLimitError(status);
  const isLimitStillZero = Boolean(currentLimit?.isZero()) && limit.isZero();
  const isLimitBelowBalance = limit.gt(0) && limit.lt(balance);
  const formattedBalance = formatCurrencyUnit(unit, balance, { locale, showCode: true });

  const getLimitErrorText = () => {
    if (limitError) return t(`errors.${limitError.name}.title`);
    if (isLimitStillZero) return t("xrp.tokenSettings.currentLimitZero");
    if (!isLimitBelowBalance) return undefined;

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
    unitCode: unit.code,
    hasLimitError: Boolean(limitError),
    limitErrorText: getLimitErrorText(),
    limitLabel: formatTrustLimit({
      limit,
      unit,
      locale,
      maximumLabel: t("xrp.addToken.steps.settings.maximum"),
    }),
  };
}

export type TrustSettings = ReturnType<typeof useTrustSettings>;
