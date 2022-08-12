import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices/lib/index";
import {
  PostOnboardingAction,
  PostOnboardingActionId,
} from "@ledgerhq/live-common/lib/postOnboarding/types";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";

const claimMock: PostOnboardingAction = {
  id: PostOnboardingActionId.claim,
  icon: Icons.GiftCardMedium,
  title: "Claim my NFT",
  description: "A special NFT for you.",
  tagLabel: "Free",
  actionCompletedPopupLabel: "NFT claimed",
  actionCompletedHubTitle: "Kickstart your Web3 journey.",
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
  title: `Personalize my ${getDeviceModel(DeviceModelId.nanoFTS).productName}`,
  description: "By customizing the screen.",
  actionCompletedPopupLabel: "Device personalized",
  actionCompletedHubTitle: "That screen is looking neat.",
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
  title: "Transfer assets to my Ledger",
  description: "Easily secure assets from coinbase or another exchange.",
  actionCompletedPopupLabel: "Assets transfered",
  actionCompletedHubTitle: "Something about being a crypto pro.",
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
