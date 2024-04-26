import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
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
