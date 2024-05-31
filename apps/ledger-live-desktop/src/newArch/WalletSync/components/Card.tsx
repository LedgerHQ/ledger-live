import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Ellipsis from "~/renderer/components/Ellipsis";

export type CardProps = {
  title: string;
  description: string;
  onClick: () => void;
  leftIcon: React.ReactNode;
};

export const Card = ({ title, description, onClick, leftIcon }: CardProps) => {
  const { t } = useTranslation();
  return (
    <CardContainer flexDirection="row" height={70} alignItems="center" px={3} onClick={onClick}>
      <LeftContainer alignItems="center" justifyContent="center">
        {leftIcon}
      </LeftContainer>
      <Flex flexDirection="column" flex={1} justifyContent="space-between" ml={2}>
        <Ellipsis>
          <Text fontSize={14} variant="body" color="neutral.c100">
            {t(title)}
          </Text>
        </Ellipsis>
        <Ellipsis>
          <Text variant="small" color="neutral.c70">
            {t(description)}
          </Text>
        </Ellipsis>
      </Flex>
    </CardContainer>
  );
};

const LeftContainer = styled(Flex)``;

const CardContainer = styled(Flex)`
  border-radius: 12px;
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  &:hover {
    cursor: pointer;
  }
`;
