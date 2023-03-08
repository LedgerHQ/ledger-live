import {
  PostOnboardingAction,
  PostOnboardingActionId,
} from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";

export const customImageAction: PostOnboardingAction = {
  id: PostOnboardingActionId.customImage,
  Icon: Icons.PhotographMedium,
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
  Icon: Icons.GiftCardMedium,
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

export const assetsTransferAction: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransfer,
  disabled: true,
  featureFlagId: "postOnboardingAssetsTransfer",
  Icon: Icons.LockClosedMedium,
  title: "postOnboarding.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.actions.assetsTransfer.description",
  actionCompletedPopupLabel: "postOnboarding.actions.assetsTransfer.popupLabel",
  buttonLabelForAnalyticsEvent: "Secure your assets on Ledger",
};
