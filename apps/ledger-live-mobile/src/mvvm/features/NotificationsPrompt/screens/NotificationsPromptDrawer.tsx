import React from "react";
import { useTranslation } from "~/context/Locale";
import { Flex, Link as TextLink, Button } from "@ledgerhq/native-ui";
import { useNotifications } from "LLM/features/NotificationsPrompt";
import QueuedDrawer from "~/components/QueuedDrawer";
import { NotificationsDrawerIllustration } from "../components/NotificationsDrawerIllustration";
import { NotificationsPromptContent } from "../components/NotificationsPromptContent";
import { TrackScreen } from "~/analytics";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

export const NotificationsPromptDrawer = () => {
  const { t } = useTranslation();
  const {
    drawerSource,
    isPushNotificationsModalOpen,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
    nextRepromptDelay,
    pushNotificationsDataOfUser,
  } = useNotifications();

  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

  const canShowVariant = featureNewWordingNotificationsDrawer?.enabled;

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isPushNotificationsModalOpen}
      noCloseButton
      onBackdropPress={handleCloseFromBackdropPress}
    >
      <TrackScreen
        category="Drawer push notification opt-in"
        source={drawerSource}
        repromptDelay={nextRepromptDelay}
        dismissedCount={pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0}
        variant={canShowVariant ? featureNewWordingNotificationsDrawer?.params?.variant : undefined}
      />

      <Flex mb={4}>
        <Flex alignItems={"center"}>
          <NotificationsDrawerIllustration type={drawerSource} />
          <NotificationsPromptContent />
        </Flex>
        <Button
          type={"main"}
          mt={8}
          mb={7}
          onPressIn={handleAllowNotificationsPress}
          testID="notifications-prompt-allow"
        >
          {t("notifications.prompt.allow")}
        </Button>
        <TextLink
          type={"shade"}
          onPressIn={handleDelayLaterPress}
          testID="notifications-prompt-later"
        >
          {t("notifications.prompt.later")}
        </TextLink>
      </Flex>
    </QueuedDrawer>
  );
};
