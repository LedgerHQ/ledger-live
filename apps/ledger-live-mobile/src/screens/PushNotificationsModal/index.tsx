import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text, Link as TextLink, Button } from "@ledgerhq/native-ui";
import { useNotifications } from "~/logic/notifications";
import QueuedDrawer from "~/components/QueuedDrawer";
import { PushNotificationsModalIllustration } from "./PushNotificationsModalIllustration";
import { TrackScreen } from "~/analytics";

export const DRAWER_PAGE_NAME_TRACK_EVENT = "Drawer push notification opt-in";

const PushNotificationsModal = () => {
  const { t } = useTranslation();
  const {
    initPushNotificationsData,
    drawerSource,
    isPushNotificationsModalOpen,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
    getRepromptDelay,
    pushNotificationsDataOfUser,
  } = useNotifications();

  useEffect(() => {
    initPushNotificationsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isPushNotificationsModalOpen}
      noCloseButton
      onBackdropPress={handleCloseFromBackdropPress}
    >
      <TrackScreen
        category={DRAWER_PAGE_NAME_TRACK_EVENT}
        source={drawerSource}
        repromptDelay={
          getRepromptDelay(pushNotificationsDataOfUser?.dismissedOptInDrawerAtList) ?? undefined
        }
        dismissedCount={pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0}
        // variant="A | B"
      />

      <Flex mb={4}>
        <Flex alignItems={"center"}>
          <PushNotificationsModalIllustration type={drawerSource} />

          <Text variant="h4" fontWeight="semiBold" color="neutral.c100" mt={5}>
            {t("notifications.prompt.title")}
          </Text>
          <Text
            variant="bodyLineHeight"
            fontWeight="medium"
            color="neutral.c70"
            textAlign="center"
            mt={3}
          >
            {t("notifications.prompt.desc")}
          </Text>
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

export default PushNotificationsModal;
