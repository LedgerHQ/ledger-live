import React, { useCallback, useEffect, useState } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

import { Track } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import { useDispatch, useSelector } from "react-redux";
import { earnInfoModalSelector } from "~/reducers/earn";
import { setEarnInfoModal } from "~/actions/earn";

export function EarnInfoDrawer() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [modalOpened, setModalOpened] = useState(false);

  const openModal = useCallback(() => setModalOpened(true), []);

  const closeModal = useCallback(async () => {
    await dispatch(setEarnInfoModal({}));
    await setModalOpened(false);
  }, [dispatch]);
  const { message, messageTitle } = useSelector(earnInfoModalSelector);

  useEffect(() => {
    if (!modalOpened && (message || messageTitle)) {
      openModal();
    }
  }, [openModal, message, messageTitle, modalOpened]);

  return (
    <QueuedDrawer isRequestingToBeOpened={modalOpened} onClose={closeModal}>
      <Flex rowGap={52}>
        <Track onMount event="Earn Info Modal" />
        <Flex rowGap={56}>
          <Flex rowGap={16}>
            <Text variant="h4" fontFamily="Inter" textAlign="center" fontWeight="bold">
              {messageTitle}
            </Text>
            <Text variant="body" lineHeight="21px" color="neutral.c70" textAlign="center">
              {message}
            </Text>
          </Flex>
        </Flex>
        <Button onPress={closeModal} type="main">
          {t("common.close")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}
