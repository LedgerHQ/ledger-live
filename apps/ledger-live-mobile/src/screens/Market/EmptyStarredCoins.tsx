import { Flex, Text, Icon } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";

export default function EmptyStarredCoins() {
  const { t } = useTranslation();
  return (
    <Flex flex={1} flexDirection="column" alignItems="stretch" p="4" mt={70}>
      <Flex alignItems="center">
        <Icon name="Star" color="neutral.c100" size={120} />
      </Flex>
      <Text textAlign="center" variant="h2" my={3}>
        {t("market.warnings.starred.title")}
      </Text>
      <Text textAlign="center" variant="body" color="neutral.c70">
        {t("market.warnings.starred.desc")}
      </Text>
    </Flex>
  );
}
