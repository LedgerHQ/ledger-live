import { useTheme } from "styled-components/native";
import React, { useState } from "react";
import { Linking } from "react-native";
import { Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import Circle from "~/components/Circle";
import QueuedDrawer from "~/components/QueuedDrawer";
import { urls } from "~/utils/urls";

export function NeedMemoTagModal() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <Button type="accent" onPress={openModal}>
        {t("transfer.receive.memoTag.link")}
      </Button>

      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={closeModal}>
        <Flex alignItems="center" mb={7}>
          <Circle size={72} bg={colors.opacityDefault.c05}>
            <Icons.InformationFill size="L" color="primary.c80" />
          </Circle>
        </Flex>

        <Text variant="h4" textAlign="center" mb={6}>
          {t("transfer.receive.memoTag.title")}
        </Text>

        <Text variant="bodyLineHeight" textAlign="center" color="neutral.c80" mb={8}>
          {t("transfer.receive.memoTag.description")}
        </Text>

        <Button type="main" size="large" mb={6} onPress={closeModal}>
          {t("transfer.receive.memoTag.cta")}
        </Button>

        <Button
          type="accent"
          size="large"
          Icon={() => <Icons.ExternalLink size="S" color="primary.c80" />}
          onPress={() => Linking.openURL(urls.memoTag)}
        >
          {t("transfer.receive.memoTag.learnMore")}
        </Button>
      </QueuedDrawer>
    </>
  );
}
