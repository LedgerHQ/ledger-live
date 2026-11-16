import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit, sanitizeValueString } from "@ledgerhq/live-common/currencies/index";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { makeChangeTrustTransaction } from "../../AddTokenModal/Body";
import { formatTrustLimit, getXrpResources } from "../../utils";
import { useSignatureSteps } from "../Signature/useSignatureSteps";

function getLimitError(status: TransactionStatus): Error | undefined {
  const amountError = status.errors.amount;

  return amountError?.name === "XrpAccountNotActivated" ? undefined : amountError;
}

export function useEditAssetViewModel(account: Account, tokenAccount: TokenAccount) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const unit = tokenAccount.token.units[0];
  const xrpResources = getXrpResources(tokenAccount);
  const currentLimit = xrpResources?.limit ?? new BigNumber(0);
  const isCurrentlyRippling = Boolean(xrpResources?.isRippling);

  const bridge = useAccountBridge<Transaction>(account, undefined);
  const { transaction, updateTransaction, status, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => {
      return {
        account,
        parentAccount: undefined,
        transaction: makeChangeTrustTransaction(bridge, account, tokenAccount),
      };
    });
  const signature = useSignatureSteps(account, transaction, status);

  const [isLimitStep, setIsLimitStep] = useState(false);
  const [limitText, setLimitText] = useState("");
  const [limitBeforeEdit, setLimitBeforeEdit] = useState(currentLimit);

  const limit = transaction?.amount ?? currentLimit;
  const isRippling = transaction?.noRipple === false;
  const isLimitChanged = !limit.eq(currentLimit);
  const isRipplingChanged = isRippling !== isCurrentlyRippling;

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
  const isLimitStillZero = currentLimit.isZero() && limit.isZero();
  const isLimitBelowBalance = limit.gt(0) && limit.lt(tokenAccount.balance);
  const formattedBalance = formatCurrencyUnit(unit, tokenAccount.balance, {
    locale,
    showCode: true,
  });

  const getLimitErrorText = () => {
    if (limitError) return t(`errors.${limitError.name}.title`);
    if (isLimitStillZero) return t("xrp.tokenSettings.currentLimitZero");
    if (!isLimitBelowBalance) return undefined;

    return t("xrp.tokenSettings.limitBelowBalance", { balance: formattedBalance });
  };

  return {
    signature,
    isLimitStep,
    limitText,
    isRippling,
    onOpenLimit,
    onChangeLimitText,
    onSetMaxLimit,
    onLimitBack,
    onLimitConfirm,
    onChangeRippling,
    unitCode: unit.code,
    limitErrorText: getLimitErrorText(),
    isContinueDisabled: !(isLimitChanged || isRipplingChanged) || bridgePending,
    isLimitConfirmDisabled: Boolean(limitError) || bridgePending,
    limitLabel: formatTrustLimit({
      limit,
      unit,
      locale,
      maximumLabel: t("xrp.addToken.steps.settings.maximum"),
    }),
  };
}
