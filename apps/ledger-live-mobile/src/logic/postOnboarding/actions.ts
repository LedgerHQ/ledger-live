import {
  PostOnboardingAction,
  PostOnboardingActionId,
  StartActionArgs,
} from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";
import { getStoreValue } from "~/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

export const assetsTransferAction: PostOnboardingAction = {
  id: PostOnboardingActionId.assetsTransfer,
  disabled: false,
  Icon: Icons.Lock,
  title: "postOnboarding.drawer.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.drawer.actions.assetsTransfer.description",
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
  title: "postOnboarding.drawer.actions.customImage.title",
  titleCompleted: "postOnboarding.actions.customImage.titleCompleted",
  description: "postOnboarding.drawer.actions.customImage.description",
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
  title: "postOnboarding.drawer.actions.syncAccounts.title",
  titleCompleted: "postOnboarding.actions.syncAccounts.titleCompleted",
  description: "postOnboarding.drawer.actions.syncAccounts.description",
  actionCompletedPopupLabel: "postOnboarding.actions.syncAccounts.popupLabel",
  buttonLabelForAnalyticsEvent: "Sync accounts",
  getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => {
    return !!isLedgerSyncActive;
  },
  startAction: ({ openActivationDrawer }: StartActionArgs) => {
    openActivationDrawer?.();
  },
};

export const recoverAction: PostOnboardingAction = {
  id: PostOnboardingActionId.recover,
  Icon: Icons.ShieldCheck,
  title: "postOnboarding.drawer.actions.recover.title",
  titleCompleted: "postOnboarding.actions.recover.titleCompleted",
  description: "postOnboarding.drawer.actions.recover.description",
  buttonLabelForAnalyticsEvent: "Subscribe to Ledger Recover",
  actionCompletedPopupLabel: "postOnboarding.actions.recover.popupLabel",
  getIsAlreadyCompleted: async ({ protectId }) => {
    try {
      const recoverSubscriptionState = await getStoreValue("SUBSCRIPTION_STATE", protectId);

      return recoverSubscriptionState === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE;
    } catch {
      return false;
    }
  },
  getNavigationParams: ({ protectId }) => [
    NavigatorName.Base,
    {
      screen: ScreenName.Recover,
      params: {
        platform: protectId,
        redirectTo: "upsell",
        source: "llm-postonboarding-hub",
      },
    },
  ],
};
