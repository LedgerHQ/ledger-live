import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import {
  PostOnboardingAction,
  PostOnboardingActionId,
} from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";

export const claimMock: PostOnboardingAction = {
  id: PostOnboardingActionId.claimMock,
  Icon: Icons.GiftCardMedium,
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
        id: PostOnboardingActionId.claimMock,
        title: PostOnboardingActionId.claimMock,
      },
    },
  ],
};

export const personalizeMock: PostOnboardingAction = {
  id: PostOnboardingActionId.personalizeMock,
  Icon: Icons.BracketsMedium,
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
        id: PostOnboardingActionId.personalizeMock,
        title: PostOnboardingActionId.personalizeMock,
      },
    },
  ],
};

export const migrateAssetsMock: PostOnboardingAction = {
  id: PostOnboardingActionId.migrateAssetsMock,
  Icon: Icons.TransferMedium,
  title: "Transfer assets to my Ledger",
  description: "Easily secure assets from coinbase or another exchange.",
  actionCompletedPopupLabel: "Assets transfered",
  actionCompletedHubTitle: "Something about being a crypto pro.",
  navigationParams: [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.migrateAssetsMock,
        title: PostOnboardingActionId.migrateAssetsMock,
      },
    },
  ],
};
