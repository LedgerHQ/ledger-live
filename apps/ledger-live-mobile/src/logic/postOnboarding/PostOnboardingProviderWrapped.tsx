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
      {/* @ts-expect-error REACT19FIXME: ReactNode type from React 18 is not compatible with ReactNode from React 19 */}
      {children}
    </PostOnboardingProvider>
  );
};

export default PostOnboardingProviderWrapped;
