import { Box, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { TouchableOpacity } from "react-native";
import styled from "styled-components/native";

export type CardProps = {
  text: string;
  cta: string;
  onClick: () => void;
  testID: string;
  currentInstance?: boolean;
};

export const TinyCard = ({ text, cta, onClick, testID, currentInstance = false }: CardProps) => {
  return (
    <CardContainer
      flexDirection="row"
      p={"12px"}
      alignItems="center"
      testID={testID}
      justifyContent="space-between"
    >
      <Flex alignItems="center" flexDirection="row">
        {currentInstance && (
          <Flex mr={2}>
            <CurrentInstance />
          </Flex>
        )}

        <Text variant="body" fontWeight="semiBold" color="neutral.c100">
          {text}
        </Text>
      </Flex>
      <ButtonContainer onPress={onClick}>
        <Text
          fontSize={14}
          variant="body"
          fontWeight="semiBold"
          color={currentInstance ? "neutral.c70" : "primary.c80"}
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

const ButtonContainer = styled(TouchableOpacity)`
  &:hover {
    cursor: pointer;
  }
`;

const CurrentInstance = styled(Box)`
  height: 6px;
  width: 6px;
  border-radius: 50;
  background-color: ${p => p.theme.colors.success.c70};
`;
