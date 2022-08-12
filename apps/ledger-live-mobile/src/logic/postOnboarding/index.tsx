import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import {
  PostOnboardingAction,
  PostOnboardingActionId,
} from "@ledgerhq/live-common/lib/postOnboarding/types";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";

const claimMock: PostOnboardingAction = {
  id: PostOnboardingActionId.claim,
  icon: Icons.GiftCardMedium,
  title: "Claim lorem ipsum",
  description: "Claim lorem ipsum dolor sit amet.",
  tagLabel: "Free",
  actionCompletedPopupLabel: "Claimed",
  actionCompletedHubTitle: "Claimed completed hub title",
  navigationParams: [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.claim,
        title: PostOnboardingActionId.claim,
      },
    },
  ],
};

const personalizeMock: PostOnboardingAction = {
  id: PostOnboardingActionId.personalize,
  icon: Icons.BracketsMedium,
  featureFlagId: "customImage",
  title: "Personalize lorem ipsum",
  description:
    "Personalize lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  actionCompletedPopupLabel: "Personalized",
  actionCompletedHubTitle: "Personalize completeted hub title",
  navigationParams: [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.personalize,
        title: PostOnboardingActionId.personalize,
      },
    },
  ],
};

const migrateAssetsMock: PostOnboardingAction = {
  id: PostOnboardingActionId.migrateAssets,
  featureFlagId: "customImage",
  icon: Icons.TransferMedium,
  title: "Migrate lorem ipsum",
  description:
    "Migrate lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  actionCompletedPopupLabel: "Migrated",
  actionCompletedHubTitle: "Migrated hub title",
  navigationParams: [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.migrateAssets,
        title: PostOnboardingActionId.migrateAssets,
      },
    },
  ],
};

export const postOnboardingActions: Record<
  PostOnboardingActionId,
  PostOnboardingAction
> = {
  claim: claimMock,
  migrateAssets: migrateAssetsMock,
  personalize: personalizeMock,
};

const ftsPostOnboardingActions: PostOnboardingAction[] = [
  claimMock,
  personalizeMock,
  migrateAssetsMock,
];

export function getPostOnboardingActionsForDevice(
  deviceId: DeviceModelId,
  mock = false,
): PostOnboardingAction[] {
  switch (deviceId) {
    case DeviceModelId.nanoFTS:
      if (mock) return ftsPostOnboardingActions;
      return [];
    default:
      return [];
  }
}
