import { useCallback, useRef } from "react";
import useConversation from "~/screens/Messaging/hooks/useConversation";
import { useInitMemberCredentials } from "../../hooks/useInitMemberCredentials";
export const viewabilityConfig = {
  viewAreaCoveragePercentThreshold: 72,
};

function useConversationListViewModel() {
  const { getConversations } = useConversation();

  useInitMemberCredentials();
  const onEndReached = useCallback(() => {
    return true;
  }, []);

  const onViewableItemsChanged = () => {
    return null;
  };
  const viewabilityConfigCallbackPairs = useRef([{ onViewableItemsChanged, viewabilityConfig }]);

  return {
    search: null,
    loading: false,
    refresh: () => null,
    onEndReached: onEndReached,
    viewabilityConfigCallbackPairs,
    conversations: getConversations(),
  };
}

export default useConversationListViewModel;
