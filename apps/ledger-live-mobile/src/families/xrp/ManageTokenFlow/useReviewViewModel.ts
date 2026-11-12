import { useCallback } from "react";
import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { makeChangeTrustTransaction } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenReview>
>;

export function useReviewViewModel({ navigation, route }: Props) {
  const { account: tokenAccount, parentAccount } = useAccountScreen(route);
  invariant(tokenAccount?.type === "TokenAccount" && parentAccount, "xrp: token account required");

  const { settings } = route.params;
  const { token } = tokenAccount;

  const bridge = useAccountBridge<Transaction>(parentAccount);
  const { transaction, status, bridgeError, bridgePending } = useBridgeTransaction<Transaction>(
    bridge,
    () => {
      return {
        account: parentAccount,
        transaction: makeChangeTrustTransaction(bridge, parentAccount, token, settings.limit),
      };
    },
  );

  const onContinue = useCallback(() => {
    if (!transaction) return;

    navigation.navigate(ScreenName.XrpManageTokenSelectDevice, {
      accountId: tokenAccount.id,
      parentId: parentAccount.id,
      token,
      transaction,
      status,
      settings,
    });
  }, [navigation, parentAccount.id, settings, status, token, tokenAccount.id, transaction]);

  const statusErrors = Object.values(status.errors);
  const hasBlockingError = statusErrors.length > 0 || !!bridgeError;

  return {
    token,
    settings,
    onContinue,
    accountUnit: parentAccount.currency.units[0],
    estimatedFees: status.estimatedFees,
    errors: [...(bridgeError ? [bridgeError] : []), ...statusErrors],
    warnings: Object.values(status.warnings),
    isContinueDisabled: bridgePending || hasBlockingError,
    isContinueLoading: bridgePending,
  };
}
