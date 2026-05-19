import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";

export const assetsTransferMock: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransferMock,
  disabled: false,
  Icon: Icons.Lock,
  title: "postOnboarding.drawer.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.drawer.actions.assetsTransfer.description",
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
  getIsAlreadyCompletedByState: ({ accounts }) => {
    return !!accounts && accounts.some(account => account?.balance.isGreaterThan(0));
  },
};

export const customImageMock: PostOnboardingAction = {
  id: PostOnboardingActionId.customImageMock,
  Icon: Icons.PictureImage,
  title: "postOnboarding.drawer.actions.customImage.title",
  titleCompleted: "postOnboarding.actions.customImage.titleCompleted",
  description: "postOnboarding.drawer.actions.customImage.description",
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
  id: PostOnboardingActionId.syncAccountsMock,
  Icon: Icons.Refresh,
  title: "postOnboarding.drawer.actions.syncAccounts.title",
  titleCompleted: "postOnboarding.actions.syncAccounts.titleCompleted",
  description: "postOnboarding.drawer.actions.syncAccounts.description",
  actionCompletedPopupLabel: "postOnboarding.actions.syncAccounts.popupLabel",
  getNavigationParams: () => [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.syncAccountsMock,
        title: PostOnboardingActionId.syncAccountsMock,
      },
    },
  ],
};

export const recoverMock: PostOnboardingAction = {
  id: PostOnboardingActionId.recoverMock,
  Icon: Icons.ShieldCheck,
  title: "postOnboarding.drawer.actions.recover.title",
  titleCompleted: "postOnboarding.actions.recover.titleCompleted",
  description: "postOnboarding.drawer.actions.recover.description",
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

export const discoverWalletMock: PostOnboardingAction = {
  id: PostOnboardingActionId.discoverWalletMock,
  disabled: false,
  Icon: Icons.WalletInput,
  title: "postOnboarding.drawer.actions.discoverWallet.title",
  titleCompleted: "postOnboarding.actions.discoverWallet.titleCompleted",
  description: "postOnboarding.drawer.actions.discoverWallet.description",
  actionCompletedPopupLabel: "postOnboarding.actions.discoverWallet.popupLabel",
  getNavigationParams: () => [
    NavigatorName.PostOnboarding,
    {
      screen: ScreenName.PostOnboardingMockActionScreen,
      params: {
        id: PostOnboardingActionId.discoverWalletMock,
        title: PostOnboardingActionId.discoverWalletMock,
      },
    },
  ],
};
