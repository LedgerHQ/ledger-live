import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { useTranslation } from "react-i18next";

const CircleWrapper = styled.View`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 999px;
  padding: 16px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const AssetsEmptyList = () => {
  const { t } = useTranslation();
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="328px"
      flex={1}
      rowGap={24}
    >
      <CircleWrapper>
        <Icons.Search size="L" />
      </CircleWrapper>
      <Text
        variant="h3Inter"
        fontWeight="semiBold"
        lineHeight="28px"
        fontSize="20px"
        textAlign="center"
      >
        {t("modularDrawer.emptyAssetList")}
      </Text>
    </Flex>
  );
};
