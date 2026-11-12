import { useCallback } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getMaxTrustLimitForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { makeChangeTrustTransaction } from "../utils";
import { useTrustLimitInput } from "../useTrustLimitInput";
import type { XrpAddTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenSettings>
>;

export function useSettingsViewModel({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const { token } = route.params;

  const bridge = useAccountBridge<Transaction>(account);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => {
    return {
      account,
      transaction: makeChangeTrustTransaction(bridge, account, token, new BigNumber(0)),
    };
  });
  const { transaction, updateTransaction, status, bridgePending, bridgeError } = bridgeTransaction;

  const maxLimit = getMaxTrustLimitForToken();

  const updateLimit = useCallback(
    (limit: BigNumber) => updateTransaction(tx => bridge.updateTransaction(tx, { amount: limit })),
    [bridge, updateTransaction],
  );

  const trustLimit = useTrustLimitInput({
    unit: token.units[0],
    maxLimit,
    initial: { isMaximum: false, limitText: "", isRippling: false },
    onLimitChange: updateLimit,
  });
  const { isMaximum, isRippling, hasTypedLimit } = trustLimit;

  const onContinue = useCallback(() => {
    if (!transaction) return;

    navigation.navigate(ScreenName.XrpAddTokenReview, {
      token,
      accountId: account.id,
      settings: { limit: transaction.amount, isMaximum, isRippling },
    });
  }, [account.id, isMaximum, isRippling, navigation, token, transaction]);

  const hasLimitZero = Object.values(status.errors).some(e => e.name === "XrpTrustLimitZero");

  return {
    ...trustLimit,
    token,
    maxLimit,
    bridgeError,
    onContinue,
    isLimitErrorVisible: hasLimitZero && hasTypedLimit,
    isContinueDisabled: bridgePending || hasLimitZero,
    isContinueLoading: bridgePending,
  };
}
