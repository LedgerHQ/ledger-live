import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import {
  PostOnboardingAction,
  PostOnboardingActionId,
  StartActionArgs,
} from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/react-ui";
import { setDrawer } from "~/renderer/drawers/Provider";
import PostOnboardingMockAction from "~/renderer/components/PostOnboardingHub/PostOnboardingMockAction";
import CustomImage from "~/renderer/screens/customImage";

const assetsTransfer: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransfer,
  featureFlagId: "postOnboardingAssetsTransfer",
  Icon: Icons.Lock,
  title: "postOnboarding.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.actions.assetsTransfer.description",
  actionCompletedPopupLabel: "postOnboarding.actions.assetsTransfer.popupLabel",
  buttonLabelForAnalyticsEvent: "Secure your assets on Ledger",
  startAction: ({ openModalCallback }: StartActionArgs) => openModalCallback?.("MODAL_RECEIVE"),
  getIsAlreadyCompletedByState: ({ accounts }) =>
    !!accounts && accounts.some(account => account?.balance.isGreaterThan(0)),
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
  startAction: ({ navigationCallback }: StartActionArgs) =>
    navigationCallback?.({ pathname: "/exchange" }),
};

const syncAccounts: PostOnboardingAction = {
  id: PostOnboardingActionId.syncAccounts,
  featureFlagId: "lldLedgerSyncEntryPoints",
  featureFlagParamId: "postOnboarding",
  Icon: Icons.Refresh,
  title: "postOnboarding.actions.syncAccounts.title",
  titleCompleted: "postOnboarding.actions.syncAccounts.titleCompleted",
  description: "postOnboarding.actions.syncAccounts.description",
  actionCompletedPopupLabel: "postOnboarding.actions.syncAccounts.popupLabel",
  buttonLabelForAnalyticsEvent: "Sync accounts",
  startAction: ({ openActivationDrawer }: StartActionArgs) => {
    openActivationDrawer?.();
  },
  getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => !!isLedgerSyncActive,
};

const customImage: PostOnboardingAction = {
  id: PostOnboardingActionId.customImage,
  Icon: Icons.PictureImage,
  title: "customImage.postOnboarding.title",
  titleCompleted: "customImage.postOnboarding.title",
  description: "customImage.postOnboarding.description",
  actionCompletedPopupLabel: "customImage.postOnboarding.actionCompletedPopupLabel",
  startAction: ({ deviceModelId }: StartActionArgs) =>
    setDrawer(
      CustomImage,
      {
        isFromPostOnboardingEntryPoint: true,
        deviceModelId: deviceModelId || null,
      },
      { forceDisableFocusTrap: true },
    ),
  buttonLabelForAnalyticsEvent: "Set lock screen picture",
};

const claimMock: PostOnboardingAction = {
  id: PostOnboardingActionId.claimMock,
  Icon: Icons.Gift,
  title: "Claim my NFT",
  titleCompleted: "Claim my NFT",
  description: "A special NFT for you.",
  tagLabel: "Free",
  actionCompletedPopupLabel: "NFT claimed",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.claimMock }),
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

/**
 * All implemented post onboarding actions.
 */
const postOnboardingActions: { [id in PostOnboardingActionId]?: PostOnboardingAction } = {
  assetsTransfer,
  buyCrypto,
  syncAccounts,
  customImage,
  // Mocks for desktop development and tests
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  claimMock,
  personalizeMock,
  migrateAssetsMock,
};

const staxPostOnboardingActionsMock: PostOnboardingAction[] = [
  claimMock,
  personalizeMock,
  migrateAssetsMock,
  syncAccounts,
];

const europaPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
];

const apexPostOnboardingActionsMock: PostOnboardingAction[] = [customImageMock];

export function getPostOnboardingAction(
  id: PostOnboardingActionId,
): PostOnboardingAction | undefined {
  return postOnboardingActions[id];
}

export function getPostOnboardingActionsForDevice(
  deviceModelId: DeviceModelId,
  mock = false,
): PostOnboardingAction[] {
  switch (deviceModelId) {
    case DeviceModelId.stax:
      if (mock) return staxPostOnboardingActionsMock;
      return [assetsTransfer, buyCrypto, syncAccounts, customImage];
    case DeviceModelId.europa:
      if (mock) return europaPostOnboardingActionsMock;
      return [assetsTransfer, buyCrypto, syncAccounts, customImage];
    case DeviceModelId.apex:
      if (mock) return apexPostOnboardingActionsMock;
      return [assetsTransfer, buyCrypto, syncAccounts, customImage];
    case DeviceModelId.nanoS:
      // Post-onboarding actions for Nano S (no custom lock screen step).
      return [assetsTransfer, buyCrypto, syncAccounts];
    case DeviceModelId.nanoSP:
      // Post-onboarding actions for Nano S Plus (no custom lock screen step).
      return [assetsTransfer, buyCrypto, syncAccounts];
    case DeviceModelId.nanoX:
      // Post-onboarding actions for Nano X (no custom lock screen step).
      return [assetsTransfer, buyCrypto, syncAccounts];
    default:
      return [];
  }
}
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import {
  PostOnboardingAction,
  PostOnboardingActionId,
  StartActionArgs,
} from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/react-ui";
import { setDrawer } from "~/renderer/drawers/Provider";
import PostOnboardingMockAction from "~/renderer/components/PostOnboardingHub/PostOnboardingMockAction";
import CustomImage from "~/renderer/screens/customImage";

