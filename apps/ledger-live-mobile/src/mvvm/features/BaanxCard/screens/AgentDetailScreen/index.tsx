import React from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";
import type { BaanxCardNavigatorParamList } from "../../types";
import AgentDetailScreenView from "./AgentDetailScreenView";
import { useAgentDetailViewModel } from "./useAgentDetailViewModel";

type AgentDetailRouteProp = RouteProp<BaanxCardNavigatorParamList, typeof ScreenName.AgentDetail>;

export const AgentDetailScreen = () => {
  const route = useRoute<AgentDetailRouteProp>();
  const { agentId } = route.params;

  const viewModel = useAgentDetailViewModel(agentId);
  return <AgentDetailScreenView {...viewModel} />;
};
