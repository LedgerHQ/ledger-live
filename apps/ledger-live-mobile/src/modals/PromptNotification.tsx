import React, { useCallback, memo } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Button,
  Link as TextLink,
  Flex,
  BottomDrawer,
  Text,
} from "@ledgerhq/native-ui";

import Illustration from "../images/illustration/Illustration";
import PromptNotifGenericDark from "../images/illustration/Dark/_PromptNotifGeneric.png";
import PromptNotifGenericLight from "../images/illustration/Light/_PromptNotifGeneric.png";
import PromptNotifMarketDark from "../images/illustration/Dark/_PromptNotifMarket.png";
import PromptNotifMarketLight from "../images/illustration/Light/_PromptNotifMarket.png";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  type?: string;
};

function PromptNotification({ isOpen, onClose, type = "generic" }: Props) {
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
    <BottomDrawer
      id="PromptNotification"
      isOpen={isOpen}
      noCloseButton
    >
      <Flex>
        <Flex alignItems={"center"}>
          <NotifIllustration />
          <Text variant="h4" fontWeight="semiBold" color="neutral.c100" mt={5}>
            {t("notifications.prompt.title")}
          </Text>
          <Text variant="bodyLineHeight" fontWeight="medium" color="neutral.c70" textAlign="center" mt={3}>
            {t("notifications.prompt.desc")}
          </Text>
        </Flex>
        <Button type={"main"} mt={8} mb={7} onPress={onPressAllow}>
          {t("notifications.prompt.allow")}
        </Button>
        <TextLink type={"shade"} onPress={onClose}>
          {t("notifications.prompt.later")}
        </TextLink>
      </Flex>
    </BottomDrawer>
  );
}

export default memo(PromptNotification);