const assetsTransfer: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransfer,
  featureFlagId: "postOnboardingAssetsTransfer",
  Icon: Icons.Lock,
  title: "postOnboarding.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.actions.assetsTransfer.description",
  actionCompletedPopupLabel: "postOnboarding.actions.assetsTransfer.popupLabel",
  buttonLabelForAnalyticsEvent: "Secure your assets on Ledger",
  startAction: ({ openModalCallback }: StartActionArgs) => openModalCallback?.("MODAL_RECEIVE"),
  getIsAlreadyCompletedByState: ({ accounts }) => {
    return !!accounts && accounts.some(account => account?.balance.isGreaterThan(0));
  },
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
  startAction: ({ navigationCallback }: StartActionArgs) =>
    navigationCallback?.({ pathname: "/exchange" }),
};

const syncAccounts: PostOnboardingAction = {
  id: PostOnboardingActionId.syncAccounts,
  featureFlagId: "lldLedgerSyncEntryPoints",
  featureFlagParamId: "postOnboarding",
  Icon: Icons.Refresh,
  title: "postOnboarding.actions.syncAccounts.title",
  titleCompleted: "postOnboarding.actions.syncAccounts.titleCompleted",
  description: "postOnboarding.actions.syncAccounts.description",
  actionCompletedPopupLabel: "postOnboarding.actions.syncAccounts.popupLabel",
  buttonLabelForAnalyticsEvent: "Sync accounts",
  startAction: ({ openActivationDrawer }: StartActionArgs) => {
    openActivationDrawer?.();
  },
  getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => {
    return !!isLedgerSyncActive;
  },
};

const customImage: PostOnboardingAction = {
  id: PostOnboardingActionId.customImage,
  Icon: Icons.PictureImage,
  title: "customImage.postOnboarding.title",
  titleCompleted: "customImage.postOnboarding.title",
  description: "customImage.postOnboarding.description",
  actionCompletedPopupLabel: "customImage.postOnboarding.actionCompletedPopupLabel",
  startAction: ({ deviceModelId }: StartActionArgs) =>
    setDrawer(
      CustomImage,
      {
        isFromPostOnboardingEntryPoint: true,
        deviceModelId: deviceModelId || null,
      },
      { forceDisableFocusTrap: true },
    ),
  buttonLabelForAnalyticsEvent: "Set lock screen picture",
};

const claimMock: PostOnboardingAction = {
  id: PostOnboardingActionId.claimMock,
  Icon: Icons.Gift,
  title: "Claim my NFT",
  titleCompleted: "Claim my NFT",
  description: "A special NFT for you.",
  tagLabel: "Free",
  actionCompletedPopupLabel: "NFT claimed",
  startAction: () =>
    setDrawer(PostOnboardingMockAction, { id: PostOnboardingActionId.claimMock }),
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

/**
 * All implemented post onboarding actions.
 */
const postOnboardingActions: { [id in PostOnboardingActionId]?: PostOnboardingAction } = {
  assetsTransfer,
  buyCrypto,
  syncAccounts,
  customImage,
  // Mocks for desktop development and tests
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  claimMock,
  personalizeMock,
  migrateAssetsMock,
};

const staxPostOnboardingActionsMock: PostOnboardingAction[] = [
  claimMock,
  personalizeMock,
  migrateAssetsMock,
  syncAccounts,
];

const europaPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
];

const apexPostOnboardingActionsMock: PostOnboardingAction[] = [customImageMock];

export function getPostOnboardingAction(
  id: PostOnboardingActionId,
): PostOnboardingAction | undefined {
  return postOnboardingActions[id];
}

export function getPostOnboardingActionsForDevice(
  deviceModelId: DeviceModelId,
  mock = false,
): PostOnboardingAction[] {
  switch (deviceModelId) {
    case DeviceModelId.stax:
      if (mock) return staxPostOnboardingActionsMock;
      return [assetsTransfer, buyCrypto, syncAccounts, customImage];
    case DeviceModelId.europa:
      if (mock) return europaPostOnboardingActionsMock;
      return [assetsTransfer, buyCrypto, syncAccounts, customImage];
    case DeviceModelId.apex:
      if (mock) return apexPostOnboardingActionsMock;
      return [assetsTransfer, buyCrypto, syncAccounts, customImage];
    case DeviceModelId.nanoS:
      // Post-onboarding actions for Nano S (no custom lock screen step).
      return [assetsTransfer, buyCrypto, syncAccounts];
    case DeviceModelId.nanoSP:
      // Post-onboarding actions for Nano S Plus (no custom lock screen step).
      return [assetsTransfer, buyCrypto, syncAccounts];
    case DeviceModelId.nanoX:
      // Post-onboarding actions for Nano X (no custom lock screen step).
      return [assetsTransfer, buyCrypto, syncAccounts];
    default:
      return [];
  }
}

