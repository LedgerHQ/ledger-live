import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  BottomDrawer,
  Flex,
  Text,
  Link as TextLink,
  Button,
} from "@ledgerhq/native-ui";
import useNotifications from "../../logic/notifications";
import Illustration from "../../images/illustration/Illustration";
import PromptNotifGenericDark from "../../images/illustration/Dark/_PromptNotifGeneric.png";
import PromptNotifGenericLight from "../../images/illustration/Light/_PromptNotifGeneric.png";
import PromptNotifMarketDark from "../../images/illustration/Dark/_PromptNotifMarket.png";
import PromptNotifMarketLight from "../../images/illustration/Light/_PromptNotifMarket.png";
import { notificationsSelector } from "../../reducers/settings";
import { TrackScreen } from "../../analytics";

const PushNotificationsModal = () => {
  const { t } = useTranslation();
  const {
    initPushNotifications,
    initPushNotificationsData,
    cleanPushNotifications,
    pushNotificationsModalType,
    isPushNotificationsModalOpen,
    modalAllowNotifications,
    modalDelayLater,
    getIsNotifEnabled,
    listenForNotifications,
    clearNotificationsListeners,
    pushNotificationsOldRoute,
  } = useNotifications();
  const notificationsSettings = useSelector(notificationsSelector);

  useEffect(() => {
    initPushNotifications();

    return () => {
      cleanPushNotifications();
    };
  }, [initPushNotifications, cleanPushNotifications]);

  useEffect(() => {
    initPushNotificationsData();
  }, []);

  useEffect(() => {
    getIsNotifEnabled().then(isNotifEnabled => {
      if (isNotifEnabled) {
        if (notificationsSettings.allowed) {
          listenForNotifications();
        } else {
          clearNotificationsListeners();
        }
      }
    });
  }, [notificationsSettings.allowed]);

  const NotifIllustration = () =>
    pushNotificationsModalType === "market" ? (
      <Illustration
        lightSource={PromptNotifMarketLight}
        darkSource={PromptNotifMarketDark}
        width={300}
        height={141}
      />
    ) : (
      <Illustration
        lightSource={PromptNotifGenericLight}
        darkSource={PromptNotifGenericDark}
        width={300}
        height={141}
      />
    );
  return (
    <BottomDrawer
      id="PromptNotification"
      isOpen={isPushNotificationsModalOpen}
      noCloseButton
    >
      <TrackScreen
        category="Notification Prompt"
        name={
          pushNotificationsModalType === "generic"
            ? "Notification Prompt 1 - Notif"
            : "Notification Prompt 2 - Graph"
        }
        source={pushNotificationsOldRoute}
        type={"drawer"}
      />
      <Flex mb={4}>
        <Flex alignItems={"center"}>
          <NotifIllustration />
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
        <Button type={"main"} mt={8} mb={7} onPress={modalAllowNotifications}>
          {t("notifications.prompt.allow")}
        </Button>
        <TextLink type={"shade"} onPress={modalDelayLater}>
          {t("notifications.prompt.later")}
        </TextLink>
      </Flex>
    </BottomDrawer>
  );
};

export default PushNotificationsModal;
