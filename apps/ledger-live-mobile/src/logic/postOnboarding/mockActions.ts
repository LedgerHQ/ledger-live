import {
  PostOnboardingAction,
  PostOnboardingActionId,
  StartActionArgs,
} from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";

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

export const syncAccountsMock: PostOnboardingAction = {
  id: PostOnboardingActionId.syncAccounts,
  Icon: Icons.Refresh,
  title: "postOnboarding.actions.syncAccounts.title",
  titleCompleted: "postOnboarding.actions.syncAccounts.titleCompleted",
  description: "postOnboarding.actions.syncAccounts.description",
  actionCompletedPopupLabel: "postOnboarding.actions.syncAccounts.popupLabel",
  getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => {
    return !!isLedgerSyncActive;
  },
  startAction: ({ openActivationDrawer }: StartActionArgs) => {
    openActivationDrawer?.();
  },
};
