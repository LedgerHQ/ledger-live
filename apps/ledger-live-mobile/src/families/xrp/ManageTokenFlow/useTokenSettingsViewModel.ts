import { useCallback, useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { isMaxTrustLimit } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { makeChangeTrustTransaction } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenSettings>
>;

export function useTokenSettingsViewModel({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account: tokenAccount, parentAccount } = useAccountScreen(route);
  invariant(tokenAccount?.type === "TokenAccount" && parentAccount, "xrp: token account required");

  const { token } = tokenAccount;
  const unit = token.units[0];

  const { xrpResources } = tokenAccount as XrpTokenAccount;
  // Undefined when the limit is unknown: that is not a limit of 0
  const storedLimit = xrpResources?.limit;
  const storedIsRippling = xrpResources?.isRippling ?? false;
  const storedIsMaximum = !!storedLimit && isMaxTrustLimit(storedLimit);

  const bridge = useAccountBridge<Transaction>(parentAccount);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => ({
    account: parentAccount,
    transaction: makeChangeTrustTransaction(
      bridge,
      parentAccount,
      token,
      storedLimit ?? new BigNumber(0),
      !storedIsRippling,
    ),
  }));
  const { transaction, updateTransaction, status, bridgePending, bridgeError } = bridgeTransaction;

  // Balance limit hands its confirmed value back through the route params
  const confirmedLimit = route.params.balanceLimit;
  const isMaximum = confirmedLimit ? confirmedLimit.isMaximum : storedIsMaximum;
  const limit = useMemo(() => {
    return confirmedLimit ? new BigNumber(confirmedLimit.limit) : (storedLimit ?? new BigNumber(0));
  }, [confirmedLimit, storedLimit]);

  const [isRippling, setIsRippling] = useState(storedIsRippling);
  const [isRipplingSheetOpen, setIsRipplingSheetOpen] = useState(false);

  useEffect(() => {
    updateTransaction(tx => bridge.updateTransaction(tx, { amount: limit, noRipple: !isRippling }));
  }, [bridge, isRippling, limit, updateTransaction]);

  const onEditLimit = useCallback(() => {
    navigation.navigate(ScreenName.XrpManageTokenBalanceLimit, {
      balanceLimit: { limit: limit.toFixed(), isMaximum },
      accountId: tokenAccount.id,
      parentId: parentAccount.id,
    });
  }, [isMaximum, limit, navigation, parentAccount.id, tokenAccount.id]);

  const onChangeRippling = useCallback((value: boolean) => {
    setIsRippling(value);
    setIsRipplingSheetOpen(false);
  }, []);

  const onOpenRipplingSheet = useCallback(() => setIsRipplingSheetOpen(true), []);
  const onCloseRipplingSheet = useCallback(() => setIsRipplingSheetOpen(false), []);

  const onContinue = useCallback(() => {
    if (!transaction) return;

    navigation.navigate(ScreenName.XrpManageTokenSelectDevice, {
      accountId: tokenAccount.id,
      parentId: parentAccount.id,
      token,
      transaction,
      status,
    });
  }, [navigation, parentAccount.id, status, token, tokenAccount.id, transaction]);

  const isLimitChanged = !storedLimit?.eq(limit);
  const isRipplingChanged = isRippling !== storedIsRippling;
  const hasChanged = isLimitChanged || isRipplingChanged;

  const isTransactionInSync =
    !!transaction && transaction.amount.eq(limit) && transaction.noRipple === !isRippling;
  // The status describes an older transaction until the bridge answers for the edited one
  const isStatusCurrent = isTransactionInSync && !bridgePending;

  const statusErrors = Object.values(status.errors);
  const hasStatusError = statusErrors.length > 0;
  const currentStatusErrors = isStatusCurrent ? statusErrors : [];
  // Continue is disabled while nothing changed, so the bridge's "unchanged" error would be noise
  const shownStatusErrors = hasChanged
    ? currentStatusErrors
    : currentStatusErrors.filter(error => error.name !== "XrpTrustSetUnchanged");

  const hasNothingToSign = !hasChanged || !isTransactionInSync;
  const isStatusPending = bridgePending || hasStatusError;

  return {
    isRippling,
    isRipplingSheetOpen,
    onEditLimit,
    onChangeRippling,
    onOpenRipplingSheet,
    onCloseRipplingSheet,
    onContinue,
    errors: [...(bridgeError ? [bridgeError] : []), ...shownStatusErrors],
    ripplingText: t(isRippling ? "xrp.rippling.activated" : "xrp.rippling.deactivated"),
    isCurrentLimitZero: !!storedLimit?.isZero(),
    isContinueDisabled: hasNothingToSign || isStatusPending,
    isContinueLoading: bridgePending,
    limitText: isMaximum
      ? t("xrp.tokenSettings.maximum")
      : formatCurrencyUnit(unit, limit, { showCode: true }),
  };
}
