import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  AGENT_INTENT_SOURCE,
  trackManageAgentsClick,
  useAgentIntentEntryPoints,
} from "@features/flow-agent-intent-entry-points";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { MY_WALLET_TRACKING_PAGE_NAME } from "../../constants";

type ManageAgentsButtonViewModel = Readonly<{
  isEnabled: boolean;
  openAgentIntent: () => void;
}>;

export function useManageAgentsButtonViewModel(): ManageAgentsButtonViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { isProfileEnabled } = useAgentIntentEntryPoints();

  const openAgentIntent = useCallback(() => {
    trackManageAgentsClick(MY_WALLET_TRACKING_PAGE_NAME);
    navigation.navigate(NavigatorName.AgentIntent, {
      screen: ScreenName.AgentIntent,
      params: { source: AGENT_INTENT_SOURCE.profile },
    });
  }, [navigation]);

  return { isEnabled: isProfileEnabled, openAgentIntent };
}
