import { DeviceModelId } from "@ledgerhq/types-devices";
import { FeatureId } from ".";

/**
 * Unique identifier of a post onboarding action.
 */
export enum PostOnboardingActionId {
  claimMock = "claimMock",
  migrateAssetsMock = "migrateAssetsMock",
  personalizeMock = "personalizeMock",
  customImage = "customImage",
  claimNft = "claimNft",
  assetsTransfer = "assetsTransfer",
}

export type WithNavigationParams = {
  /**
   * Navigation params when the user presses the button for this action
   * - In LLM, this will be used like this:
   *  `navigation.navigate(...navigationParams)`
   * - In LLD, this will be used like this:
   *  `history.push(...navigationParams)`
   */
  navigationParams?: any[];
};

type WithStartActionFunction = {
  /**
   * The function to call when the user presses the button for this action
   */
  startAction: () => void;
};

/**
 * All necessary information for complete integration of a post onboarding
 * action.
 */
export type PostOnboardingAction = {
  id: PostOnboardingActionId;

  /**
   * Allow to display the action without letting the user access its flow
   */
  disabled?: boolean;

  /**
   * If this action is linked to a feature that is enabled by a feature flag,
   * use this property to identify the feature flag.
   */
  featureFlagId?: FeatureId;

  /**
   * Icon displayed for this action in the post onboarding hub.
   */
  Icon: (props: { size: number; color: string }) => any;

  /**
   * Title displayed for this action in the post onboarding hub.
   */
  title: string;

  /**
   * Title displayed for this action in the post onboarding hub when the action
   * is completed.
   */
  titleCompleted: string;

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
   * Value to use in the "button" property of the event sent when the user
   * triggers the action by pressing the button in the post onboarding hub.
   */
  buttonLabelForAnalyticsEvent?: string;
} & (WithNavigationParams | WithStartActionFunction);

/**
 * State of a post onboarding action.
 */
export type PostOnboardingActionState = {
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
   * Did the user dismiss the post onboarding entry point on the wallet page.
   */
  walletEntryPointDismissed: boolean;

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
  actionsState: (PostOnboardingAction & PostOnboardingActionState)[];
};
