import React from "react";
import Actions from "./Actions";
import IconsHeader from "./IconsHeader";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

const Activation = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={24}>
      <IconsHeader />
      <Flex justifyContent="center" alignItems="center" flexDirection="column" rowGap={16}>
        <Text variant="h4" textAlign="center" lineHeight="32.4px">
          {t("walletSync.activation.drawerAndSettings.title")}
        </Text>
        <Text
          variant="bodyLineHeight"
          textAlign="center"
          color={colors.neutral.c70}
          alignSelf={"center"}
          maxWidth={330}
          numberOfLines={3}
        >
          {t("walletSync.activation.drawerAndSettings.description")}
        </Text>
      </Flex>
      <Actions />
    </Flex>
  );
};

export default Activation;
