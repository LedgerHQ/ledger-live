import React, { useCallback, useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { useBaanxAuth } from "../../Navigator";
import type { BaanxCardNavigatorParamList } from "../../types";
import BaanxDashboardScreenView from "./BaanxDashboardScreenView";
import { useBaanxDashboardViewModel } from "./useBaanxDashboardViewModel";

type DashboardRouteProp = RouteProp<
  BaanxCardNavigatorParamList,
  typeof ScreenName.BaanxCardDashboard
>;

type DashboardNavigationProp = NativeStackNavigationProp<
  BaanxCardNavigatorParamList,
  typeof ScreenName.BaanxCardDashboard
>;

export const BaanxDashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const route = useRoute<DashboardRouteProp>();
  const { accessToken } = useBaanxAuth();
  const transactionId = route.params?.transactionId;

  useEffect(() => {
    if (transactionId) {
      navigation.setParams({ transactionId: undefined });
    }
  }, [transactionId, navigation]);

  const navigateToAgent = useCallback(
    (agentId: string) => {
      (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
        ScreenName.AgentDetail,
        { agentId },
      );
    },
    [navigation],
  );

  const viewModel = useBaanxDashboardViewModel(
    accessToken ?? undefined,
    transactionId,
    navigateToAgent,
  );
  return <BaanxDashboardScreenView {...viewModel} />;
};
