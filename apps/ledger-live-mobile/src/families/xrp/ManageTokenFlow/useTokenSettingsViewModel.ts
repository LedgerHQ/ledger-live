import { useCallback } from "react";
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
import { getXrpResources, makeChangeTrustTransaction } from "../utils";
import { useTrustLimitInput } from "../useTrustLimitInput";
import type { XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenSettings>
>;

export function useTokenSettingsViewModel({ navigation, route }: Props) {
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

  const updateLimit = useCallback(
    (newLimit: BigNumber) => {
      updateTransaction(tx => bridge.updateTransaction(tx, { amount: newLimit }));
    },
    [bridge, updateTransaction],
  );

  const trustLimit = useTrustLimitInput({
    unit,
    maxLimit,
    initial: {
      isMaximum: storedIsMaximum,
      limitText:
        storedLimit && !storedIsMaximum ? storedLimit.shiftedBy(-unit.magnitude).toFixed() : "",
      isRippling: storedIsRippling,
    },
    onLimitChange: updateLimit,
  });
  const { limit, isMaximum, isRippling, hasTypedLimit } = trustLimit;

  const onReview = useCallback(() => {
    navigation.navigate(ScreenName.XrpManageTokenReview, {
      accountId: tokenAccount.id,
      parentId: parentAccount.id,
      settings: { limit, isMaximum, isRippling },
    });
  }, [isMaximum, isRippling, limit, navigation, parentAccount.id, tokenAccount.id]);

  const isLimitChanged = !storedLimit?.eq(limit);
  const isRipplingChanged = isRippling !== storedIsRippling;
  const hasChanged = isLimitChanged || isRipplingChanged;

  const isLimitZero = limit.isZero();
  const hasStatusError = Object.keys(status.errors).length > 0;
  const hasLimitZero = Object.values(status.errors).some(e => e.name === "XrpTrustLimitZero");

  const isCustomLimit = !isMaximum && limit.gt(0);
  const isLimitBelowBalance = isCustomLimit && limit.lt(tokenAccount.balance);

  // A failing bridge call keeps bridgePending true, so it needs no term here
  const hasBlockingError = isLimitZero || hasStatusError;
  const isNotReady = bridgePending || !hasChanged;

  return {
    ...trustLimit,
    token,
    maxLimit,
    onReview,
    bridgeError,
    isLimitBelowBalance,
    estimatedFees: status.estimatedFees,
    accountUnit: parentAccount.currency.units[0],
    isLimitErrorVisible: hasLimitZero && hasTypedLimit,
    isCurrentLimitZero: !!storedLimit?.isZero(),
    balanceText: formatCurrencyUnit(unit, tokenAccount.balance, { showCode: true }),
    isReviewDisabled: isNotReady || hasBlockingError,
    isReviewLoading: bridgePending,
  };
}
