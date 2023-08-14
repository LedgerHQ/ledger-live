import React from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

import { Track } from "../../../analytics";
import QueuedDrawer from "../../../components/QueuedDrawer";

interface EarnInfoDrawerProps {
  modalOpened: boolean;
  closeModal: () => void;
  messageTitle: string;
  message: string;
}
export function EarnInfoDrawer({
  modalOpened,
  closeModal,
  messageTitle,
  message,
}: EarnInfoDrawerProps) {
  const { t } = useTranslation();

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
        <Button onPress={() => closeModal()} type="main">
          {t("common.close")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}
