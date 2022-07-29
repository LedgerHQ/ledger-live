import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";
import { PostOnboardingAction, PostOnboardingActionId } from "./types";

const claim: PostOnboardingAction = {
  id: PostOnboardingActionId.claim,
  icon: Icons.BracketsMedium,
  title: "Claim lorem ipsum",
  description:
    "Claim lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut sollicitudin turpis ac porttitor consectetur. Nunc bibendum sapien a purus dapibus, sit amet pellentesque ipsum vulputate.",
  tagLabel: "Ipsum",
  actionCompletedPopupLabel: "Claimed",
  actionCompletedHubTitle: "Claimed completed hub title",
  navigationParams: [
    NavigatorName.Base,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.claim,
        title: PostOnboardingActionId.claim,
      },
    },
  ],
};

const personalize: PostOnboardingAction = {
  id: PostOnboardingActionId.personalize,
  icon: Icons.BracketsMedium,
  featureFlagId: "customImage",
  title: "Lorem ipsum",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut sollicitudin turpis ac porttitor consectetur.",
  tagLabel: "Ipsum",
  actionCompletedPopupLabel: "Personalized",
  actionCompletedHubTitle: "Personalize completeted hub title",
  navigationParams: [
    NavigatorName.Base,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.personalize,
        title: PostOnboardingActionId.personalize,
      },
    },
  ],
};

const migrateAssets: PostOnboardingAction = {
  id: PostOnboardingActionId.migrateAssets,
  featureFlagId: "customImage",
  icon: Icons.TransferMedium,
  title: "Migrate lorem ipsum",
  description:
    "Migrate lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut sollicitudin turpis ac porttitor consectetur.",
  actionCompletedPopupLabel: "Migrated",
  actionCompletedHubTitle: "Migrated hub title",
  navigationParams: [
    NavigatorName.Base,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.migrateAssets,
        title: PostOnboardingActionId.migrateAssets,
      },
    },
  ],
};

export const postOnboardingActions: {
  [key in PostOnboardingActionId]: PostOnboardingAction;
} = {
  claim,
  migrateAssets,
  personalize,
};

const ftsPostOnboardingActions: PostOnboardingAction[] = [
  claim,
  personalize,
  migrateAssets,
];

export function getPostOnboardingActionsForDevice(
  deviceId: DeviceModelId,
): PostOnboardingAction[] {
  if (deviceId === DeviceModelId.nanoFTS) return ftsPostOnboardingActions;
  return []; // later on we can enable a post onboarding for other devices.
}
