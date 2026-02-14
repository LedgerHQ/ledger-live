import React from "react";
import { PostOnboardingProvider } from "@ledgerhq/live-common/postOnboarding/PostOnboardingProvider";
import { getPostOnboardingAction, getPostOnboardingActionsForDevice } from ".";
import { useNavigateToPostOnboardingHubCallback } from "./useNavigateToPostOnboardingHubCallback";

type Props = {
  children?: React.ReactNode | undefined;
};

const PostOnboardingProviderWrapped: React.FC<Props> = ({ children }) => {
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  return (
    <PostOnboardingProvider
      navigateToPostOnboardingHub={navigateToPostOnboardingHub}
      getPostOnboardingAction={getPostOnboardingAction}
      getPostOnboardingActionsForDevice={getPostOnboardingActionsForDevice}
    >
      {children}
    </PostOnboardingProvider>
  );
};

export default PostOnboardingProviderWrapped;
