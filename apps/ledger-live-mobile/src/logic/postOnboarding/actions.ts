import {
  PostOnboardingAction,
  PostOnboardingActionId,
  StartActionArgs,
} from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";

export const assetsTransferAction: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransfer,
  disabled: false,
  featureFlagId: "postOnboardingAssetsTransfer",
  Icon: Icons.Lock,
  title: "postOnboarding.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.actions.assetsTransfer.description",
  buttonLabelForAnalyticsEvent: "Secure your assets on Ledger",
  getNavigationParams: () => [undefined],
  getIsAlreadyCompletedByState: ({ accounts }) => {
    return !!accounts && accounts.some(account => account?.balance.isGreaterThan(0));
  },
};

export const buyCryptoAction: PostOnboardingAction = {
  id: PostOnboardingActionId.buyCrypto,
  disabled: false,
  Icon: Icons.Dollar,
  title: "postOnboarding.actions.buyCrypto.title",
  titleCompleted: "postOnboarding.actions.buyCrypto.titleCompleted",
  description: "postOnboarding.actions.buyCrypto.description",
  buttonLabelForAnalyticsEvent: "Buy Crypto",
  shouldCompleteOnStart: true,
  getNavigationParams: () => [
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
  title: "postOnboarding.actions.customImage.title",
  titleCompleted: "postOnboarding.actions.customImage.titleCompleted",
  description: "postOnboarding.actions.customImage.description",
  actionCompletedPopupLabel: "postOnboarding.actions.customImage.titleCompleted",
  buttonLabelForAnalyticsEvent: "Set lock screen picture",
  getNavigationParams: ({ deviceModelId, referral }) => [
    NavigatorName.CustomImage,
    {
      screen: ScreenName.CustomImageStep0Welcome,
      params: {
        device: null,
        deviceModelId,
        ...(referral ? { referral } : {}),
      },
    },
  ],
};

export const syncAccountsAction: PostOnboardingAction = {
  id: PostOnboardingActionId.syncAccounts,
  featureFlagId: "llmLedgerSyncEntryPoints",
  featureFlagParamId: "postOnboarding",
  Icon: Icons.Refresh,
  title: "postOnboarding.actions.syncAccounts.title",
  titleCompleted: "postOnboarding.actions.syncAccounts.titleCompleted",
  description: "postOnboarding.actions.syncAccounts.description",
  actionCompletedPopupLabel: "postOnboarding.actions.syncAccounts.popupLabel",
  buttonLabelForAnalyticsEvent: "Sync accounts",
  getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => {
    return !!isLedgerSyncActive;
  },
  startAction: ({ openActivationDrawer }: StartActionArgs) => {
    openActivationDrawer?.();
  },
};
