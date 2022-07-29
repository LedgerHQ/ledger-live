import React from "react";
import { FeatureId } from "@ledgerhq/live-common/lib/types/index";
import { DeviceModelId } from "@ledgerhq/devices/lib/index";

export enum PostOnboardingActionId {
  claim = "claim",
  migrateAssets = "migrateAssets",
  personalize = "personalize",
}

export type PostOnboardingAction = {
  id: PostOnboardingActionId;
  featureFlagId?: FeatureId;
  navigationParams?: any[]; // where to navigate when the user presses the button for this action
  onPress?: (...paramsToDefine: any[]) => any;
  icon: React.ComponentType<{ size: number; color: string }>; // this TS needs to be more accurate but you get the idea
  title: string;
  description: string;
  tagLabel?: string;
  actionCompletedPopupLabel: string; // string that will appear in an success alert at the bottom of the post-onboarding hub after completing this action
  actionCompletedHubTitle: string; // string that will be used as a title success alert at the bottom of the post-onboarding hub after completing this action
  onStartEvent?: string; // not sure about this
  onStartEventProperties?: any; // not sure about this
  onDoneEvent?: string; // not sure about this
  onDoneEventProperties?: any; // not sure about this
};

export type ActionState = {
  completed: boolean;
};

export type PostOnboardingState = {
  deviceModelId: DeviceModelId | null;
  walletEntryPointVisible: boolean;
  actionsToComplete: PostOnboardingActionId[];
  actionsCompleted: { [key in PostOnboardingActionId]?: boolean };
  lastActionCompleted: PostOnboardingActionId | null; // optional (not sure): this will be used to set a custom title to the post onboarding hub screen
  hubSeenSinceLastActionCompleted: boolean; // TODO: handle this in reducers & hooks
};
