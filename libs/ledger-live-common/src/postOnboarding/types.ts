import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import { FeatureId } from "@ledgerhq/types-live";

export enum PostOnboardingActionId {
  claim = "claim",
  migrateAssets = "migrateAssets",
  personalize = "personalize",
}

export type PostOnboardingAction = {
  id: PostOnboardingActionId;

  /**
   * If this action is linked to a feature that is enabled by a feature flag,
   * use this property to identify the feature flag.
   */
  featureFlagId?: FeatureId;

  /**
   * Navigation params when the user presses the button for this action
   * - In LLM, this will be used like this:
   *  `navigation.navigate(...navigationParams)`
   * - In LLD, this will be used like this:
   *  `history.push(...navigationParams)`
   */
  navigationParams?: any[];

  /**
   * Icon displayed for this action in the post onboarding hub.
   */
  icon: React.ComponentType<{ size: number; color: string }>;

  /**
   * Title displayed for this action in the post onboarding hub.
   */
  title: string;

  /**
   * Description displayed for this action in the post onboarding hub.
   */
  description: string;

  /**
   * Tag displayed for this action in the post onboarding hub.
   */
  tagLabel?: string;

  /**
   * Will appear in an success alert at the bottom of the post-onboarding hub
   * after completing this action.
   * */
  actionCompletedPopupLabel: string;

  /**
   * Will be used as a title success alert at the bottom of the post-onboarding
   * hub after completing this action.
   * */
  actionCompletedHubTitle: string;

  /**
   * Event that will be dispatched when starting this action.
   */
  onStartEvent?: string;

  /**
   * Event properties that will be dispatched when starting this action.
   */
  onStartEventProperties?: any;
};

export type ActionState = {
  /**
   * Whether the user has completed this action. This will be reflected in the
   * UI of the post onboarding hub.
   */
  completed: boolean;
};

/**
 * To be used for a redux reducer.
 * Keeps all necessary information about the state of the post onboarding hub
 * and can be persisted in storage.
 */
export type PostOnboardingState = {
  /**
   * Model Id of the device for which the post onboarding was started.
   */
  deviceModelId: DeviceModelId | null;

  /**
   * Is there an entry point for the post onboarding hub in the wallet screen.
   */
  walletEntryPointVisible: boolean;

  /**
   * List of all actions that have to be completed in this post onboarding
   * (whether they are completed or).
   * This is used to populate the list of actions in the post onboarding hub UI.
   */
  actionsToComplete: PostOnboardingActionId[];

  /**
   * "completed" state for each action.
   */
  actionsCompleted: { [key in PostOnboardingActionId]?: boolean };

  /**
   * Last action that the user has completed.
   *
   * This is used to display potentially different content in the post
   * onboarding hub UI depending on the last action that was completed.
   */
  lastActionCompleted: PostOnboardingActionId | null;
};

/**
 * Digest of the store & list of actions into something directly consumable
 * by UI. (All UI data will be in there).
 */
export type PostOnboardingHubState = {
  deviceModelId: DeviceModelId | null;
  lastActionCompleted: PostOnboardingAction | null;
  actionsState: (PostOnboardingAction & ActionState)[];
};
