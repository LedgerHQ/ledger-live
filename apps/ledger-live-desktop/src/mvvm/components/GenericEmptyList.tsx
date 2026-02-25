import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui/index";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type GenericEmptyListProps = {
  translationKey?: string;
  icon?: React.ReactNode;
};

const CircleWrapper = styled.div`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 50%;
  padding: 16px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GenericEmptyList = ({ translationKey, icon }: GenericEmptyListProps) => {
  const { t } = useTranslation();
  const text = translationKey ? t(translationKey) : t("modularAssetDrawer.emptyAssetList");
  const Icon = icon || <Icons.Search size="XL" />;

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="80%"
      rowGap="16px"
    >
      <CircleWrapper>{Icon}</CircleWrapper>
      <Text variant="body" fontWeight="600" lineHeight="24px" fontSize="16px">
        {text}
      </Text>
    </Flex>
  );
};

export default GenericEmptyList;
