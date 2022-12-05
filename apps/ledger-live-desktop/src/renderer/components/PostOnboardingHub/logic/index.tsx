import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/react-ui";
import { setDrawer } from "~/renderer/drawers/Provider";
import PostOnboardingMockAction from "~/renderer/components/PostOnboardingHub/PostOnboardingMockAction";
import CustomImage from "~/renderer/screens/customImage";

const claimMock: PostOnboardingAction = {
  id: PostOnboardingActionId.claimMock,
  Icon: Icons.GiftCardMedium,
  title: "Claim my NFT",
  description: "A special NFT for you.",
  tagLabel: "Free",
  actionCompletedPopupLabel: "NFT claimed",
  actionCompletedHubTitle: "Kickstart your Web3 journey.",
  startAction: () => setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.claimMock }),
};

const personalizeMock: PostOnboardingAction = {
  id: PostOnboardingActionId.personalizeMock,
  Icon: Icons.BracketsMedium,
  featureFlagId: "customImage",
  title: `Personalize my ${getDeviceModel(DeviceModelId.nanoFTS).productName}`,
  description: "By customizing the screen.",
  actionCompletedPopupLabel: "Device personalized",
  actionCompletedHubTitle: "That screen is looking neat.",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.personalizeMock }),
};

const migrateAssetsMock: PostOnboardingAction = {
  id: PostOnboardingActionId.migrateAssetsMock,
  Icon: Icons.TransferMedium,
  title: "Transfer assets to my Ledger",
  description: "Easily secure assets from coinbase or another exchange.",
  actionCompletedPopupLabel: "Assets transfered",
  actionCompletedHubTitle: "Something about being a crypto pro.",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.migrateAssetsMock }),
};

const customImage: PostOnboardingAction = {
  id: PostOnboardingActionId.customImage,
  Icon: Icons.BracketsMedium,
  featureFlagId: "customImage",
  title: "customImage.postOnboarding.title",
  description: "customImage.postOnboarding.description",
  actionCompletedPopupLabel: "customImage.postOnboarding.actionCompletedPopupLabel",
  actionCompletedHubTitle: "customImage.postOnboarding.actionCompletedHubTitle",
  startAction: () => setDrawer(CustomImage, { isFromPostOnboardingEntryPoint: true }),
};

/**
 * All implemented post onboarding actions.
 */
const postOnboardingActions: Record<PostOnboardingActionId, PostOnboardingAction> = {
  claimMock,
  migrateAssetsMock,
  personalizeMock,
  customImage,
};

/**
 * Mock of post onboarding actions for DeviceModelId.nanoFTS
 */
const ftsPostOnboardingActionsMock: PostOnboardingAction[] = [
  claimMock,
  personalizeMock,
  migrateAssetsMock,
];

export function getPostOnboardingAction(id: PostOnboardingActionId): PostOnboardingAction {
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
      return [customImage];
    default:
      return [];
  }
}
