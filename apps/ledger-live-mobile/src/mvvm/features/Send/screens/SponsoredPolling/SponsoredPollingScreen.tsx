import React from "react";
import { StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import InfiniteLoader from "~/components/InfiniteLoader";
import { useTranslation } from "~/context/Locale";
import { useSponsoredPollingViewModel } from "./hooks/useSponsoredPollingViewModel";

export function SponsoredPollingScreen() {
  const { t } = useTranslation();
  const { elapsedLabel } = useSponsoredPollingViewModel();

  return (
    <Flex
      style={StyleSheet.absoluteFill}
      bg="background.main"
      alignItems="center"
      justifyContent="center"
      rowGap={16}
    >
      <InfiniteLoader testID="sponsored-polling-loader" />
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100" textAlign="center">
        {t("newSendFlow.sponsoredPolling.waiting")}
      </Text>
      <Text variant="body" color="neutral.c80" textAlign="center">
        {elapsedLabel}
      </Text>
    </Flex>
  );
}
