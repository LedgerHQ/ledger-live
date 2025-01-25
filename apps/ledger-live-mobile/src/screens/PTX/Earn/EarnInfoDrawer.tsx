import { Button, Flex, Icons, Link, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
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
          <Circle size={64} bg={colors.opacityDefault.c05}>
            <Icons.InformationFill size="L" color={colors.opacityDefault.c80} />
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
