import React, { useCallback } from "react";
import type BigNumber from "bignumber.js";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import BalanceLimitScreen from "../components/BalanceLimitScreen";
import type { XrpAddTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenBalanceLimit>
>;

export default function BalanceLimit() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { accountId, token, balanceLimit } = route.params;

  const onConfirm = useCallback(
    (limit: BigNumber) => {
      navigation.popTo(
        ScreenName.XrpAddTokenReview,
        { accountId, token, balanceLimit: { limit: limit.toFixed() } },
        { merge: true },
      );
    },
    [accountId, navigation, token],
  );

  return (
    <BalanceLimitScreen
      token={token}
      limit={balanceLimit.limit}
      onConfirm={onConfirm}
      trackCategory="XrpAddTokenFlow"
    />
  );
}
