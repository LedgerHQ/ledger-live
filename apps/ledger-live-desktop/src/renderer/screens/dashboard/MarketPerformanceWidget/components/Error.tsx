import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

export function Error() {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" flex={1}>
      <Flex
        borderRadius={50}
        width={"60px"}
        height={"60px"}
        bg="opacityDefault.c10"
        alignItems="center"
        justifyContent="center"
      >
        <Icons.WarningFill color="palette.warning.c70" size="S" />
      </Flex>

      <Text variant="paragraph" fontWeight="semiBold" color="neutral.c100" mt={4} mb={4}>
        {t("dashboard.marketPerformanceWidget.error.title")}
      </Text>
      <Text variant="small" fontWeight="medium" color="neutral.c70">
        {t("dashboard.marketPerformanceWidget.error.description")}
      </Text>
    </Flex>
  );
}
