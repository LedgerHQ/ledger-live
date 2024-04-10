import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";

export const claimMock: PostOnboardingAction = {
  id: PostOnboardingActionId.claimMock,
  Icon: Icons.Gift,
  title: "Claim my NFT",
  titleCompleted: "NFT Claimed",
  description: "A special NFT for you.",
  tagLabel: "Free",
  actionCompletedPopupLabel: "NFT claimed",
  getNavigationParams: () => [
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
  Icon: Icons.PictureImage,
  title: `Personalize my ${getDeviceModel(DeviceModelId.stax).productName}`,
  titleCompleted: `Device personalized`,
  description: "By customizing the screen.",
  actionCompletedPopupLabel: "Device personalized",
  getNavigationParams: () => [
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
  Icon: Icons.ArrowDown,
  title: "Transfer assets to my Ledger",
  titleCompleted: "Assets transfered",
  description: "Easily secure assets from coinbase or another exchange.",
  actionCompletedPopupLabel: "Assets transfered",
  getNavigationParams: () => [
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

export const assetsTransferMock: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransferMock,
  disabled: false,
  featureFlagId: "postOnboardingAssetsTransfer",
  Icon: Icons.Lock,
  title: "postOnboarding.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.actions.assetsTransfer.description",
  actionCompletedPopupLabel: "postOnboarding.actions.assetsTransfer.popupLabel",
  getNavigationParams: () => [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.assetsTransferMock,
        title: PostOnboardingActionId.assetsTransferMock,
      },
    },
  ],
};

export const buyCryptoMock: PostOnboardingAction = {
  id: PostOnboardingActionId.buyCryptoMock,
  disabled: false,
  Icon: Icons.Dollar,
  title: "postOnboarding.actions.buyCrypto.title",
  titleCompleted: "postOnboarding.actions.buyCrypto.titleCompleted",
  description: "postOnboarding.actions.buyCrypto.description",
  actionCompletedPopupLabel: "postOnboarding.actions.buyCrypto.popupLabel",
  getNavigationParams: () => [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.buyCryptoMock,
        title: PostOnboardingActionId.buyCryptoMock,
      },
    },
  ],
};

export const customImageMock: PostOnboardingAction = {
  id: PostOnboardingActionId.customImageMock,
  Icon: Icons.PictureImage,
  title: "postOnboarding.actions.customImage.title",
  titleCompleted: "postOnboarding.actions.customImage.titleCompleted",
  description: "postOnboarding.actions.customImage.description",
  actionCompletedPopupLabel: "postOnboarding.actions.customImage.popupLabel",
  getNavigationParams: () => [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.customImageMock,
        title: PostOnboardingActionId.customImageMock,
      },
    },
  ],
};

export const recoverMock: PostOnboardingAction = {
  id: PostOnboardingActionId.recoverMock,
  Icon: Icons.ShieldCheck,
  title: "postOnboarding.actions.recover.title",
  titleCompleted: "postOnboarding.actions.recover.titleCompleted",
  description: "postOnboarding.actions.recover.description",
  actionCompletedPopupLabel: "postOnboarding.actions.recover.popupLabel",
  getNavigationParams: () => [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.recoverMock,
        title: PostOnboardingActionId.recoverMock,
      },
    },
  ],
};
