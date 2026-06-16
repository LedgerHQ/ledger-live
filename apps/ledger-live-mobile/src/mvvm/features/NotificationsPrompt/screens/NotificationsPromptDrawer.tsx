import React, { useCallback, useRef } from "react";
import { useTranslation } from "~/context/Locale";
import { Flex, Link as TextLink, Button } from "@ledgerhq/native-ui";
import { useNotifications } from "LLM/features/NotificationsPrompt";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { NotificationsDrawerIllustration } from "LLM/features/NotificationsPrompt/components/NotificationsDrawerIllustration";
import { NotificationsPromptContent } from "LLM/features/NotificationsPrompt/components/NotificationsPromptContent";
import { resolveDrawerPromptTargetForAnalytics } from "LLM/features/NotificationsPrompt/new/notificationsPromptAnalytics";
import { getNotificationsPromptCopy } from "LLM/features/NotificationsPrompt/utils/getNotificationsPromptCopy";
import type { NotificationPromptTarget } from "LLM/features/NotificationsPrompt/types";
import { TrackScreen } from "~/analytics";
import { useFeature } from "@features/platform-feature-flags";
import { AB_TESTING_VARIANTS } from "LLM/features/NotificationsPrompt/types/variants";
import type { NotificationsState } from "~/reducers/types";

type DrawerDisplayState = {
  drawerSource: NotificationsState["drawerSource"];
  drawerPromptTarget: NotificationPromptTarget | undefined;
};

export const NotificationsPromptDrawer = () => {
  const { t } = useTranslation();
  const {
    drawerSource,
    drawerPromptTarget,
    isPushNotificationsModalOpen,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
    nextRepromptDelay,
    pushNotificationsDataOfUser,
  } = useNotifications();

  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

  const drawerDisplayStateRef = useRef<DrawerDisplayState>({
    drawerSource: undefined,
    drawerPromptTarget: undefined,
  });

  if (isPushNotificationsModalOpen) {
    drawerDisplayStateRef.current = {
      drawerSource,
      drawerPromptTarget,
    };
  }

  const { drawerSource: displayedDrawerSource, drawerPromptTarget: displayedDrawerPromptTarget } =
    drawerDisplayStateRef.current;

  const handleModalHide = useCallback(() => {
    drawerDisplayStateRef.current = {
      drawerSource: undefined,
      drawerPromptTarget: undefined,
    };
  }, []);

  const canShowVariant = featureNewWordingNotificationsDrawer?.enabled;
  const isVariantB =
    featureNewWordingNotificationsDrawer?.enabled === true &&
    featureNewWordingNotificationsDrawer?.params?.variant === AB_TESTING_VARIANTS.B;
  const { allowKey, laterKey } = getNotificationsPromptCopy(
    displayedDrawerPromptTarget,
    isVariantB,
  );

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isPushNotificationsModalOpen}
      noCloseButton
      onBackdropPress={handleCloseFromBackdropPress}
      onModalHide={handleModalHide}
    >
      <TrackScreen
        category="Drawer push notification opt-in"
        source={displayedDrawerSource}
        drawerPromptTarget={resolveDrawerPromptTargetForAnalytics(displayedDrawerPromptTarget)}
        repromptDelay={nextRepromptDelay}
        dismissedCount={pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0}
        variant={canShowVariant ? featureNewWordingNotificationsDrawer?.params?.variant : undefined}
      />

      <Flex mb={4}>
        <Flex alignItems={"center"}>
          <NotificationsDrawerIllustration promptTarget={displayedDrawerPromptTarget} />
          <NotificationsPromptContent promptTarget={displayedDrawerPromptTarget} />
        </Flex>
        <Button
          type={"main"}
          mt={8}
          mb={7}
          onPress={handleAllowNotificationsPress}
          testID="notifications-prompt-allow"
        >
          {t(allowKey)}
        </Button>
        <TextLink
          type={"shade"}
          onPress={handleDelayLaterPress}
          testID="notifications-prompt-later"
        >
          {t(laterKey)}
        </TextLink>
      </Flex>
    </QueuedDrawer>
  );
};
