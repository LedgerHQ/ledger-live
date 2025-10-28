import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { PostOnboardingActionId } from "@ledgerhq/types-live";

type ActionHandler = () => void;

type PostOnboardingActionHandlers = {
  [key in PostOnboardingActionId]?: ActionHandler;
};

export function usePostOnboardingActionHandlers(): PostOnboardingActionHandlers {
  const { handleOpenReceiveDrawer, isModularDrawerEnabled } = useOpenReceiveDrawer({
    sourceScreenName: "post-onboarding",
  });

  return {
    [PostOnboardingActionId.assetsTransfer]: isModularDrawerEnabled
      ? () => {
          handleOpenReceiveDrawer();
        }
      : undefined,
    // Add other custom handlers here as needed
    // [PostOnboardingActionId.buyCrypto]: () => { ... },
    // [PostOnboardingActionId.customImage]: () => { ... },
  };
}
