import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices/lib/index";
import {
  PostOnboardingAction,
  PostOnboardingActionId,
} from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";

const claimMock: PostOnboardingAction = {
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

const personalizeMock: PostOnboardingAction = {
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

const migrateAssetsMock: PostOnboardingAction = {
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

/**
 * All implemented post onboarding actions.
 */
const postOnboardingActions: Record<
  PostOnboardingActionId,
  PostOnboardingAction
> = {
  claimMock,
  migrateAssetsMock,
  personalizeMock,
};

/**
 * Mock of post onboarding actions for DeviceModelId.nanoFTS
 */
const ftsPostOnboardingActionsMock: PostOnboardingAction[] = [
  claimMock,
  personalizeMock,
  migrateAssetsMock,
];

export function getPostOnboardingAction(
  id: PostOnboardingActionId,
): PostOnboardingAction {
  return postOnboardingActions[id];
}

/**
 * Returns the list of post onboarding actions for a given device.
 * TODO: keep this updated as we implement feature that we want to add in the
 * post onboarding.
 */
export function getPostOnboardingActionsForDevice(
  deviceModelId: DeviceModelId,
  mock = false,
): PostOnboardingAction[] {
  switch (deviceModelId) {
    case DeviceModelId.nanoS:
      /** Set here the list of actions for the post onboarding of the Nano S */
      return [];
    case DeviceModelId.nanoSP:
      /** Set here the list of actions for the post onboarding of the Nano SP */
      return [];
    case DeviceModelId.nanoX:
      /** Set here the list of actions for the post onboarding of the Nano X */
      return [];
    case DeviceModelId.nanoFTS:
      if (mock) return ftsPostOnboardingActionsMock;
      /**
       * Set here the list of actions for the post onboarding of the
       * DeviceModelId.nanoFTS
       * */
      return [];
    default:
      return [];
  }
}
