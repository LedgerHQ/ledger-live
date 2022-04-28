import React, { ReactNode } from "react";
import styled, { useTheme } from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";

const Container = styled(Flex)`
  height: 100%;
  width: 100%;
  justify-content: space-between;
  align-items: center;
`;

const InnerContainer = styled(Flex).attrs({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  mx: "24px",
})``;

export type Props = {
  screenName: string;
  Illustration?: ReactNode;
  title: string;
  description: string;
};

const WebViewError = ({
  screenName,
  Illustration,
  title,
  description,
}: Props) => {
  const { colors } = useTheme();

  return (
    <Container style={{ backgroundColor: colors.background.main }}>
      <Text mt="14px" variant="h3">
        {screenName}
      </Text>
      <InnerContainer>
        {Illustration && Illustration}
        <Text mt="16px" variant="h2">
          {title}
        </Text>
        <Text
          mt="12px"
          textAlign="center"
          variant="paragraph"
          fontSize="13px"
          lineHeight="22.1px"
        >
          {description}
        </Text>
      </InnerContainer>
    </Container>
  );
};

export default WebViewError;
