import { Box, Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";
import Ellipsis from "~/renderer/components/Ellipsis";

export type CardProps = {
  text: string;
  cta: string;
  onClick: () => void;
  testId: string;
  currentInstance?: boolean;
};

export const TinyCard = ({ text, cta, onClick, testId, currentInstance = false }: CardProps) => {
  return (
    <CardContainer
      flexDirection="row"
      p={"12px"}
      alignItems="center"
      data-testid={testId}
      justifyContent="space-between"
    >
      <Flex alignItems="center">
        {currentInstance && (
          <Flex mr={2}>
            <CurrentInstance />
          </Flex>
        )}
        <Ellipsis>
          <Text fontSize={14} variant="body" fontWeight="semiBold" color="neutral.c100">
            {text}
          </Text>
        </Ellipsis>
      </Flex>
      <ButtonContainer>
        <Text
          fontSize={14}
          variant="body"
          fontWeight="semiBold"
          color={currentInstance ? "neutral.c70" : "primary.c80"}
          onClick={onClick}
        >
          {cta}
        </Text>
      </ButtonContainer>
    </CardContainer>
  );
};

const CardContainer = styled(Flex)`
  border-radius: 12px;
  background-color: ${p => p.theme.colors.opacityDefault.c05};
`;

const ButtonContainer = styled(Flex)`
  &:hover {
    cursor: pointer;
  }
`;

const CurrentInstance = styled(Box)`
  height: 6px;
  width: 6px;
  border-radius: 50%;
  background-color: ${p => p.theme.colors.success.c70};
`;
