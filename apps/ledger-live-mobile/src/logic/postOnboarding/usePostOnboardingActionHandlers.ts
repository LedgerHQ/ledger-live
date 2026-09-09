import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { PostOnboardingActionId } from "@ledgerhq/types-live";

type ActionHandler = () => void;

type PostOnboardingActionHandlers = {
  [key in PostOnboardingActionId]?: ActionHandler;
};

export function usePostOnboardingActionHandlers(): PostOnboardingActionHandlers {
  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: "post-onboarding",
  });

  return {
    [PostOnboardingActionId.assetsTransfer]: () => {
      handleOpenReceiveDrawer();
    },
  };
}
