import React, { PropsWithChildren } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  PostOnboardingAction,
  PostOnboardingActionId,
} from "@ledgerhq/types-live";

export type PostOnboardingDependencies = {
  /** function to navigate to the post onboarding hub */
  navigateToPostOnboardingHub: (resetNavigationStack?: boolean) => void;
  /**
   * function that returns a `PostOnboardingAction` for the given
   * `PostOnboardingActionId` parameter.
   * */
  getPostOnboardingAction?: (
    id: PostOnboardingActionId
  ) => PostOnboardingAction | undefined;
  /**
   * function that returns an array of `PostOnboardingAction` for the given
   * `DeviceModelId` parameter.
   */
  getPostOnboardingActionsForDevice: (
    id: DeviceModelId,
    mock?: boolean
  ) => PostOnboardingAction[];
};

const defaultValue: PostOnboardingDependencies = {
  navigateToPostOnboardingHub: () => {},
  getPostOnboardingAction: undefined,
  getPostOnboardingActionsForDevice: () => [],
};

export const PostOnboardingContext = React.createContext(defaultValue);

export const PostOnboardingProvider: React.FC<
  PropsWithChildren<PostOnboardingDependencies>
> = ({ children, ...props }) => {
  if (!props.getPostOnboardingAction) {
    console.warn(
      "`getPostOnboardingAction` prop is undefined in the current PostOnboardingProvider. Without this, the post onboarding is not able to function normally."
    );
  }
  return (
    <PostOnboardingContext.Provider value={props}>
      {children}
    </PostOnboardingContext.Provider>
  );
};
