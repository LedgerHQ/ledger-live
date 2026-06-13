import { useFeature } from "@features/platform-feature-flags";
import { useTranslation } from "~/context/Locale";
import { useNotifications } from "LLM/features/NotificationsPrompt";
import { resolveDrawerPromptTargetForAnalytics } from "LLM/features/NotificationsPrompt/new/notificationsPromptAnalytics";
import { resolveDismissedPromptCount } from "LLM/features/NotificationsPrompt/utils/dismissedPrompts";
import { getNotificationsPromptCopy } from "LLM/features/NotificationsPrompt/utils/getNotificationsPromptCopy";
import type { ABTestingVariants } from "LLM/features/NotificationsPrompt/types/variants";
import { AB_TESTING_VARIANTS } from "LLM/features/NotificationsPrompt/types/variants";

type WordingFeature = {
  readonly enabled?: boolean;
  readonly params?: {
    readonly variant?: ABTestingVariants;
  };
};

const getEnabledVariant = (featureNewWordingNotificationsDrawer?: WordingFeature | null) =>
  featureNewWordingNotificationsDrawer?.enabled === true
    ? featureNewWordingNotificationsDrawer?.params?.variant
    : undefined;

export const useNotificationsPromptDrawerViewModel = () => {
  const { t } = useTranslation();
  const {
    drawerSource,
    drawerPromptTarget,
    isPushNotificationsModalOpen,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
    handleModalHide,
    nextRepromptDelay,
    pushNotificationsDataOfUser,
  } = useNotifications();
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

  const enabledVariant = getEnabledVariant(featureNewWordingNotificationsDrawer);
  const isVariantB = enabledVariant === AB_TESTING_VARIANTS.B;
  const { titleKey, descriptionKey, allowKey, laterKey } = getNotificationsPromptCopy(
    drawerPromptTarget,
    isVariantB,
  );
  const drawerPromptTargetForAnalytics = resolveDrawerPromptTargetForAnalytics(drawerPromptTarget);
  const dismissedCount = resolveDismissedPromptCount(
    pushNotificationsDataOfUser,
    drawerPromptTargetForAnalytics,
  );

  return {
    isOpen: isPushNotificationsModalOpen,
    promptTarget: drawerPromptTarget,
    title: t(titleKey),
    description: t(descriptionKey),
    allowLabel: t(allowKey),
    laterLabel: t(laterKey),
    onAllowNotificationsPress: handleAllowNotificationsPress,
    onDelayLaterPress: handleDelayLaterPress,
    onCloseFromBackdropPress: handleCloseFromBackdropPress,
    onModalHide: handleModalHide,
    trackScreenProps: {
      category: "Drawer push notification opt-in",
      source: drawerSource,
      drawerPromptTarget: drawerPromptTargetForAnalytics,
      repromptDelay: nextRepromptDelay,
      dismissedCount,
      variant: enabledVariant,
    },
  };
};
