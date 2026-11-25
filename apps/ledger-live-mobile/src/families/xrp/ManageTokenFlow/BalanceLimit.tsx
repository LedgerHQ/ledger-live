import React, { useCallback } from "react";
import type BigNumber from "bignumber.js";
import invariant from "invariant";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import BalanceLimitScreen from "../components/BalanceLimitScreen";
import TokenAccountGate from "./TokenAccountGate";
import type { XrpManageTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenBalanceLimit>
>;

function BalanceLimitContent() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { account: tokenAccount } = useAccountScreen(route);
  invariant(tokenAccount?.type === "TokenAccount", "xrp: token account required");

  const { accountId, parentId, balanceLimit } = route.params;

  const onConfirm = useCallback(
    (limit: BigNumber) => {
      navigation.popTo(
        ScreenName.XrpManageTokenSettings,
        { accountId, parentId, balanceLimit: { limit: limit.toFixed() } },
        { merge: true },
      );
    },
    [accountId, navigation, parentId],
  );

  return (
    <BalanceLimitScreen
      token={tokenAccount.token}
      limit={balanceLimit.limit}
      balance={tokenAccount.balance}
      onConfirm={onConfirm}
      trackCategory="XrpManageTokenFlow"
    />
  );
}

export default function BalanceLimit() {
  return (
    <TokenAccountGate>
      <BalanceLimitContent />
    </TokenAccountGate>
  );
}
