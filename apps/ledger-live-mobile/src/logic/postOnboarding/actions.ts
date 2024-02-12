import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";

export const assetsTransferAction: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransfer,
  disabled: false,
  featureFlagId: "postOnboardingAssetsTransfer",
  Icon: Icons.ArrowDown,
  title: "postOnboarding.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.actions.assetsTransfer.description",
  actionCompletedPopupLabel: "postOnboarding.actions.assetsTransfer.popupLabel",
  buttonLabelForAnalyticsEvent: "Secure your assets on Ledger",
  navigationParams: [
    NavigatorName.ReceiveFunds,
    {
      screen: ScreenName.ReceiveSelectCrypto,
      params: {
        device: null,
      },
    },
  ],
};

export const buyCryptoAction: PostOnboardingAction = {
  id: PostOnboardingActionId.buyCrypto,
  disabled: false,
  Icon: Icons.Plus,
  title: "postOnboarding.actions.buyCrypto.title",
  titleCompleted: "postOnboarding.actions.buyCrypto.titleCompleted",
  description: "postOnboarding.actions.buyCrypto.description",
  actionCompletedPopupLabel: "postOnboarding.actions.buyCrypto.popupLabel",
  buttonLabelForAnalyticsEvent: "Buy Crypto",
  navigationParams: [
    NavigatorName.Exchange,
    {
      screen: ScreenName.ExchangeBuy,
      params: {
        device: null,
      },
    },
  ],
};

export const customImageAction: PostOnboardingAction = {
  id: PostOnboardingActionId.customImage,
  Icon: Icons.PictureImage,
  featureFlagId: "customImage",
  title: "postOnboarding.actions.customImage.title",
  titleCompleted: "postOnboarding.actions.customImage.titleCompleted",
  description: "postOnboarding.actions.customImage.description",
  actionCompletedPopupLabel: "postOnboarding.actions.customImage.popupLabel",
  navigationParams: [
    NavigatorName.CustomImage,
    {
      screen: ScreenName.CustomImageStep0Welcome,
      params: {
        device: null,
      },
    },
  ],
  buttonLabelForAnalyticsEvent: "Set lock screen picture",
};

export const claimNftAction: PostOnboardingAction = {
  id: PostOnboardingActionId.claimNft,
  disabled: false,
  Icon: Icons.Gift,
  featureFlagId: "postOnboardingClaimNft",
  title: "postOnboarding.actions.claimNft.title",
  titleCompleted: "postOnboarding.actions.claimNft.titleCompleted",
  description: "postOnboarding.actions.claimNft.description",
  tagLabel: "postOnboarding.actions.claimNft.tagLabel",
  actionCompletedPopupLabel: "postOnboarding.actions.claimNft.popupLabel",
  navigationParams: [
    NavigatorName.ClaimNft,
    {
      screen: ScreenName.ClaimNftWelcome,
    },
  ],
  buttonLabelForAnalyticsEvent: "Claim Ledger NFT",
};
