import React, { useCallback, memo } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Text, Button, Link as TextLink, Flex } from "@ledgerhq/native-ui";

import BottomModal, { Props as ModalProps } from "../components/BottomModal";
import Illustration from "../images/illustration/Illustration";
import PromptNotifGenericDark from "../images/illustration/Dark/_PromptNotifGeneric.png";
import PromptNotifGenericLight from "../images/illustration/Light/_PromptNotifGeneric.png";
import PromptNotifMarketDark from "../images/illustration/Dark/_PromptNotifMarket.png";
import PromptNotifMarketLight from "../images/illustration/Light/_PromptNotifMarket.png";

function PromptNotification({
  isOpened,
  onClose,
  type = "generic",
}: ModalProps & { type?: "generic" | "market" }) {
  const { t } = useTranslation();

  const onPressAllow = useCallback(() => {
    if (onClose) onClose();
    Linking.openSettings();
  }, [onClose]);

  const NotifIllustration = () =>
    type === "market" ? (
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
    <BottomModal id="PromptNotification" isOpened={isOpened} noCloseButton>
      <Flex alignItems={"center"}>
        <NotifIllustration />
        <Text
          variant={"h4"}
          textAlign={"center"}
          mt={type === "market" ? 9 : 7}
        >
          {t("notifications.prompt.title")}
        </Text>
        <Text
          variant={"body"}
          textAlign={"center"}
          mt={3}
          color={"neutral.c70"}
        >
          {t("notifications.prompt.desc")}
        </Text>
        <Button type={"main"} mt={8} mb={7} onPress={onPressAllow}>
          {t("notifications.prompt.allow")}
        </Button>
        <TextLink type={"shade"} onPress={onClose}>
          {t("notifications.prompt.later")}
        </TextLink>
      </Flex>
    </BottomModal>
  );
}

export default memo(PromptNotification);
