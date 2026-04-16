import React from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import AgentDetailScreenView from "./AgentDetailScreenView";
import { useAgentDetailViewModel } from "./useAgentDetailViewModel";

type AgentDetailRouteProp = RouteProp<BaseNavigatorStackParamList, typeof ScreenName.AgentDetail>;

export const AgentDetailScreen = () => {
  const route = useRoute<AgentDetailRouteProp>();
  const { agentId } = route.params;

  const viewModel = useAgentDetailViewModel(agentId);
  return <AgentDetailScreenView {...viewModel} />;
};
