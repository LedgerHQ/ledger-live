import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/react-ui";
import { setDrawer } from "~/renderer/drawers/Provider";
import PostOnboardingMockAction from "~/renderer/components/PostOnboardingHub/PostOnboardingMockAction";
import CustomImage from "~/renderer/screens/customImage";
import { getStoreValue } from "~/renderer/store";

const customImage: PostOnboardingAction = {
  id: PostOnboardingActionId.customImage,
  Icon: Icons.PictureImage,
  title: "customImage.postOnboarding.title",
  titleCompleted: "customImage.postOnboarding.title",
  description: "customImage.postOnboarding.description",
  actionCompletedPopupLabel: "customImage.postOnboarding.actionCompletedPopupLabel",
  startAction: ({ deviceModelId }) =>
    setDrawer(
      CustomImage,
      {
        isFromPostOnboardingEntryPoint: true,
        deviceModelId,
      },
      { forceDisableFocusTrap: true },
    ),
  buttonLabelForAnalyticsEvent: "Set lock screen picture",
};

const assetsTransfer: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransfer,
  featureFlagId: "postOnboardingAssetsTransfer",
  Icon: Icons.Lock,
  title: "postOnboarding.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.actions.assetsTransfer.description",
  actionCompletedPopupLabel: "postOnboarding.actions.assetsTransfer.popupLabel",
  buttonLabelForAnalyticsEvent: "Secure your assets on Ledger",
  startAction: ({ openModalCallback }) => openModalCallback("MODAL_RECEIVE"),
};

const buyCrypto: PostOnboardingAction = {
  id: PostOnboardingActionId.buyCrypto,
  Icon: Icons.Dollar,
  title: "postOnboarding.actions.buyCrypto.title",
  titleCompleted: "postOnboarding.actions.buyCrypto.titleCompleted",
  description: "postOnboarding.actions.buyCrypto.description",
  actionCompletedPopupLabel: "postOnboarding.actions.buyCrypto.popupLabel",
  buttonLabelForAnalyticsEvent: "Buy Crypto",
  shouldCompleteOnStart: true,
  startAction: ({ navigationCallback }) => navigationCallback({ pathname: "/exchange" }),
};

const recover: PostOnboardingAction = {
  id: PostOnboardingActionId.recover,
  Icon: Icons.ShieldCheck,
  title: "postOnboarding.actions.recover.title",
  titleCompleted: "postOnboarding.actions.recover.titleCompleted",
  description: "postOnboarding.actions.recover.description",
  actionCompletedPopupLabel: "postOnboarding.actions.recover.popupLabel",
  buttonLabelForAnalyticsEvent: "Subscribe to Recover",
  shouldCompleteOnStart: true,
  getIsAlreadyCompleted: async ({ protectId }) => {
    const recoverSubscriptionState = await getStoreValue("SUBSCRIPTION_STATE", protectId);

    return recoverSubscriptionState === "BACKUP_DONE";
  },
  startAction: ({ navigationCallback, protectId }) =>
    navigationCallback(`/recover/${protectId}?redirectTo=upsell&source=lld-post-onboarding-banner`),
};

const claimMock: PostOnboardingAction = {
  id: PostOnboardingActionId.claimMock,
  Icon: Icons.Gift,
  title: "Claim my NFT",
  titleCompleted: "Claim my NFT",
  description: "A special NFT for you.",
  tagLabel: "Free",
  actionCompletedPopupLabel: "NFT claimed",
  startAction: () => setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.claimMock }),
};

const personalizeMock: PostOnboardingAction = {
  id: PostOnboardingActionId.personalizeMock,
  Icon: Icons.PictureImage,
  title: `Personalize my ${getDeviceModel(DeviceModelId.stax).productName}`,
  titleCompleted: `Personalize my ${getDeviceModel(DeviceModelId.stax).productName}`,
  description: "By customizing the screen.",
  actionCompletedPopupLabel: "Device personalized",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.personalizeMock }),
};

const migrateAssetsMock: PostOnboardingAction = {
  id: PostOnboardingActionId.migrateAssetsMock,
  Icon: Icons.ArrowDown,
  title: "Transfer assets to my Ledger",
  titleCompleted: "Transfer assets to my Ledger",
  description: "Easily secure assets from coinbase or another exchange.",
  actionCompletedPopupLabel: "Assets transfered",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.migrateAssetsMock }),
};

const customImageMock: PostOnboardingAction = {
  id: PostOnboardingActionId.customImageMock,
  Icon: Icons.PictureImage,
  title: "customImage.postOnboarding.title",
  titleCompleted: "customImage.postOnboarding.title",
  description: "customImage.postOnboarding.description",
  actionCompletedPopupLabel: "customImage.postOnboarding.actionCompletedPopupLabel",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.customImageMock }),
};

const assetsTransferMock: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransferMock,
  featureFlagId: "postOnboardingAssetsTransfer",
  Icon: Icons.Lock,
  title: "postOnboarding.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.actions.assetsTransfer.description",
  actionCompletedPopupLabel: "postOnboarding.actions.assetsTransfer.popupLabel",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.assetsTransferMock }),
};

const buyCryptoMock: PostOnboardingAction = {
  id: PostOnboardingActionId.buyCryptoMock,
  Icon: Icons.Dollar,
  title: "postOnboarding.actions.buyCrypto.title",
  titleCompleted: "postOnboarding.actions.buyCrypto.titleCompleted",
  description: "postOnboarding.actions.buyCrypto.description",
  actionCompletedPopupLabel: "postOnboarding.actions.buyCrypto.popupLabel",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.buyCryptoMock }),
};

const recoverMock: PostOnboardingAction = {
  id: PostOnboardingActionId.recoverMock,
  Icon: Icons.ShieldCheck,
  title: "postOnboarding.actions.recover.title",
  titleCompleted: "postOnboarding.actions.recover.titleCompleted",
  description: "postOnboarding.actions.recover.description",
  actionCompletedPopupLabel: "postOnboarding.actions.recover.popupLabel",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.recoverMock }),
};

/**
 * All implemented post onboarding actions.
 */
const postOnboardingActions: { [id in PostOnboardingActionId]?: PostOnboardingAction } = {
  claimMock,
  personalizeMock,
  migrateAssetsMock,
  customImage,
  assetsTransfer,
  buyCrypto,
  recover,
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  recoverMock,
};

/**
 * Mock of post onboarding actions for DeviceModelId.stax
 */
const staxPostOnboardingActionsMock: PostOnboardingAction[] = [
  claimMock,
  personalizeMock,
  migrateAssetsMock,
];

/**
 * Mock of post onboarding actions for DeviceModelId.europa
 */
const europaPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  recoverMock,
];

export function getPostOnboardingAction(
  id: PostOnboardingActionId,
): PostOnboardingAction | undefined {
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
    case DeviceModelId.stax:
      if (mock) return staxPostOnboardingActionsMock;
      /**
       * Set here the list of actions for the post onboarding of the
       * DeviceModelId.stax
       * */
      return [assetsTransfer, buyCrypto, customImage, recover];
    case DeviceModelId.europa:
      if (mock) return europaPostOnboardingActionsMock;
      return [assetsTransfer, buyCrypto, customImage, recover];
    default:
      return [];
  }
}
