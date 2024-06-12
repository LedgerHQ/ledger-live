import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";
import Ellipsis from "~/renderer/components/Ellipsis";

export type CardProps = {
  text: string;
  cta: string;
  onClick: () => void;
  testId: string;
};

export const TinyCard = ({ text, cta, onClick, testId }: CardProps) => {
  return (
    <CardContainer
      flexDirection="row"
      p={"12px"}
      alignItems="center"
      data-testid={testId}
      justifyContent="space-between"
    >
      <Ellipsis>
        <Text fontSize={14} variant="body" fontWeight="semiBold" color="neutral.c100">
          {text}
        </Text>
      </Ellipsis>
      <ButtonContainer>
        <Text
          fontSize={14}
          variant="body"
          fontWeight="semiBold"
          color="primary.c80"
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
