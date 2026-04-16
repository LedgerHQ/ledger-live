import React from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import BaanxTransactionHistoryView from "./BaanxTransactionHistoryView";
import { useBaanxTransactionHistoryViewModel } from "./useBaanxTransactionHistoryViewModel";

type HistoryRouteProp = RouteProp<
  BaseNavigatorStackParamList,
  typeof ScreenName.BaanxTransactionHistory
>;

export const BaanxTransactionHistoryScreen = () => {
  const route = useRoute<HistoryRouteProp>();
  const { accessToken } = route.params;
  const viewModel = useBaanxTransactionHistoryViewModel(accessToken);
  return <BaanxTransactionHistoryView {...viewModel} />;
};
