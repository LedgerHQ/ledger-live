import React from "react";
import styled from "styled-components";
import { Flex, Text } from "@ledgerhq/react-ui";

type Props = {
  text: string;
  children?: React.ReactNode | undefined;
  Icon: React.ComponentType<{ size: number; color: string }>;
};

const Container = styled(Flex).attrs({
  position: "relative",
  px: 8,
  py: 10,
  borderRadius: 3,
  bg: "neutral.c30",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})``;

const ImportButton: React.FC<Props> = props => {
  const { text, children, Icon } = props;
  return (
    <Container>
      <Text variant="large" fontWeight="semiBold">
        {text}
      </Text>
      {children}
      <Flex bg="primary.c20" borderRadius={999} padding={5}>
        <Icon color="primary.c80" size={24} />
      </Flex>
    </Container>
  );
};

export default ImportButton;
