import { Alert, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "~/context/Locale";

export function ProcessingScreen() {
  const { t } = useTranslation();
  return (
    <Flex
      flex={1}
      alignItems="stretch"
      justifyContent="space-between"
      px={6}
      pb={6}
      backgroundColor="background.main"
      testID="processing-screen"
    >
      <Flex alignItems="center" justifyContent="center" flex={1}>
        <Flex alignItems="center" justifyContent="center" mb={8}>
          <InfiniteLoader size={60} />
        </Flex>
        <Text variant="h4" fontWeight="semiBold" textAlign="center" color="neutral.c100" mb={4}>
          {t("canton.onboard.processing.title")}
        </Text>
        <Text variant="body" textAlign="center" color="neutral.c80" mb={3}>
          {t("canton.onboard.processing.description")}
        </Text>
      </Flex>
      <Flex mb={8}>
        <Alert type="info" title={t("canton.onboard.processing.keepDeviceNearby")} />
      </Flex>
    </Flex>
  );
}
