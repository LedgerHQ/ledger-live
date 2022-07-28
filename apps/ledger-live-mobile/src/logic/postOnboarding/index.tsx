import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import { Icons } from "@ledgerhq/native-ui";
import { PostOnboardingAction, PostOnboardingActionId } from "./types";

const claim: PostOnboardingAction = {
  id: "claim",
  icon: Icons.BracketsMedium,
  title: "Lorem ipsum",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut sollicitudin turpis ac porttitor consectetur. Nunc bibendum sapien a purus dapibus, sit amet pellentesque ipsum vulputate.",
  tagLabel: "Ipsum",
  actionCompletedPopupLabel: "Claim completed popup label",
  actionCompletedHubTitle: "Claim completed hub title",
};

const personalize: PostOnboardingAction = {
  id: "personalize",
  icon: Icons.BracketsMedium,
  featureFlagId: "customImage",
  title: "Lorem ipsum",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut sollicitudin turpis ac porttitor consectetur.",
  tagLabel: "Ipsum",
  actionCompletedPopupLabel: "Personalize completed popup label",
  actionCompletedHubTitle: "Personalize completeted hub title",
};

const migrateAssets: PostOnboardingAction = {
  id: "migrateAssets",
  featureFlagId: "customImage",
  icon: Icons.TransferMedium,
  title: "Lorem ipsum",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut sollicitudin turpis ac porttitor consectetur.",
  tagLabel: "Ipsum",
  actionCompletedPopupLabel: "Migrated",
  actionCompletedHubTitle: "Migrated hub title",
};

export const postOnboardingActions: {
  [key in PostOnboardingActionId]: PostOnboardingAction;
} = {
  claim,
  migrateAssets,
  personalize,
};

const basePostOnboardingActions: PostOnboardingAction[] = [
  claim,
  migrateAssets,
];

const ftsPostOnboardingActions: PostOnboardingAction[] = [
  ...basePostOnboardingActions,
  personalize,
];

export function getPostOnboardingActionsForDevice(
  deviceId: DeviceModelId,
): PostOnboardingAction[] {
  if (deviceId === DeviceModelId.nanoFTS) return ftsPostOnboardingActions;
  return []; // later on we can enable a post onboarding for other devices.
}
