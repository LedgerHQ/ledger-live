import { useCallback, useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getMaxTrustLimitForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { getXrpResources, makeChangeTrustTransaction } from "../utils";
import type { BalanceLimit, XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenSettings>
>;

export function useTokenSettingsViewModel({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account: tokenAccount, parentAccount } = useAccountScreen(route);
  invariant(tokenAccount?.type === "TokenAccount" && parentAccount, "xrp: token account required");

  const { token } = tokenAccount;
  const unit = token.units[0];
  const maxLimit = getMaxTrustLimitForToken();

  const storedResources = getXrpResources(tokenAccount);
  // Undefined when the limit is unknown: that is not a limit of 0
  const storedLimit = storedResources?.limit;
  const storedIsRippling = storedResources?.isRippling ?? false;
  const storedIsMaximum = !!storedLimit?.eq(maxLimit);

  const bridge = useAccountBridge<Transaction>(parentAccount);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => {
    return {
      account: parentAccount,
      transaction: makeChangeTrustTransaction(
        bridge,
        parentAccount,
        token,
        storedLimit ?? new BigNumber(0),
      ),
    };
  });
  const { updateTransaction, status, bridgePending, bridgeError } = bridgeTransaction;

  const storedBalanceLimit = useMemo<BalanceLimit>(
    () => ({ limit: storedLimit ?? new BigNumber(0), isMaximum: storedIsMaximum }),
    [storedIsMaximum, storedLimit],
  );
  // Balance limit hands its confirmed value back through the route params
  const balanceLimit = route.params.balanceLimit ?? storedBalanceLimit;

  const [isRippling, setIsRippling] = useState(storedIsRippling);
  const [isRipplingSheetOpen, setIsRipplingSheetOpen] = useState(false);
  const [isRipplingInfoOpen, setIsRipplingInfoOpen] = useState(false);

  const { limit, isMaximum } = balanceLimit;
  useEffect(() => {
    updateTransaction(tx => bridge.updateTransaction(tx, { amount: limit }));
  }, [bridge, limit, updateTransaction]);

  const onEditLimit = useCallback(() => {
    navigation.navigate(ScreenName.XrpManageTokenBalanceLimit, {
      balanceLimit,
      accountId: tokenAccount.id,
      parentId: parentAccount.id,
    });
  }, [balanceLimit, navigation, parentAccount.id, tokenAccount.id]);

  const onChangeRippling = useCallback((value: boolean) => {
    setIsRippling(value);
    setIsRipplingSheetOpen(false);
  }, []);

  const onOpenRipplingSheet = useCallback(() => setIsRipplingSheetOpen(true), []);
  const onCloseRipplingSheet = useCallback(() => setIsRipplingSheetOpen(false), []);
  const onOpenRipplingInfo = useCallback(() => setIsRipplingInfoOpen(true), []);
  const onCloseRipplingInfo = useCallback(() => setIsRipplingInfoOpen(false), []);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.XrpManageTokenReview, {
      accountId: tokenAccount.id,
      parentId: parentAccount.id,
      settings: { limit, isMaximum, isRippling },
    });
  }, [isMaximum, isRippling, limit, navigation, parentAccount.id, tokenAccount.id]);

  const isLimitChanged = !storedLimit?.eq(limit);
  const isRipplingChanged = isRippling !== storedIsRippling;
  const hasChanged = isLimitChanged || isRipplingChanged;

  const hasStatusError = Object.keys(status.errors).length > 0;
  const hasBlockingError = limit.isZero() || hasStatusError;
  // A failing bridge call keeps bridgePending true, so it needs no term here
  const isNotReady = bridgePending || !hasChanged;

  const isCustomLimit = !isMaximum && limit.gt(0);

  return {
    isRippling,
    isRipplingSheetOpen,
    isRipplingInfoOpen,
    onEditLimit,
    onChangeRippling,
    onOpenRipplingSheet,
    onCloseRipplingSheet,
    onOpenRipplingInfo,
    onCloseRipplingInfo,
    onContinue,
    bridgeError,
    isLimitBelowBalance: isCustomLimit && limit.lt(tokenAccount.balance),
    ripplingText: t(isRippling ? "xrp.rippling.activated" : "xrp.rippling.deactivated"),
    isCurrentLimitZero: !!storedLimit?.isZero(),
    balanceText: formatCurrencyUnit(unit, tokenAccount.balance, { showCode: true }),
    isContinueDisabled: isNotReady || hasBlockingError,
    isContinueLoading: bridgePending,
    limitText: isMaximum
      ? t("xrp.tokenSettings.maximum")
      : formatCurrencyUnit(unit, limit, { showCode: true }),
  };
}
