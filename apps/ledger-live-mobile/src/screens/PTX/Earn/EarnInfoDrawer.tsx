import { Button, Flex, Link, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useDispatch, useSelector } from "react-redux";
import { setEarnInfoModal } from "~/actions/earn";
import { Track } from "~/analytics";
import Circle from "~/components/Circle";
import QueuedDrawer from "~/components/QueuedDrawer";
import { earnInfoModalSelector } from "~/reducers/earn";

export function EarnInfoDrawer() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [modalOpened, setModalOpened] = useState(false);

  const openModal = useCallback(() => setModalOpened(true), []);

  const closeModal = useCallback(async () => {
    await dispatch(setEarnInfoModal({}));
    await setModalOpened(false);
  }, [dispatch]);
  const { message, messageTitle, learnMoreLink } = useSelector(earnInfoModalSelector);

  useEffect(() => {
    if (!modalOpened && (message || messageTitle)) {
      openModal();
    }
  }, [openModal, message, messageTitle, modalOpened]);

  const onLearnMorePress = useCallback(() => {
    if (learnMoreLink) {
      Linking.openURL(learnMoreLink);
    }
  }, [learnMoreLink]);

  const { colors } = useTheme();

  return (
    <QueuedDrawer isRequestingToBeOpened={modalOpened} onClose={closeModal}>
      <Flex rowGap={32}>
        <Track onMount event="Earn Info Modal" />
        <Flex rowGap={16} alignItems="center">
          <Circle size={64} bg={colors.lightGrey}>
            <Svg width={32} height={32} viewBox="0 0 33 34">
              <Path
                fill={colors.darkGrey}
                d="M0.399902 16.9999C0.399902 8.09167 7.60811 0.899902 16.4999 0.899902C25.3924 0.899902 32.5999 8.10739 32.5999 16.9999C32.5999 25.8924 25.3924 33.0999 16.4999 33.0999C7.59167 33.0999 0.399902 25.8917 0.399902 16.9999ZM16.4836 9.23325L16.4751 9.23327L16.4669 9.23325C16.436 9.23325 16.4054 9.23452 16.3752 9.23702C15.5854 9.29214 14.9669 9.94551 14.9669 10.7499C14.9669 11.5455 15.6145 12.2666 16.4836 12.2666C16.9294 12.2666 17.3024 12.0659 17.551 11.8173C17.7995 11.5688 18.0002 11.1958 18.0002 10.7499C18.0002 9.90079 17.3275 9.29911 16.5899 9.23832C16.5549 9.23497 16.5194 9.23325 16.4836 9.23325ZM17.6002 16.9999C17.6002 16.3924 17.1077 15.8999 16.5002 15.8999C15.8927 15.8999 15.4002 16.3924 15.4002 16.9999V25.3333C15.4002 25.9408 15.8927 26.4333 16.5002 26.4333C17.1077 26.4333 17.6002 25.9408 17.6002 25.3333V16.9999Z"
              />
            </Svg>
          </Circle>
          <Text variant="h4" fontFamily="Inter" textAlign="center" fontWeight="bold">
            {messageTitle}
          </Text>
          <Text variant="body" lineHeight="21px" color="neutral.c70" textAlign="center">
            {message}
          </Text>
        </Flex>
        <Button onPress={closeModal} type="main">
          {t("common.close")}
        </Button>
        {!!learnMoreLink && (
          <Link type="main" size="large" onPress={onLearnMorePress}>
            {t("common.learnMore")}
          </Link>
        )}
      </Flex>
    </QueuedDrawer>
  );
}
